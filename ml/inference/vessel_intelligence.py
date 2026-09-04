from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "vessel_intelligence" / "vessel_intelligence_daily.csv"
MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "vessel_intelligence" / "vessel_intelligence_v2"


CANDIDATES_PATH = PROJECT_ROOT / "data" / "raw" / "vessel_intelligence" / "vessel_intelligence_candidates.csv"


@lru_cache(maxsize=1)
def _load_candidates() -> pd.DataFrame:
    if CANDIDATES_PATH.exists():
        return pd.read_csv(CANDIDATES_PATH, parse_dates=["date"])
    return _load_data()


@lru_cache(maxsize=1)
def _load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Vessel intelligence dataset not found: {DATA_PATH}")
    data = pd.read_csv(DATA_PATH, parse_dates=["date"])
    return _engineer_features(data)


@lru_cache(maxsize=1)
def _load_artifacts() -> tuple[Any, dict[str, Any], dict[str, Any]]:
    model = joblib.load(MODEL_DIR / "waiting_time_model.joblib")
    preprocessing = joblib.load(MODEL_DIR / "preprocessing_artifacts.joblib")
    metadata_path = MODEL_DIR / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
    return model, preprocessing, metadata


def _engineer_features(data: pd.DataFrame) -> pd.DataFrame:
    prepared = data.sort_values(["imo", "date"]).copy()
    prepared["year"] = prepared["date"].dt.year
    prepared["month"] = prepared["date"].dt.month
    prepared["quarter"] = prepared["date"].dt.quarter
    prepared["day_of_week"] = prepared["date"].dt.dayofweek
    prepared["day_of_year"] = prepared["date"].dt.dayofyear
    prepared["month_sin"] = np.sin(2 * np.pi * prepared["month"] / 12)
    prepared["month_cos"] = np.cos(2 * np.pi * prepared["month"] / 12)
    prepared["day_of_year_sin"] = np.sin(2 * np.pi * prepared["day_of_year"] / 365.25)
    prepared["day_of_year_cos"] = np.cos(2 * np.pi * prepared["day_of_year"] / 365.25)

    grouped = prepared.groupby("imo", sort=False)
    rolling_specs = {
        "avg_waiting_hours": "avg_waiting_hours",
        "port_calls_count": "port_calls_count",
        "ais_low_speed_pct": "ais_low_speed_pct",
        "historical_queue_length": "historical_queue_length",
        "freight_usd_mt": "freight_usd_mt",
        "bunker_price_usd_mt": "bunker_price_usd_mt",
    }
    for column, source in rolling_specs.items():
        prepared[f"{source}_lag1"] = grouped[source].shift(1)
        for window in (7, 30):
            prepared[f"{source}_rolling{window}"] = grouped[source].transform(
                lambda values: values.shift(1).rolling(window, min_periods=1).mean()
            )

    return prepared


def _latest_candidates(
    destination: str,
    vessel_class: str,
    as_of_date: str | None,
) -> pd.DataFrame:
    data = _load_candidates()
    filtered = data[
        data["destination_port"].astype(str).str.casefold().eq(destination.casefold())
        & data["vessel_class"].astype(str).str.casefold().eq(vessel_class.casefold())
    ]
    if as_of_date:
        filtered = filtered[filtered["date"] <= pd.to_datetime(as_of_date)]
    if filtered.empty:
        return filtered
    return filtered.sort_values("date").groupby("imo", as_index=False).tail(1).copy()


def _prepare_model_frame(rows: pd.DataFrame, preprocessing: dict[str, Any]) -> pd.DataFrame:
    feature_names = preprocessing["model_features"]
    frame = rows.copy()
    for feature in feature_names:
        if feature not in frame.columns:
            frame[feature] = 0.0
    categorical = set(preprocessing.get("categorical_features", []))
    for feature in feature_names:
        if feature in categorical:
            frame[feature] = frame[feature].fillna("").astype(str)
        else:
            frame[feature] = pd.to_numeric(frame[feature], errors="coerce").replace([np.inf, -np.inf], np.nan).fillna(0.0)
    return frame[feature_names]


def _score_candidate(row: pd.Series, predicted_wait: float, cargo_quantity: float) -> tuple[bool, float, list[str]]:
    failures: list[str] = []
    for field, label in (
        ("dwt_feasible", "DWT"),
        ("loa_feasible", "LOA"),
        ("beam_feasible", "beam"),
        ("draft_feasible", "draft"),
        ("berth_feasible", "berth"),
    ):
        if not bool(row.get(field, 0)):
            failures.append(label)
    if float(row.get("dwt_mt", 0)) < cargo_quantity:
        failures.append("cargo capacity")

    feasible = not failures and bool(row.get("vessel_operational_flag", 0))
    base_score = float(row.get("vessel_suitability_score", 0) or 0)
    wait_penalty = min(max(predicted_wait, 0.0) * 0.8, 30.0)
    score = max(0.0, min(100.0, base_score - wait_penalty)) if feasible else 0.0
    return feasible, round(score, 2), failures


def recommend_vessels(
    destination: str = "Dhamra",
    vessel_class: str = "Panamax",
    cargo_quantity: float = 70000,
    as_of_date: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    rows = _latest_candidates(destination, vessel_class, as_of_date)
    if rows.empty:
        raise ValueError(f"No vessel intelligence data for {vessel_class} at {destination}")

    model, preprocessing, metadata = _load_artifacts()
    model_frame = _prepare_model_frame(rows, preprocessing)
    predicted_wait = np.asarray(model.predict(model_frame), dtype=float)
    recommendations = []

    for index, (_, source) in enumerate(rows.iterrows()):
        feasible, score, failures = _score_candidate(source, predicted_wait[index], cargo_quantity)
        recommendations.append(
            {
                "imo": str(source["imo"]),
                "vessel_name": str(source["vessel_name"]),
                "vessel_class": str(source["vessel_class"]),
                "destination": str(source["destination_port"]),
                "dwt_mt": round(float(source["dwt_mt"]), 1),
                "draft_m": round(float(source["draft_m"]), 2),
                "predicted_waiting_hours": round(max(float(predicted_wait[index]), 0.0), 2),
                "suitability_score": score,
                "feasible": feasible,
                "eligibility": "ELIGIBLE" if feasible else "INELIGIBLE",
                "recommendation_tier": "RECOMMENDED" if feasible and score >= 70 else "CONSIDER" if feasible else "REJECT",
                "failed_constraints": failures,
            }
        )

    recommendations.sort(key=lambda item: (item["feasible"], item["suitability_score"]), reverse=True)
    return {
        "destination": destination,
        "vessel_class": vessel_class,
        "cargo_quantity": cargo_quantity,
        "as_of_date": as_of_date,
        "model_version": metadata.get("model_version", "vessel_intelligence_v2"),
        "target": metadata.get("target", "avg_waiting_hours"),
        "candidates": recommendations[:limit],
        "candidate_count": len(recommendations),
        "feasible_count": sum(item["feasible"] for item in recommendations),
        "note": "Decision-support ranking; feasibility rules take priority over model scores.",
    }
