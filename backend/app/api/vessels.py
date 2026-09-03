from fastapi import APIRouter, HTTPException

from backend.app.schemas.vessel import VesselRecommendationRequest, VesselRecommendationResponse
from ml.inference.vessel_intelligence import recommend_vessels

router = APIRouter(tags=["vessels"])


@router.post("/vessels/recommend", response_model=VesselRecommendationResponse)
@router.post("/api/vessels/recommend", response_model=VesselRecommendationResponse)
def recommend_vessels_endpoint(request: VesselRecommendationRequest) -> VesselRecommendationResponse:
    try:
        result = recommend_vessels(**request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return VesselRecommendationResponse(**result)
