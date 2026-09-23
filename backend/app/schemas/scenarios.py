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


class TceCalculationRequest(BaseModel):
    freight_rate_usd_mt: float = Field(gt=0, description="Gross freight rate quoted in $/MT")
    cargo_quantity_mt: float = Field(gt=0, description="Cargo volume in metric tons")
    sea_distance_nm: float = Field(gt=0, description="One-way sea distance in nautical miles")
    vessel_speed_knots: float = Field(12.5, gt=0, le=25.0, description="Vessel cruising speed in knots")
    sea_fuel_consumption_mt_day: float = Field(28.0, gt=0, description="Fuel consumption per day at sea (MT/day)")
    port_fuel_consumption_mt_day: float = Field(3.5, ge=0, description="Fuel consumption per day in port (MT/day)")
    bunker_price_usd_mt: float = Field(620.0, gt=0, description="VLSFO bunker fuel price ($/MT)")
    port_costs_usd: float = Field(45000.0, ge=0, description="Total port disbursements and agency fees ($)")
    canal_tolls_usd: float = Field(0.0, ge=0, description="Canal transit fees if applicable ($)")
    loading_days: float = Field(2.5, ge=0, description="Loading port duration (days)")
    discharge_days: float = Field(3.0, ge=0, description="Discharge port duration (days)")
    waiting_days: float = Field(2.0, ge=0, description="Expected berth waiting time (days)")
    ballast_ratio: float = Field(0.8, ge=0, le=1.5, description="Ratio of ballast steaming distance to laden distance")


class TceCalculationResponse(BaseModel):
    gross_freight_revenue_usd: float
    total_voyage_days: float
    laden_steaming_days: float
    ballast_steaming_days: float
    total_port_days: float
    total_fuel_consumed_mt: float
    total_bunker_cost_usd: float
    total_voyage_expenses_usd: float
    net_voyage_profit_usd: float
    tce_usd_day: float
    total_co2_emissions_mt: float
    cii_grams_co2_per_mt_nm: float
    carbon_cost_usd_est: float
    model_version: str = "tce-cii-v1"

