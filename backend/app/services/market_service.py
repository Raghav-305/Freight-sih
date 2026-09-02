from ml.inference.market_intelligence import run_market_intelligence_live_inference

from backend.app.schemas.market import MarketIntelligenceResponse


class MarketService:
    def get_market_intelligence(
        self,
        origin: str = "Australia",
        destination: str = "Dhamra",
        vessel_class: str = "Panamax",
        as_of_date: str | None = None,
    ) -> MarketIntelligenceResponse:
        result = run_market_intelligence_live_inference(
            origin=origin,
            destination=destination,
            vessel_class=vessel_class,
            as_of_date=as_of_date,
        )
        return MarketIntelligenceResponse(**result)


market_service = MarketService()
