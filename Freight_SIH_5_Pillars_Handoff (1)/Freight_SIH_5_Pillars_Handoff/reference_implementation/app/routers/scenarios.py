from fastapi import APIRouter

from app.models import BlendRequest, ScenarioCompareRequest, ScenarioRequest, SensitivityRequest
from app.services import economics

router = APIRouter(prefix="/api", tags=["pillar-1-economics"])


@router.post("/scenarios/evaluate")
def evaluate(req: ScenarioRequest):
    return economics.evaluate_scenario(req)


@router.post("/scenarios/compare")
def compare(req: ScenarioCompareRequest):
    return economics.compare_scenarios(req.scenarios)


@router.post("/scenarios/sensitivity")
def sensitivity(req: SensitivityRequest):
    return economics.sensitivity_grid(req)


@router.post("/blends/evaluate")
def blend(req: BlendRequest):
    return economics.evaluate_blend(req)
