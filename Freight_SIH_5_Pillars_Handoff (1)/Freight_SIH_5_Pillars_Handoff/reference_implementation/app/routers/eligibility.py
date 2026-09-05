from fastapi import APIRouter

from app.models import DelayExposureRequest, DemurrageRequest, EligibilityRequest
from app.services import eligibility as eligibility_service

router = APIRouter(prefix="/api", tags=["pillar-4-port-ops"])


@router.post("/ports/eligibility")
def check_eligibility(req: EligibilityRequest):
    return eligibility_service.evaluate(req)


@router.post("/delay/exposure")
def delay_exposure(req: DelayExposureRequest):
    return eligibility_service.delay_exposure(req)


@router.post("/demurrage/estimate")
def demurrage_estimate(req: DemurrageRequest):
    return eligibility_service.demurrage_estimate(req)
