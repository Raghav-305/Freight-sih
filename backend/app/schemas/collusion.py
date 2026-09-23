from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class BidScoreRequest(BaseModel):
    bid: dict[str, Any] = Field(..., description="Bid dictionary with categorical and numerical features")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0, description="Anomaly classification threshold")


class BidScoreResponse(BaseModel):
    tender_id: Optional[str] = None
    broker_id: Optional[str] = None
    anomaly_probability: float
    flagged: bool
    threshold_used: float
    model_version: str


class TenderScoreRequest(BaseModel):
    tender_id: str = Field(..., description="Tender identifier e.g. TND-2023-0001")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    bids: Optional[list[dict[str, Any]]] = Field(
        default=None,
        description="Optional list of bids to score; if omitted, loads from database/records",
    )


class ScoredBidItem(BaseModel):
    tender_id: Optional[str] = None
    broker_id: Optional[str] = None
    quoted_freight_usd_mt: float
    market_freight_usd_mt: float
    predicted_fair_value_usd_mt: float
    bid_deviation_pct: float
    bid_rank: int
    winner: int
    anomaly_probability: float
    flagged: bool
    fair_value_band_breach: int
    high_positive_deviation_flag: int
    origin: Optional[str] = None
    destination_port: Optional[str] = None
    vessel_class: Optional[str] = None


class TenderScoreResponse(BaseModel):
    tender_id: str
    tender_date: Optional[str] = None
    origin: Optional[str] = None
    destination_port: Optional[str] = None
    cargo_type: Optional[str] = None
    vessel_class: Optional[str] = None
    total_bids: int
    flagged_count: int
    highest_anomaly_probability: float
    highest_risk_broker: Optional[str] = None
    tender_status: str  # "ANOMALOUS_FLAGGED" or "CLEAN"
    threshold_used: float
    bids: list[ScoredBidItem]
    audit_logged: bool = False


class BidExplainRequest(BaseModel):
    tender_id: str
    broker_id: str
    top_n: int = Field(default=5, ge=1, le=10)


class ShapContributionItem(BaseModel):
    feature: str
    label: str
    log_odds_contribution: float


class BidExplainResponse(BaseModel):
    tender_id: Optional[str] = None
    broker_id: Optional[str] = None
    probability: float
    baseline_probability: float
    toward_suspicious: list[ShapContributionItem]
    toward_normal: list[ShapContributionItem]
    narrative: str


class TenderSummary(BaseModel):
    tender_id: str
    tender_date: str
    origin: str
    destination_port: str
    cargo_type: str
    vessel_class: str
    route_id: str
    total_bids: int
    min_quoted_freight: float
    max_quoted_freight: float
    predicted_fair_value: float
    bid_spread_pct: float
    flagged_count: int
    status: str  # "FLAGGED" or "NORMAL"


class TenderListResponse(BaseModel):
    total_tenders: int
    flagged_tenders: int
    clean_tenders: int
    tenders: list[TenderSummary]


class CollusionPerformanceResponse(BaseModel):
    model_version: str
    training_date: str
    dataset_version: str
    test_metrics: dict[str, Any]
    naive_baseline: dict[str, Any]
    feature_importance: list[dict[str, Any]]


class CustomBidSimRequest(BaseModel):
    tender_id: str = Field(default="SIM-TND-01")
    broker_id: str = Field(default="BRK-SIMULATED")
    origin: str = Field(default="Gladstone")
    destination_port: str = Field(default="PAR")
    cargo_type: str = Field(default="Coking Coal")
    vessel_class: str = Field(default="Panamax")
    route_id: str = Field(default="AUS_PAR_PAN")
    quantity_mt: float = Field(default=75000.0)
    quoted_freight_usd_mt: float = Field(default=24.5)
    market_freight_usd_mt: float = Field(default=18.5)
    predicted_fair_value_usd_mt: float = Field(default=18.2)
    bunker_price_usd_mt: float = Field(default=620.0)
    congestion_index: float = Field(default=0.45)
    predicted_waiting_hours: float = Field(default=48.0)
    broker_historical_bid_count: int = Field(default=25)
    broker_historical_premium_pct: float = Field(default=3.5)
    vessel_historical_bid_count: int = Field(default=12)
    broker_vessel_historical_frequency: int = Field(default=4)
    contract_duration_days: int = Field(default=25)
    threshold: float = Field(default=0.5)


class CustomBidSimResponse(BaseModel):
    tender_id: str
    broker_id: str
    anomaly_probability: float
    flagged: bool
    deviation_pct: float
    fair_value_band_breach: bool
    high_positive_deviation_flag: bool
    narrative: str
    top_suspicious_features: list[ShapContributionItem]
