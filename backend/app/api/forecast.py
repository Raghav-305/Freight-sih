from fastapi import APIRouter

from backend.app.schemas.analysis import (
    ExplainForecastRequest,
    ExplainForecastResponse,
    ModelPerformanceResponse,
    WhatIfForecastRequest,
    WhatIfForecastResponse,
)
from backend.app.schemas.forecast import ForecastRequest, ForecastResponse
from backend.app.services.analysis_service import analysis_service
from backend.app.services.forecast_service import forecast_service

router = APIRouter(tags=["forecast"])


@router.post("/forecast", response_model=ForecastResponse)
@router.post("/api/forecast", response_model=ForecastResponse)
def create_forecast(request: ForecastRequest) -> ForecastResponse:
    return forecast_service.predict(request)


@router.post("/forecast/explain", response_model=ExplainForecastResponse)
@router.post("/api/forecast/explain", response_model=ExplainForecastResponse)
def explain_forecast(request: ExplainForecastRequest) -> ExplainForecastResponse:
    return analysis_service.explain_forecast(request)


@router.post("/forecast/what-if", response_model=WhatIfForecastResponse)
@router.post("/api/forecast/what-if", response_model=WhatIfForecastResponse)
def what_if_forecast(request: WhatIfForecastRequest) -> WhatIfForecastResponse:
    return analysis_service.what_if_forecast(request)
