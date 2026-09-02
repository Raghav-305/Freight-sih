from __future__ import annotations

import pickle
from copy import deepcopy
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

MODEL_VERSION = "panamax_freight_v7"
HORIZONS = [7, 30, 60, 90]

FREIGHT_LINKED_FEATURES = [
    "freight_usd_mt",
    "freight_lag_1d",
    "freight_lag_7d",
    "freight_lag_30d",
    "freight_lag_60d",
    "freight_lag_90d",
    "freight_rolling_mean_7d",
    "freight_rolling_mean_30d",
]

BUNKER_LINKED_FEATURES = ["synthetic_bunker_price_usd_mt"]


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_artifact() -> dict[str, Any]:
    model_path = (
        project_root() / "ml" / "models" / "forecasting" / "xgboost" / MODEL_VERSION / "model.pkl"
    )
    with open(model_path, "rb") as model_file:
        return pickle.load(model_file)


def _build_matrix(row: pd.Series, artifact: dict[str, Any]) -> np.ndarray:
    categorical = artifact["categorical_features"]
    numerical = artifact["numerical_features"]
    encoder = artifact["encoder"]

    frame = pd.DataFrame([row])
    cat = encoder.transform(frame[categorical])
    num = frame[numerical].to_numpy(dtype=float)
    return np.hstack([cat, num])


def _apply_scenario(
    row: pd.Series,
    freight_change_pct: float,
    bunker_change_pct: float,
) -> pd.Series:
    scenario_row = deepcopy(row)
    for column in FREIGHT_LINKED_FEATURES:
        if column in scenario_row and pd.notna(scenario_row[column]):
            scenario_row[column] = scenario_row[column] * (1 + freight_change_pct / 100)
    for column in BUNKER_LINKED_FEATURES:
        if column in scenario_row and pd.notna(scenario_row[column]):
            scenario_row[column] = scenario_row[column] * (1 + bunker_change_pct / 100)
    return scenario_row


def run_what_if(
    route_row: pd.Series,
    freight_change_pct: float = 0.0,
    bunker_change_pct: float = 0.0,
    artifact: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if artifact is None:
        artifact = _load_artifact()

    baseline_X = _build_matrix(route_row, artifact)
    scenario_row = _apply_scenario(route_row, freight_change_pct, bunker_change_pct)
    scenario_X = _build_matrix(scenario_row, artifact)

    horizon_results = []
    for horizon in HORIZONS:
        model = artifact["models"][horizon]
        baseline_pred = float(model.predict(baseline_X)[0])
        scenario_pred = float(model.predict(scenario_X)[0])
        delta_abs = scenario_pred - baseline_pred
        delta_pct = (delta_abs / baseline_pred * 100) if baseline_pred else float("nan")

        horizon_results.append(
            {
                "horizon": f"{horizon}d",
                "baseline_usd_mt": round(baseline_pred, 2),
                "scenario_usd_mt": round(scenario_pred, 2),
                "delta_usd_mt": round(delta_abs, 2),
                "delta_pct": round(delta_pct, 2),
            }
        )

    return {
        "route_id": route_row.get("route_id"),
        "scenario_inputs": {
            "freight_change_pct": freight_change_pct,
            "bunker_change_pct": bunker_change_pct,
        },
        "horizons": horizon_results,
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

    for route_id in latest["route_id"].unique()[:2]:
        row = latest[latest["route_id"] == route_id].iloc[0]
        baseline = run_what_if(row, freight_change_pct=0, bunker_change_pct=0, artifact=artifact)
        scenario = run_what_if(row, freight_change_pct=8, bunker_change_pct=5, artifact=artifact)
        print(baseline)
        print(scenario)


if __name__ == "__main__":
    main()
