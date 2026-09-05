"""
Pillar 1 -- Policy & Landed Cost Economics Schemas.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

TruthClass = Literal[
    "STATIC_REFERENCE", "OFFICIAL_PERIODIC", "MODEL_OUTPUT", "USER_INPUT", "DEMO_SIMULATION"
]


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
