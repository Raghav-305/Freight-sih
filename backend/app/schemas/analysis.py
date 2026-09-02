from pydantic import BaseModel, Field


class ExplainForecastRequest(BaseModel):
    origin: str = "Australia"
    destination: str = "Dhamra"
    vessel_type: str = "Panamax"
    cargo_type: str = "Coal"
    cargo_quantity: float = Field(default=80000, gt=0)
    horizon: int = 30


class ExplainDriver(BaseModel):
    feature: str
    label: str
    contribution: float


class ExplainForecastResponse(BaseModel):
    horizon: str
    prediction: float
    base_value: float
    positive_drivers: list[ExplainDriver] = []
    negative_drivers: list[ExplainDriver] = []
    narrative: str


class WhatIfForecastRequest(BaseModel):
    origin: str = "Australia"
    destination: str = "Dhamra"
    vessel_type: str = "Panamax"
    cargo_type: str = "Coal"
    cargo_quantity: float = Field(default=80000, gt=0)
    freight_change_pct: float = 0.0
    bunker_change_pct: float = 0.0


class WhatIfHorizon(BaseModel):
    horizon: str
    baseline_usd_mt: float
    scenario_usd_mt: float
    delta_usd_mt: float
    delta_pct: float


class WhatIfForecastResponse(BaseModel):
    route_id: str | None = None
    scenario_inputs: dict[str, float]
    horizons: list[WhatIfHorizon]


class ModelPerformanceResponse(BaseModel):
    rows: list[dict]
    report_df: list[dict]
