from ml.inference.risk import get_risk_score

from backend.app.schemas.risk import RiskRequest, RiskResponse, RiskScores


class RiskService:
    def assess(self, request: RiskRequest) -> RiskResponse:
        result = get_risk_score(
            route_id=request.route_id,
            origin_country=request.origin_country,
            destination_port=request.destination_port,
            date=request.date,
        )
        scores = {
            key: result[key]
            for key in ("market", "port", "weather", "geopolitical", "supply", "contract")
        }
        return RiskResponse(
            mode="rule_based",
            **result,
            scores=RiskScores(**scores),
            overall_risk=result["overall"],
        )


risk_service = RiskService()
