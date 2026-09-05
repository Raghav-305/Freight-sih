"""
Pillar 3 -- Governance & Decision Workflow Schemas.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel

TruthClass = Literal[
    "STATIC_REFERENCE", "OFFICIAL_PERIODIC", "MODEL_OUTPUT", "USER_INPUT", "DEMO_SIMULATION"
]

DecisionStatus = Literal[
    "DRAFT", "ANALYSED", "SUBMITTED_FOR_REVIEW", "APPROVED", "RETURNED", "REJECTED"
]


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
