from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas.counterfactual import (
    RiskCounterfactualRequest,
    RiskCounterfactualResponse,
    CharterCounterfactualRequest,
    CharterCounterfactualResponse,
    CustomRiskWhatIfRequest,
    CustomRiskWhatIfResponse,
    CustomCharterWhatIfRequest,
    CustomCharterWhatIfResponse,
)
from backend.app.services.counterfactual_service import counterfactual_service

router = APIRouter(tags=["counterfactual"])


@router.post("/counterfactual/risk", response_model=RiskCounterfactualResponse)
@router.post("/api/counterfactual/risk", response_model=RiskCounterfactualResponse)
def explain_risk_endpoint(request: RiskCounterfactualRequest) -> RiskCounterfactualResponse:
    """Evaluate smallest realistic changes that reduce overall route risk and identify key levers."""
    try:
        return counterfactual_service.explain_risk(request)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/counterfactual/charter", response_model=CharterCounterfactualResponse)
@router.post("/api/counterfactual/charter", response_model=CharterCounterfactualResponse)
def explain_charter_endpoint(request: CharterCounterfactualRequest) -> CharterCounterfactualResponse:
    """Evaluate cost sensitivity of charter portfolio across bunker, congestion, and spot rate shifts."""
    try:
        return counterfactual_service.explain_charter(request)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/counterfactual/risk/simulate", response_model=CustomRiskWhatIfResponse)
@router.post("/api/counterfactual/risk/simulate", response_model=CustomRiskWhatIfResponse)
def simulate_risk_endpoint(request: CustomRiskWhatIfRequest) -> CustomRiskWhatIfResponse:
    """Run an interactive what-if risk simulation with user-defined factor overrides."""
    try:
        return counterfactual_service.simulate_risk(request)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/counterfactual/charter/simulate", response_model=CustomCharterWhatIfResponse)
@router.post("/api/counterfactual/charter/simulate", response_model=CustomCharterWhatIfResponse)
def simulate_charter_endpoint(request: CustomCharterWhatIfRequest) -> CustomCharterWhatIfResponse:
    """Run an interactive what-if charter simulation with bunker %, congestion days, and spot rate shifts."""
    try:
        return counterfactual_service.simulate_charter(request)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
