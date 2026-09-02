from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from ml.market_intelligence.config import Config
from ml.market_intelligence.predict import MarketIntelligencePredictor
from ml.market_intelligence.scoring import MarketIntelligenceScorer

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "market_intelligence" / "market_intelligence_v1"
LATEST_CSV = PROJECT_ROOT / "data" / "features" / "market_intelligence" / "market_intelligence_latest.csv"
DAILY_CSV = PROJECT_ROOT / "data" / "features" / "market_intelligence" / "market_intelligence_daily_complete.csv"
FEATURE_IMPORTANCE = PROJECT_ROOT / "ml" / "artifacts" / "market_intelligence" / "market_feature_importance.csv"

DEFAULT_ORIGIN = "Australia"
DEFAULT_DESTINATION = "Dhamra"
DEFAULT_VESSEL_CLASS = "Panamax"


@lru_cache(maxsize=1)
def _load_metadata() -> dict[str, Any]:
    metadata_path = MODEL_DIR / "market_intelligence_metadata.json"
    with metadata_path.open("r", encoding="utf-8") as metadata_file:
        return json.load(metadata_file)


@lru_cache(maxsize=1)
def _load_latest_predictions() -> pd.DataFrame:
    if not LATEST_CSV.exists():
        raise FileNotFoundError(f"Market intelligence latest output not found: {LATEST_CSV}")
    return pd.read_csv(LATEST_CSV, parse_dates=["date"])


@lru_cache(maxsize=1)
def _load_daily_dataset() -> pd.DataFrame:
    if not DAILY_CSV.exists():
        raise FileNotFoundError(f"Market intelligence dataset not found: {DAILY_CSV}")
    return pd.read_csv(DAILY_CSV, parse_dates=["date"])


@lru_cache(maxsize=1)
def _load_predictor() -> MarketIntelligencePredictor | None:
    model_path = MODEL_DIR / "market_intelligence_model.pkl"
    if not model_path.exists():
        return None

    config = Config()
    predictor = MarketIntelligencePredictor(config)
    predictor.load_model(str(model_path))
    predictor.load_feature_columns(str(MODEL_DIR / "market_intelligence_feature_columns.json"))
    return predictor


def _normalize(value: Any) -> str:
    return str(value or "").strip().lower().replace("-", " ").replace("_", " ")


def _match_route(df: pd.DataFrame, origin: str, destination: str, vessel_class: str) -> pd.DataFrame:
    origin_key = _normalize(origin)
    destination_key = _normalize(destination)
    vessel_key = _normalize(vessel_class)

    matched = df[
        df["origin"].map(_normalize).eq(origin_key)
        & df["destination_port"].map(_normalize).eq(destination_key)
        & df["vessel_class"].map(_normalize).eq(vessel_key)
    ]
    if matched.empty:
        matched = df[
            df["destination_port"].map(_normalize).eq(destination_key)
            & df["vessel_class"].map(_normalize).eq(vessel_key)
        ]
    return matched.sort_values("date")


def _latest_row(df: pd.DataFrame) -> pd.Series:
    return df.sort_values("date").iloc[-1]


def _row_to_probabilities(row: pd.Series) -> dict[str, float]:
    return {
        "bearish": float(row.get("bearish_probability", 0) or 0),
        "neutral": float(row.get("neutral_probability", 0) or 0),
        "bullish": float(row.get("bullish_probability", 0) or 0),
    }


def _top_factors(limit: int = 5) -> list[dict[str, Any]]:
    if not FEATURE_IMPORTANCE.exists():
        return []

    importance = pd.read_csv(FEATURE_IMPORTANCE).head(limit)
    factors: list[dict[str, Any]] = []
    for _, item in importance.iterrows():
        factors.append(
            {
                "feature": str(item["feature"]),
                "importance": round(float(item["importance"]), 4),
                "rank": int(item["rank"]),
            }
        )
    return factors


