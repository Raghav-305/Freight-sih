from pydantic import BaseModel, Field


class OpportunityScoreRequest(BaseModel):
    origin: str = "Australia"
    destination: str = "Dhamra"
    vessel_class: str = "Panamax"
    horizon: int = Field(default=30, description="Forecast horizon in days: 7, 30, or 60")
    as_of_date: str | None = None


class OpportunityScoreResponse(BaseModel):
    date: str
    route_id: str
    origin: str
    destination: str
    vessel_class: str
    horizon_days: int
    freight_usd_mt: float
    expected_return_pct: float
    expected_freight_usd_mt: float
    forecast_source: str
    fos: float
    recommendation: str
    components: dict[str, float]
    contributions: dict[str, float]
    model_version: str
    note: str
