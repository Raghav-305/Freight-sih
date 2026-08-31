from backend.app.schemas.forecast import ForecastRequest, ForecastResponse
from ml.inference.forecast import run_forecast


class ForecastService:
    def predict(self, request: ForecastRequest) -> ForecastResponse:
        result = run_forecast(request.model_dump(mode="json"))
        return ForecastResponse(**result)


forecast_service = ForecastService()