def _build_route_snapshot(row: pd.Series, scorer: MarketIntelligenceScorer) -> dict[str, Any]:
    probabilities = _row_to_probabilities(row)
    market_score = float(row.get("market_score", scorer.calculate_market_score(probabilities)))
    regime = str(row.get("market_regime_predicted", row.get("market_regime", "NEUTRAL")))

    return {
        "date": row["date"].date().isoformat() if hasattr(row["date"], "date") else str(row["date"]),
        "route_id": str(row.get("route_id", "")),
        "origin": str(row.get("origin", "")),
        "destination": str(row.get("destination_port", row.get("destination", ""))),
        "vessel_class": str(row.get("vessel_class", "")),
        "freight_usd_mt": round(float(row.get("freight_usd_mt", 0)), 2),
        "market_regime": regime,
        "market_regime_interpretation": scorer.interpret_market_score(market_score),
        "market_score": round(market_score, 1),
        "probabilities": {key: round(value, 4) for key, value in probabilities.items()},
        "freight_direction": str(row.get("freight_direction", "STABLE")),
        "market_volatility": str(row.get("market_volatility", "MEDIUM")),
        "forward_market_signal": str(row.get("forward_signal", row.get("forward_market_signal", "NEUTRAL"))),
        "bunker_pressure": str(row.get("bunker_pressure", "MODERATE")),
        "port_pressure": str(row.get("port_pressure", "MEDIUM")),
        "chartering_signal": str(row.get("chartering_signal", "MONITOR / PARTIAL COVER")),
        "bunker_price_usd_mt": round(float(row.get("bunker_price_usd_mt", 0)), 2),
        "coal_price_usd_mt": round(float(row.get("coal_price_usd_mt", 0)), 2),
    }


def run_market_intelligence(
    origin: str = DEFAULT_ORIGIN,
    destination: str = DEFAULT_DESTINATION,
    vessel_class: str = DEFAULT_VESSEL_CLASS,
    as_of_date: str | None = None,
) -> dict[str, Any]:
    metadata = _load_metadata()
    scorer = MarketIntelligenceScorer(Config())
    latest_df = _load_latest_predictions()
    route_df = _match_route(latest_df, origin, destination, vessel_class)

    if route_df.empty:
        raise ValueError(f"No market intelligence data found for {origin} -> {destination} ({vessel_class})")

    if as_of_date:
        as_of = pd.to_datetime(as_of_date)
        route_df = route_df[route_df["date"] <= as_of]
        if route_df.empty:
            raise ValueError(f"No market intelligence data on or before {as_of_date}")

    row = _latest_row(route_df)
    snapshot = _build_route_snapshot(row, scorer)

    daily_df = _load_daily_dataset()
    daily_route = _match_route(daily_df, origin, destination, vessel_class)
    daily_row = _latest_row(daily_route) if not daily_route.empty else row

    indices = {
        "bdi": round(float(daily_row.get("bdi", 0)), 1),
        "bpi": round(float(daily_row.get("bpi", 0)), 1),
        "bsi": round(float(daily_row.get("bsi", 0)), 1),
        "bhsi": round(float(daily_row.get("bhsi", 0)), 1),
        "bci": round(float(daily_row.get("bci", 0)), 1),
    }

    confidence = round(max(snapshot["probabilities"].values()), 3)
    predictor = _load_predictor()

    return {
        "mode": "live" if predictor is not None else "precomputed",
        "updated_at": snapshot["date"],
        "indices": indices,
        "route_freight": snapshot["freight_usd_mt"],
        "bunker": snapshot["bunker_price_usd_mt"],
        "coal": snapshot["coal_price_usd_mt"],
        "market_regime": snapshot["market_regime"],
        "market_regime_interpretation": snapshot["market_regime_interpretation"],
        "market_score": snapshot["market_score"],
        "probabilities": snapshot["probabilities"],
        "confidence": confidence,
        "freight_direction": snapshot["freight_direction"],
        "market_volatility": snapshot["market_volatility"],
        "forward_market_signal": snapshot["forward_market_signal"],
        "bunker_pressure": snapshot["bunker_pressure"],
        "port_pressure": snapshot["port_pressure"],
        "chartering_signal": snapshot["chartering_signal"],
        "route": snapshot,
        "top_factors": _top_factors(),
        "model_version": metadata.get("model_version", "market_intelligence_v1"),
        "dataset_version": metadata.get("dataset_version", "market_intelligence_daily_complete.csv"),
        "feature_version": metadata.get("feature_version", "1.0"),
        "training_date": metadata.get("training_date", ""),
        "horizon_days": metadata.get("horizon_days", 30),
        "note": "Decision-support signal — not a guaranteed market outcome.",
    }


