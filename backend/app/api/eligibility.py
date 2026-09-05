"""
Pillar 4 -- Port Operations API routes.
"""
from fastapi import APIRouter

from backend.app.schemas.eligibility import DelayExposureRequest, DemurrageRequest, EligibilityRequest
from backend.app.services import eligibility as eligibility_service

router = APIRouter(tags=["pillar-4-port-ops"])


@router.post("/ports/eligibility")
@router.post("/api/ports/eligibility")
def check_eligibility(req: EligibilityRequest):
    return eligibility_service.evaluate(req)


@router.post("/delay/exposure")
@router.post("/api/delay/exposure")
def delay_exposure(req: DelayExposureRequest):
    return eligibility_service.delay_exposure(req)


@router.post("/demurrage/estimate")
@router.post("/api/demurrage/estimate")
def demurrage_estimate(req: DemurrageRequest):
    return eligibility_service.demurrage_estimate(req)
