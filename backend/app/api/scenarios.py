"""
Pillar 1 -- Policy & Landed Cost Economics API routes.
"""
from fastapi import APIRouter

from backend.app.schemas.scenarios import (
    BlendRequest,
    ScenarioCompareRequest,
    ScenarioRequest,
    SensitivityRequest,
    TceCalculationRequest,
    TceCalculationResponse,
)
from backend.app.services import economics

router = APIRouter(tags=["pillar-1-economics"])


@router.post("/scenarios/evaluate")
@router.post("/api/scenarios/evaluate")
def evaluate(req: ScenarioRequest):
    return economics.evaluate_scenario(req)


@router.post("/scenarios/compare")
@router.post("/api/scenarios/compare")
def compare(req: ScenarioCompareRequest):
    return economics.compare_scenarios(req.scenarios)


@router.post("/scenarios/sensitivity")
@router.post("/api/scenarios/sensitivity")
def sensitivity(req: SensitivityRequest):
    return economics.sensitivity_grid(req)


@router.post("/blends/evaluate")
@router.post("/api/blends/evaluate")
def blend(req: BlendRequest):
    return economics.evaluate_blend(req)


@router.post("/scenarios/tce", response_model=TceCalculationResponse)
@router.post("/api/scenarios/tce", response_model=TceCalculationResponse)
def calculate_tce(req: TceCalculationRequest):
    return economics.calculate_voyage_tce(req)

