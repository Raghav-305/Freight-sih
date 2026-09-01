import pickle
from pathlib import Path

import numpy as np
import pandas as pd


HORIZONS = [7, 30, 60, 90]
LAGS = [1, 7, 30, 60, 90]
ROLLING_WINDOWS = [7, 30]
MODEL_VERSION = "panamax_freight_v7"


def project_root():
    return Path(__file__).resolve().parents[2]


def engineer_features(freight):
    data = freight.sort_values(["route_id", "date"]).reset_index(drop=True).copy()

    for h in HORIZONS:
        data[f"target_{h}d"] = (
            data.groupby("route_id")["freight_usd_mt"].shift(-h)
        )

    for lag in LAGS:
        data[f"freight_lag_{lag}d"] = (
            data.groupby("route_id")["freight_usd_mt"].shift(lag)
        )

    for w in ROLLING_WINDOWS:
        data[f"freight_rolling_mean_{w}d"] = (
            data.groupby("route_id")["freight_usd_mt"]
            .transform(lambda x: x.shift(1).rolling(w).mean())
        )

    data["year"] = data["date"].dt.year
    data["month"] = data["date"].dt.month
    data["day_of_week"] = data["date"].dt.dayofweek
    data["day_of_year"] = data["date"].dt.dayofyear

    history_features = [f"freight_lag_{l}d" for l in LAGS] + [
        f"freight_rolling_mean_{w}d" for w in ROLLING_WINDOWS
    ]

    numerical_features = [
        "distance_nm",
        "synthetic_bunker_price_usd_mt",
        "freight_usd_mt",
        *history_features,
        "year",
        "month",
        "day_of_week",
        "day_of_year",
    ]

    return data, history_features, numerical_features


def build_matrix(df, artifact, numerical_features):
    categorical = artifact["categorical_features"]
    encoder = artifact["encoder"]

    cat = encoder.transform(df[categorical])
    num = df[numerical_features].to_numpy()

    return np.hstack([cat, num])


def compute_residual_quantiles(model, X_validation: np.ndarray, validation: pd.DataFrame, horizon: int) -> dict[str, float] | None:
    target_column = f"target_{horizon}d"
    if target_column not in validation.columns:
        return None

    mask = validation[target_column].notna().to_numpy()
    if mask.sum() == 0:
        return None

    actual = validation[target_column][mask].to_numpy()
    predicted = model.predict(X_validation[mask])
    residuals = actual - predicted
    quantiles = np.quantile(residuals, [0.10, 0.25, 0.50, 0.75, 0.90])
    return {
        "p10": float(quantiles[0]),
        "p25": float(quantiles[1]),
        "p50": float(quantiles[2]),
        "p75": float(quantiles[3]),
        "p90": float(quantiles[4]),
    }


def main():
    root = project_root()

    model_path = (
        root
        / "ml"
        / "models"
        / "forecasting"
        / "xgboost"
        / MODEL_VERSION
        / "model.pkl"
    )
    data_path = root / "data" / "raw" / "freight" / "freight_rates_daily.csv"
    output_dir = root / "ml" / "evaluation" / "uncertainty"
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(model_path, "rb") as f:
        artifact = pickle.load(f)

    freight = pd.read_csv(data_path)
    freight["date"] = pd.to_datetime(freight["date"])

    data, history_features, numerical_features = engineer_features(freight)

    validation = data[
        (data["date"] >= "2025-01-01")
        & (data["date"] < "2025-10-01")
    ].copy()

    validation = validation.dropna(subset=history_features).copy()

    latest = (
        data.sort_values(["route_id", "date"])
        .groupby("route_id")
        .tail(1)
        .copy()
    )
    latest = latest.dropna(subset=history_features).copy()

    X_val = build_matrix(validation, artifact, numerical_features)
    X_latest = build_matrix(latest, artifact, numerical_features)

    final = latest[
        ["route_id", "date", "freight_usd_mt"]
    ].copy()
    final.rename(
        columns={
            "date": "as_of_date",
            "freight_usd_mt": "latest_freight_usd_mt",
        },
        inplace=True,
    )

    residual_rows = []

    for h in HORIZONS:
        target = validation[f"target_{h}d"]
        mask = target.notna().to_numpy()

        if mask.sum() == 0:
            print(f"{h}-day: no valid validation targets; skipped.")
            continue

        model = artifact["models"][h]
        residuals = compute_residual_quantiles(model, X_val, validation, h)
        if residuals is None:
            print(f"{h}-day: no valid validation targets; skipped.")
            continue

        latest_point = model.predict(X_latest)

        for name, offset in residuals.items():
            final[f"{name}_{h}d_freight_usd_mt"] = latest_point + offset

        residual_rows.append(
            {
                "horizon": f"{h}-day",
                "validation_rows": int(mask.sum()),
                **{f"{k}_residual": v for k, v in residuals.items()},
            }
        )

        print(
            f"{h}-day: estimated uncertainty from "
            f"{mask.sum()} validation rows."
        )

    final.to_csv(
        output_dir / "forecast_uncertainty.csv",
        index=False,
    )

    pd.DataFrame(residual_rows).to_csv(
        output_dir / "residual_quantiles_by_horizon.csv",
        index=False,
    )

    print(f"\nForecast uncertainty saved to: {output_dir}")
    print("IMPORTANT: these are empirical residual-based bands.")


if __name__ == "__main__":
    main()
