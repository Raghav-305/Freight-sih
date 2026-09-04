from fastapi import APIRouter, HTTPException

from backend.app.schemas.risk import RiskRequest, RiskResponse
from backend.app.services.risk_service import risk_service

router = APIRouter(tags=["risk"])


@router.post("/risk", response_model=RiskResponse)
@router.post("/api/risk", response_model=RiskResponse)
def assess_risk(request: RiskRequest) -> RiskResponse:
    try:
        return risk_service.assess(request)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
