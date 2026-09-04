from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from ml.inference.fos_model import FreightOpportunityScorer

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "features" / "freight_opportunity_score" / "freight_opportunity_daily.csv"
ARTIFACT_DIR = PROJECT_ROOT / "ml" / "models" / "freight_opportunity_score" / "fos_v1"


@lru_cache(maxsize=1)
def _load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Freight opportunity dataset not found: {DATA_PATH}")
    return pd.read_csv(DATA_PATH, parse_dates=["date"])


@lru_cache(maxsize=1)
def _load_scorer() -> FreightOpportunityScorer:
    return FreightOpportunityScorer(ARTIFACT_DIR).load()


def _latest_route_row(
    origin: str,
    destination: str,
    vessel_class: str,
    as_of_date: str | None,
) -> pd.DataFrame:
    data = _load_dataset()
    rows = data[
        data["origin"].astype(str).str.casefold().eq(origin.casefold())
        & data["destination_port"].astype(str).str.casefold().eq(destination.casefold())
        & data["vessel_class"].astype(str).str.casefold().eq(vessel_class.casefold())
    ].copy()
    if as_of_date:
        rows = rows[rows["date"] <= pd.to_datetime(as_of_date)]
    if rows.empty:
        raise ValueError(f"No opportunity score data for {origin} -> {destination} ({vessel_class})")
    return rows.sort_values("date").tail(1)


def score_opportunity(
    origin: str = "Australia",
    destination: str = "Dhamra",
    vessel_class: str = "Panamax",
    horizon: int = 30,
    as_of_date: str | None = None,
) -> dict[str, Any]:
    if horizon not in (7, 30, 60):
        raise ValueError("horizon must be 7, 30, or 60")

    row = _latest_route_row(origin, destination, vessel_class, as_of_date)
    scored = _load_scorer().score(row, horizon=horizon).iloc[0]
    metadata_path = ARTIFACT_DIR / "fos_metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}

    components = {
        key.removesuffix("_score"): round(float(scored[key]), 2)
        for key in (
            "forecast_score",
            "rate_opportunity_score",
            "market_signal_score",
            "fleet_supply_score",
            "port_congestion_score",
            "weather_risk_score",
            "voyage_economics_score",
        )
    }
    contributions = {
        key.removeprefix("contribution_"): round(float(scored[key]), 2)
        for key in scored.index
        if key.startswith("contribution_")
    }

    return {
        "date": scored["date"].date().isoformat(),
        "route_id": str(scored.get("route_id", "")),
        "origin": str(scored.get("origin", origin)),
        "destination": str(scored.get("destination_port", destination)),
        "vessel_class": str(scored.get("vessel_class", vessel_class)),
        "horizon_days": horizon,
        "freight_usd_mt": round(float(scored.get("freight_usd_mt", 0)), 2),
        "expected_return_pct": round(float(scored["expected_return_pct"]), 2),
        "expected_freight_usd_mt": round(float(scored["expected_freight_usd_mt"]), 2),
        "forecast_source": str(scored["forecast_source"]),
        "fos": round(float(scored["fos"]), 2),
        "recommendation": str(scored["fos_recommendation"]),
        "components": components,
        "contributions": contributions,
        "model_version": metadata.get("model_version", "fos_v1"),
        "note": "Decision-support opportunity score, not a guaranteed trading recommendation.",
    }
