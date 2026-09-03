from pydantic import BaseModel, Field


class VesselRecommendationRequest(BaseModel):
    destination: str = "Dhamra"
    vessel_class: str = "Panamax"
    cargo_quantity: float = Field(default=70000, gt=0)
    as_of_date: str | None = None
    limit: int = Field(default=10, ge=1, le=50)


class VesselCandidate(BaseModel):
    imo: str
    vessel_name: str
    vessel_class: str
    destination: str
    dwt_mt: float
    draft_m: float
    predicted_waiting_hours: float
    suitability_score: float
    feasible: bool
    eligibility: str
    recommendation_tier: str
    failed_constraints: list[str] = []


class VesselRecommendationResponse(BaseModel):
    destination: str
    vessel_class: str
    cargo_quantity: float
    as_of_date: str | None
    model_version: str
    target: str
    candidates: list[VesselCandidate]
    candidate_count: int
    feasible_count: int
    note: str
