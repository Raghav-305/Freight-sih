from datetime import date

from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    origin: str
    destination: str
    vessel_type: str
    cargo_type: str = "Coal"
    cargo_quantity: float = Field(gt=0)
    laycan_start: date | None = None
    laycan_end: date | None = None


class ForecastBand(BaseModel):
    p10: float
    p25: float | None = None
    p50: float
    p75: float | None = None
    p90: float


class ShapContribution(BaseModel):
    feature: str
    impact: float
    direction: str


class ForecastResponse(BaseModel):
    current_freight: float
    forecast: dict[str, ForecastBand]
    confidence: float
    model_version: str
    dataset_version: str
    feature_version: str
    training_date: str
    shap: list[ShapContribution] = []
