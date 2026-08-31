from __future__ import annotations

from typing import Any

from ml.inference.loader import load_model_registry


def run_forecast(payload: dict[str, Any]) -> dict[str, Any]:
    """Placeholder inference boundary.

    Replace the mock block with XGBoost/SARIMA/ensemble loading once model files,
    preprocessing artifacts and feature schemas are available.
    """
    registry = load_model_registry()
    active_model = registry.get("active_forecasting_model", "xgb_panamax_freight_v7")

    quantity = float(payload.get("cargo_quantity") or 80000)
    vessel_factor = 1.0 if payload.get("vessel_type", "").lower() == "panamax" else 1.08
    base = round(18.5 * vessel_factor + (quantity / 100000.0), 2)

    return {
        "current_freight": base,
        "forecast": {
            "7d": {"p10": round(base * 0.96, 2), "p25": round(base * 0.98, 2), "p50": round(base * 1.02, 2), "p75": round(base * 1.05, 2), "p90": round(base * 1.08, 2)},
            "30d": {"p10": round(base * 0.94, 2), "p25": round(base * 0.98, 2), "p50": round(base * 1.08, 2), "p75": round(base * 1.16, 2), "p90": round(base * 1.24, 2)},
            "60d": {"p10": round(base * 0.95, 2), "p25": round(base * 1.00, 2), "p50": round(base * 1.13, 2), "p75": round(base * 1.23, 2), "p90": round(base * 1.34, 2)},
            "90d": {"p10": round(base * 0.97, 2), "p25": round(base * 1.03, 2), "p50": round(base * 1.18, 2), "p75": round(base * 1.30, 2), "p90": round(base * 1.43, 2)},
        },
        "confidence": 0.72,
        "model_version": active_model,
        "dataset_version": "placeholder_dataset_v0",
        "feature_version": "placeholder_features_v0",
        "training_date": "replace-with-training-date",
        "shap": [
            {"feature": "route", "impact": 0.32, "direction": "up"},
            {"feature": "vessel_type", "impact": 0.18, "direction": "up"},
            {"feature": "cargo_quantity", "impact": 0.11, "direction": "up"},
        ],
    }


if __name__ == "__main__":
    sample = {
        "origin": "Gladstone",
        "destination": "Dhamra",
        "vessel_type": "Panamax",
        "cargo_type": "Coal",
        "cargo_quantity": 80000,
    }
    print(run_forecast(sample))
