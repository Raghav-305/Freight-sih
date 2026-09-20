from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class RiskCounterfactualRequest(BaseModel):
    route_id: str = Field(default="AUS_PAR_PAN", description="Route identifier e.g. AUS_PAR_PAN")
    origin_country: str = Field(default="Australia", description="Country of origin")
    destination_port: str = Field(default="PAR", description="Destination port code or name")
    date: str = Field(default="2024-06-15", description="Assessment date YYYY-MM-DD")


class RiskCounterfactualItem(BaseModel):
    factor: str
    current_score: float
    if_resolved_overall_becomes: float
    overall_drops_by: float


class RiskCounterfactualResponse(BaseModel):
    baseline: dict[str, Any]
    biggest_lever: str
    counterfactuals: list[RiskCounterfactualItem]
    summary_insight: str


class CharterCounterfactualRequest(BaseModel):
    origin_port: str = Field(default="Gladstone", description="Origin port or country")
    destination_port: str = Field(default="PAR", description="Destination port code or name")
    vessel_class: str = Field(default="Panamax", description="Vessel class: Panamax or Capesize")
    cargo_quantity_mt: float = Field(default=480000.0, gt=0, description="Total cargo volume in MT")
    delivery_date: str = Field(default="2024-06-15", description="Delivery/laycan date YYYY-MM-DD")


class CharterSensitivityItem(BaseModel):
    lever: str
    change: str
    new_cost_usd: float
    saving_usd: float
    mix_changed: bool


class CharterCounterfactualResponse(BaseModel):
    baseline: dict[str, Any]
    biggest_lever: str
    cost_sensitivity: list[CharterSensitivityItem]
    note: str
    summary_insight: str


class CustomRiskWhatIfRequest(BaseModel):
    route_id: str = Field(default="AUS_PAR_PAN")
    origin_country: str = Field(default="Australia")
    destination_port: str = Field(default="PAR")
    date: str = Field(default="2024-06-15")
    overrides: dict[str, float] = Field(default_factory=dict, description="Sub-score overrides (e.g. {'weather': 10.0})")


class CustomRiskWhatIfResponse(BaseModel):
    baseline: dict[str, Any]
    simulated: dict[str, Any]
    overrides_applied: dict[str, float]
    overall_delta: float
    impact_direction: str


class CustomCharterWhatIfRequest(BaseModel):
    origin_port: str = Field(default="Gladstone")
    destination_port: str = Field(default="PAR")
    vessel_class: str = Field(default="Panamax")
    cargo_quantity_mt: float = Field(default=480000.0, gt=0)
    delivery_date: str = Field(default="2024-06-15")
    bunker_pct_change: float = Field(default=0.0, description="Bunker price % change (e.g. -10 for -10%)")
    congestion_days_delta: float = Field(default=0.0, description="Days change in congestion wait (e.g. -1.5)")
    spot_rate_pct_change: float = Field(default=0.0, description="Spot rate % change (e.g. -5 for -5%)")


class CustomCharterWhatIfResponse(BaseModel):
    baseline: dict[str, Any]
    simulated: dict[str, Any]
    shifts: dict[str, float]
    saving_usd: float
    mix_changed: bool
