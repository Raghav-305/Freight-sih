from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import shap

MODEL_VERSION = "panamax_freight_v7"
HORIZONS = [7, 30, 60, 90]


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_artifact() -> dict[str, Any]:
    model_path = (
        project_root()
        / "ml" / "models" / "forecasting" / "xgboost" / MODEL_VERSION / "model.pkl"
    )
    with open(model_path, "rb") as model_file:
        return pickle.load(model_file)


def _build_row_matrix(row: pd.Series, artifact: dict[str, Any]) -> tuple[np.ndarray, list[str]]:
    categorical = artifact["categorical_features"]
    numerical = artifact["numerical_features"]
    encoder = artifact["encoder"]

    frame = pd.DataFrame([row])
    cat = encoder.transform(frame[categorical])
    num = frame[numerical].to_numpy(dtype=float)
    X = np.hstack([cat, num])

    feature_names = list(encoder.get_feature_names_out(categorical)) + numerical
    return X, feature_names


def _readable_feature_name(name: str) -> str:
    if name.startswith("origin_"):
        return f"Origin ({name.removeprefix('origin_')})"
    if name.startswith("destination_port_"):
        return f"Destination ({name.removeprefix('destination_port_')})"
    if name.startswith("vessel_class_"):
        return f"Vessel class ({name.removeprefix('vessel_class_')})"
    if name.startswith("cargo_type_"):
        return f"Cargo type ({name.removeprefix('cargo_type_')})"
    if name.startswith("route_id_"):
        return f"Route ({name.removeprefix('route_id_')})"

    friendly = {
        "distance_nm": "Distance",
        "synthetic_bunker_price_usd_mt": "Bunker price",
        "freight_usd_mt": "Current freight rate",
        "freight_rolling_mean_7d": "7-day average rate",
        "freight_rolling_mean_30d": "30-day average rate",
        "year": "Year",
        "month": "Month (seasonality)",
        "day_of_week": "Day of week",
        "day_of_year": "Day of year (seasonality)",
    }
    if name in friendly:
        return friendly[name]
    if name.startswith("freight_lag_"):
        days = name.removeprefix("freight_lag_").removesuffix("d")
        return f"Rate {days} days ago"

    return name.replace("_", " ").capitalize()


def explain_prediction(
    route_row: pd.Series,
    horizon: int,
    top_n: int = 5,
    artifact: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if artifact is None:
        artifact = _load_artifact()

    if horizon not in artifact["models"]:
        raise ValueError(f"No trained model for horizon {horizon}d")

    model = artifact["models"][horizon]
    X, feature_names = _build_row_matrix(route_row, artifact)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)[0]
    base_value = float(explainer.expected_value)
    prediction = float(model.predict(X)[0])

    contributions = [
        {
            "feature": feature_names[i],
            "label": _readable_feature_name(feature_names[i]),
            "contribution": round(float(shap_values[i]), 4),
        }
        for i in range(len(feature_names))
        if abs(shap_values[i]) > 1e-6
    ]

    positive = sorted(
        [item for item in contributions if item["contribution"] > 0],
        key=lambda item: item["contribution"],
        reverse=True,
    )[:top_n]
    negative = sorted(
        [item for item in contributions if item["contribution"] < 0],
        key=lambda item: item["contribution"],
    )[:top_n]

    lines = [f"Forecast ({horizon}-day): ${prediction:.2f}/MT", ""]
    if positive:
        lines.append("Major positive drivers:")
        for item in positive:
            lines.append(f"  {item['label']:<28} +${item['contribution']:.2f}")
        lines.append("")
    if negative:
        lines.append("Negative:")
        for item in negative:
            lines.append(f"  {item['label']:<28} -${abs(item['contribution']):.2f}")

    narrative = "\n".join(lines)
    return {
        "horizon": f"{horizon}d",
        "prediction": round(prediction, 2),
        "base_value": round(base_value, 2),
        "positive_drivers": positive,
        "negative_drivers": negative,
        "narrative": narrative,
    }


def main() -> None:
    root = project_root()
    data_path = root / "data" / "processed" / "model_data.csv"
    data = pd.read_csv(data_path, parse_dates=["date"])

    artifact = _load_artifact()
    history_features = artifact["history_features"]

    latest = (
        data.sort_values(["route_id", "date"])
        .groupby("route_id")
        .tail(1)
        .dropna(subset=history_features)
    )

    sample_routes = latest["route_id"].unique()[:2]
    for route_id in sample_routes:
        row = latest[latest["route_id"] == route_id].iloc[0]
        print(f"\n{'=' * 60}\nROUTE: {route_id}\n{'=' * 60}")
        for horizon in HORIZONS:
            result = explain_prediction(row, horizon=horizon, artifact=artifact)
            print(f"\n{result['narrative']}")


if __name__ == "__main__":
    main()
