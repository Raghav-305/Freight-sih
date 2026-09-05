"""
Shared Pydantic schemas. Field names match 01/03/04 IMPLEMENTATION_SPEC.md
exactly so the frontend stubs and DEEP_RESEARCH docs stay in sync with code.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

TruthClass = Literal[
    "STATIC_REFERENCE", "OFFICIAL_PERIODIC", "MODEL_OUTPUT", "USER_INPUT", "DEMO_SIMULATION"
]

EligibilityStatus = Literal["ELIGIBLE", "ELIGIBLE_WITH_CONDITION", "INELIGIBLE", "UNKNOWN"]

DecisionStatus = Literal[
    "DRAFT", "ANALYSED", "SUBMITTED_FOR_REVIEW", "APPROVED", "RETURNED", "REJECTED"
]


# ---------- Pillar 1: Policy / Economics ----------

class CostBreakdown(BaseModel):
    commodity: float = 0
    freight: float = 0
    insurance: float = 0
    port: float = 0
    handling: float = 0
    inland: float = 0
    other: float = 0


class QualitySpec(BaseModel):
    ash_pct: Optional[float] = None
    moisture_pct: Optional[float] = None


class ScenarioMetadata(BaseModel):
    currency: str = "USD"
    observed_at: str


class ScenarioRequest(BaseModel):
    scenario_type: Literal["IMPORT", "COASTAL"]
    label: str = "Scenario"
    costs: CostBreakdown
    gcv_kcal_per_kg: Optional[float] = None
    quality: QualitySpec = QualitySpec()
    metadata: ScenarioMetadata

    @field_validator("gcv_kcal_per_kg")
    @classmethod
    def gcv_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("gcv_kcal_per_kg must be positive if provided")
        return v


class ScenarioCompareRequest(BaseModel):
    scenarios: list[ScenarioRequest] = Field(min_length=1)


class SensitivityRequest(BaseModel):
    scenario: ScenarioRequest
    waiting_days_p50: Optional[float] = None
    waiting_days_p90: Optional[float] = None
    daily_charter_hire_rate: Optional[float] = None


class BlendRequest(BaseModel):
    domestic: ScenarioRequest
    imported: ScenarioRequest
    domestic_gcv_kcal_per_kg: float
    imported_gcv_kcal_per_kg: float
    domestic_ash_pct: Optional[float] = None
    imported_ash_pct: Optional[float] = None
    import_fraction: float = Field(ge=0, le=1)


# ---------- Pillar 4: Port Operations ----------

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


# ---------- Pillar 3: Governance / Decisions ----------

class ForecastQuantiles(BaseModel):
    p10: Optional[float] = None
    p50: Optional[float] = None
    p90: Optional[float] = None
    unit: str = "USD/tonne"


class DecisionCreateRequest(BaseModel):
    cargo_description: str
    scenario_snapshot: dict
    eligibility_snapshot: dict
    forecast_quantiles: Optional[ForecastQuantiles] = None
    explanation_reference: Optional[str] = None
    route_risk_snapshot: Optional[dict] = None
    source_versions: dict = {}
    created_by: str
    created_by_role: str


class DecisionActionRequest(BaseModel):
    actor: str
    role: str
    reason: Optional[str] = None
