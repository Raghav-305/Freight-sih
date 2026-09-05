"""
Pillar 4 -- Port Operations Schemas: Physical port/berth eligibility, delay exposure, and demurrage.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field

TruthClass = Literal[
    "STATIC_REFERENCE", "OFFICIAL_PERIODIC", "MODEL_OUTPUT", "USER_INPUT", "DEMO_SIMULATION"
]

EligibilityStatus = Literal["ELIGIBLE", "ELIGIBLE_WITH_CONDITION", "INELIGIBLE", "UNKNOWN"]


class VesselSpec(BaseModel):
    loa_m: Optional[float] = None
    beam_m: Optional[float] = None
    draft_m: Optional[float] = None
    commodity: Optional[str] = None


class EligibilityRequest(BaseModel):
    vessel: VesselSpec
    port_id: str
    berth_id: Optional[str] = None
    commodity: Optional[str] = None


class DelayExposureRequest(BaseModel):
    waiting_days_p10: float
    waiting_days_p50: float
    waiting_days_p90: float
    daily_charter_hire_rate_usd: float = Field(gt=0)


class DemurrageRequest(BaseModel):
    actual_or_forecast_port_time_days: float = Field(ge=0)
    allowed_laytime_days: float = Field(ge=0)
    contract_rate_usd_per_day: float = Field(ge=0)
