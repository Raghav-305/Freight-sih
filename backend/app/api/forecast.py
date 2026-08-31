from fastapi import APIRouter

from backend.app.schemas.forecast import ForecastRequest, ForecastResponse
from backend.app.services.forecast_service import forecast_service

router = APIRouter(tags=["forecast"])


@router.post("/forecast", response_model=ForecastResponse)
def create_forecast(request: ForecastRequest) -> ForecastResponse:
    return forecast_service.predict(request)
