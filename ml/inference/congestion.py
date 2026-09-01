from __future__ import annotations

import math
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "congestion" / "congestion_sih_v1" / "congestion_model.pkl"
PORT_LOOKUP_PATH = PROJECT_ROOT / "data" / "raw" / "ports" / "port_lookup.csv"
MONTHLY_LOOKUP_PATH = PROJECT_ROOT / "data" / "raw" / "congestion" / "monthly_lookup.csv"
FEATURES = [
    "month",
    "vessels_at_anchorage",
    "vessels_in_port",
    "queue_length",
    "arrivals_24h",
    "arrivals_7d",
    "departures_24h",
    "departures_7d",
    "average_wait",
    "median_wait",
    "wind_speed",
    "wave_height",
    "precipitation",
    "storm_flag",
    "cyclone_flag",
    "discharge_rate",
    "max_draft",
    "has_tidal_restriction",
    "berth_count",
    "dwt",
    "is_capesize",
    "port_code",
]


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Congestion model not found: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def _load_port_lookup() -> pd.DataFrame:
    return pd.read_csv(PORT_LOOKUP_PATH)


@lru_cache(maxsize=1)
def _load_monthly_lookup() -> pd.DataFrame:
    return pd.read_csv(MONTHLY_LOOKUP_PATH)


def predict_congestion(port_id: str, arrival_date: str, vessel_dwt: int, vessel_type: str) -> dict:
    port_id = str(port_id).upper().strip()
    if not port_id:
        raise ValueError("port_id is required")

    port_lookup = _load_port_lookup()
    monthly_lookup = _load_monthly_lookup()

    if port_id not in port_lookup["port_id"].values:
        valid = list(port_lookup["port_id"].unique())
        raise ValueError(f"Unknown port_id '{port_id}'. Valid options: {valid}")

    month = pd.to_datetime(arrival_date).month
    port = port_lookup[port_lookup["port_id"] == port_id].iloc[0]
    monthly = monthly_lookup[(monthly_lookup["port_id"] == port_id) & (monthly_lookup["month"] == month)]

    if monthly.empty:
        monthly = monthly_lookup[monthly_lookup["port_id"] == port_id].mean(numeric_only=True)
    else:
        monthly = monthly.iloc[0]

    row = pd.DataFrame([{
        "month": month,
        "vessels_at_anchorage": monthly["avg_vessels_at_anchorage"],
        "vessels_in_port": monthly["avg_vessels_in_port"],
        "queue_length": monthly["avg_queue_length"],
        "arrivals_24h": monthly["avg_arrivals_24h"],
        "arrivals_7d": monthly["avg_arrivals_7d"],
        "departures_24h": monthly["avg_departures_24h"],
        "departures_7d": monthly["avg_departures_7d"],
        "average_wait": monthly["avg_wait_hist"],
        "median_wait": monthly["med_wait_hist"],
        "wind_speed": monthly["avg_wind_speed"],
        "wave_height": monthly["avg_wave_height"],
        "precipitation": monthly["avg_precip"],
        "storm_flag": monthly["storm_flag_rate"],
        "cyclone_flag": monthly["cyclone_flag_rate"],
        "discharge_rate": port["discharge_rate"],
        "max_draft": port["max_draft"],
        "has_tidal_restriction": port["has_tidal_restriction"],
        "berth_count": port["berth_count"],
        "dwt": int(vessel_dwt),
        "is_capesize": 1 if str(vessel_type).lower() == "capesize" else 0,
        "port_code": port["port_code"],
    }])[FEATURES]

    predicted_hours = float(_load_model().predict(row)[0])
    if not math.isfinite(predicted_hours):
        predicted_hours = 0.0
    predicted_hours = max(0.0, predicted_hours)

    return {
        "port_id": port_id,
        "arrival_date": arrival_date,
        "vessel_dwt": int(vessel_dwt),
        "vessel_type": str(vessel_type),
        "expected_wait_hours": round(predicted_hours, 1),
        "expected_wait_days": round(predicted_hours / 24.0, 2),
    }


if __name__ == "__main__":
    result = predict_congestion(port_id="PAR", arrival_date="2026-07-15", vessel_dwt=78000, vessel_type="Panamax")
    print(result)
