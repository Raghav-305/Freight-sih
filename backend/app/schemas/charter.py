from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class CharterOptimizeRequest(BaseModel):
    cargo_quantity: float = Field(default=480000.0, gt=0, description="Total cargo volume in MT")
    origin: str = Field(default="Australia", description="Load country or port")
    destination: str = Field(default="Dhamra", description="Discharge port in India")
    vessel_class: str = Field(default="Panamax", description="Vessel class: Panamax or Capesize")
    period_start: str = Field(default="2026-10-01", description="Charter commitment start date")
    period_end: str = Field(default="2027-03-31", description="Charter commitment end date")
    delivery_date: str | None = Field(default=None, description="Optional target delivery date")
    max_share: float = Field(default=0.5, ge=0.1, le=1.0, description="Max diversification share cap per contract structure")
    contract_options: list[str] = Field(
        default=["spot", "short_term", "multi_voyage", "coa"],
        description="Candidate contract structures to optimize across"
    )
    current_freight: float | None = Field(default=None, description="Optional prompt spot freight rate ($/MT)")
    market_regime: str | None = Field(default=None, description="Market signal: BULLISH, NEUTRAL, or BEARISH")
    risk_score: float | None = Field(default=None, description="Route risk rating (0-100)")


class CharterOptimizeResponse(BaseModel):
    strategy: str
    allocation: dict[str, float]
    rates_usd_mt: dict[str, float]
    cargo_quantity: float
    route: str
    period: str
    expected_cost: float
    baseline_cost: float
    expected_saving: float
    expected_saving_pct: float
    risk: str
    risk_score: float
    fixing_window: str
    notes: str
    distance_nm: float | None = None
    voyages_needed: int | None = None
    recommended_mix_voyages: dict[str, float] | None = None
    cost_breakdown_per_voyage: dict[str, float] | None = None


class CharterStrategyRequest(BaseModel):
    origin_port: str = Field(default="Gladstone", description="Origin load port (e.g. Gladstone, Newcastle, Hay Point, Taboneo)")
    destination_port: str = Field(default="Dhamra", description="Destination discharge port (e.g. Dhamra, Paradip, Haldia, DHA, PAR)")
    vessel_class: str = Field(default="Panamax", description="Vessel class: Panamax or Capesize")
    cargo_quantity_mt: float = Field(default=480000.0, gt=0, description="Total cargo volume in MT")
    delivery_date: str = Field(default="2026-10-15", description="Target delivery/laycan date 'YYYY-MM-DD'")
    max_share: float = Field(default=0.5, ge=0.1, le=1.0, description="Diversification cap (no single contract > max_share of voyages)")


class CharterStrategyResponse(BaseModel):
    origin_port: str
    destination_port: str
    destination_port_name: str
    vessel_class: str
    cargo_quantity_mt: float
    delivery_date: str
    distance_nm: float
    voyage_duration_days: float
    cargo_per_voyage_mt: float
    voyages_needed: int
    avg_spot_rate_usd_mt: float
    avg_bunker_price_usd_mt: float
    recommended_mix: dict[str, float]
    recommended_mix_pct: dict[str, float]
    current_plan_cost_usd: float
    optimized_cost_usd: float
    expected_saving_usd: float
    expected_saving_pct: float
    cost_breakdown_per_voyage: dict[str, float]
    linear_programming_status: str
    solver: str