def _prepare_inference_features(df: pd.DataFrame) -> pd.DataFrame:
    prepared = df.copy()
    config = Config()

    try:
        with (MODEL_DIR / "market_intelligence_feature_columns.json").open("r", encoding="utf-8") as feature_file:
            required_columns = json.load(feature_file)
    except (FileNotFoundError, json.JSONDecodeError):
        required_columns = []

    for column in required_columns:
        if column not in prepared.columns:
            prepared[column] = 0.0
        prepared[column] = pd.to_numeric(prepared[column], errors="coerce")
        prepared[column] = prepared[column].fillna(prepared[column].median())

    if "market_regime_encoded" not in prepared.columns:
        if "market_regime_target_30d" in prepared.columns:
            prepared["market_regime_encoded"] = prepared["market_regime_target_30d"].map(config.CLASS_MAPPING)
        elif "future_freight_return_30d_pct" in prepared.columns:
            from ml.market_intelligence.target import TargetCreator

            prepared = TargetCreator(config).create_target(prepared)
        else:
            prepared["market_regime_encoded"] = config.CLASS_MAPPING["NEUTRAL"]
    else:
        prepared["market_regime_encoded"] = pd.to_numeric(prepared["market_regime_encoded"], errors="coerce")
        prepared["market_regime_encoded"] = prepared["market_regime_encoded"].fillna(config.CLASS_MAPPING["NEUTRAL"])

    return prepared


def run_market_intelligence_live_inference(
    origin: str = DEFAULT_ORIGIN,
    destination: str = DEFAULT_DESTINATION,
    vessel_class: str = DEFAULT_VESSEL_CLASS,
    as_of_date: str | None = None,
) -> dict[str, Any]:
    predictor = _load_predictor()
    if predictor is None:
        return run_market_intelligence(origin, destination, vessel_class, as_of_date)

    daily_df = _load_daily_dataset()
    route_df = _match_route(daily_df, origin, destination, vessel_class)
    if route_df.empty:
        raise ValueError(f"No feature rows found for {origin} -> {destination} ({vessel_class})")

    if as_of_date:
        as_of = pd.to_datetime(as_of_date)
        route_df = route_df[route_df["date"] <= as_of]
        if route_df.empty:
            raise ValueError(f"No feature rows on or before {as_of_date}")

    input_row = _latest_row(route_df).to_frame().T
    input_row = _prepare_inference_features(input_row)
    predictions = predictor.predict_market_intelligence(input_row)
    decision = predictor.generate_decision_output(predictions)
    row = decision.iloc[0].copy()
    source_row = input_row.iloc[0]

    for column in ("bunker_price_usd_mt", "coal_price_usd_mt", "bdi", "bpi", "bsi", "bhsi", "bci"):
        if column in source_row.index:
            row[column] = source_row[column]

    scorer = MarketIntelligenceScorer(Config())
    metadata = _load_metadata()
    snapshot = _build_route_snapshot(row, scorer)

    indices = {
        "bdi": round(float(source_row.get("bdi", 0)), 1),
        "bpi": round(float(source_row.get("bpi", 0)), 1),
        "bsi": round(float(source_row.get("bsi", 0)), 1),
        "bhsi": round(float(source_row.get("bhsi", 0)), 1),
        "bci": round(float(source_row.get("bci", 0)), 1),
    }

    return {
        "mode": "live",
        "updated_at": snapshot["date"],
        "indices": indices,
        "route_freight": snapshot["freight_usd_mt"],
        "bunker": snapshot["bunker_price_usd_mt"],
        "coal": snapshot["coal_price_usd_mt"],
        "market_regime": snapshot["market_regime"],
        "market_regime_interpretation": snapshot["market_regime_interpretation"],
        "market_score": snapshot["market_score"],
        "probabilities": snapshot["probabilities"],
        "confidence": round(max(snapshot["probabilities"].values()), 3),
        "freight_direction": snapshot["freight_direction"],
        "market_volatility": snapshot["market_volatility"],
        "forward_market_signal": snapshot["forward_market_signal"],
        "bunker_pressure": snapshot["bunker_pressure"],
        "port_pressure": snapshot["port_pressure"],
        "chartering_signal": snapshot["chartering_signal"],
        "route": snapshot,
        "top_factors": _top_factors(),
        "model_version": metadata.get("model_version", "market_intelligence_v1"),
        "dataset_version": metadata.get("dataset_version", "market_intelligence_daily_complete.csv"),
        "feature_version": metadata.get("feature_version", "1.0"),
        "training_date": metadata.get("training_date", ""),
        "horizon_days": metadata.get("horizon_days", 30),
        "note": "Decision-support signal — not a guaranteed market outcome.",
    }
