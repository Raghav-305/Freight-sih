from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.market import MarketIntelligenceResponse
from backend.app.services.market_service import market_service

router = APIRouter(tags=["market"])


@router.get("/market", response_model=MarketIntelligenceResponse)
@router.get("/api/market", response_model=MarketIntelligenceResponse)
def get_market_intelligence(
    origin: str = Query(default="Australia"),
    destination: str = Query(default="Dhamra"),
    vessel_class: str = Query(default="Panamax"),
    as_of_date: str | None = Query(default=None),
) -> MarketIntelligenceResponse:
    try:
        return market_service.get_market_intelligence(
            origin=origin,
            destination=destination,
            vessel_class=vessel_class,
            as_of_date=as_of_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
