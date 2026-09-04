from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class CharterOptimizeRequest(BaseModel):
    cargo_quantity: float = Field(default=480000.0, gt=0, description="Total cargo volume in MT")
    origin: str = Field(default="Australia", description="Load country or port")
    destination: str = Field(default="Dhamra", description="Discharge port in India")
    period_start: str = Field(default="2026-10-01", description="Charter commitment start date")
    period_end: str = Field(default="2027-03-31", description="Charter commitment end date")
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
