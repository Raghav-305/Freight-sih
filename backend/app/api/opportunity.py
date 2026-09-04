from fastapi import APIRouter, HTTPException

from backend.app.schemas.opportunity import OpportunityScoreRequest, OpportunityScoreResponse
from ml.inference.freight_opportunity_score import score_opportunity

router = APIRouter(tags=["freight opportunity"])


@router.post("/freight-opportunity", response_model=OpportunityScoreResponse)
@router.post("/api/freight-opportunity", response_model=OpportunityScoreResponse)
def get_freight_opportunity_score(request: OpportunityScoreRequest) -> OpportunityScoreResponse:
    try:
        result = score_opportunity(**request.model_dump())
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return OpportunityScoreResponse(**result)
