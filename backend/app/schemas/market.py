from pydantic import BaseModel, Field


class MarketIndices(BaseModel):
    bdi: float
    bpi: float
    bsi: float
    bhsi: float | None = None
    bci: float | None = None


class MarketProbabilities(BaseModel):
    bearish: float
    neutral: float
    bullish: float


class MarketRouteSnapshot(BaseModel):
    date: str
    route_id: str
    origin: str
    destination: str
    vessel_class: str
    freight_usd_mt: float
    market_regime: str
    market_regime_interpretation: str
    market_score: float
    probabilities: MarketProbabilities
    freight_direction: str
    market_volatility: str
    forward_market_signal: str
    bunker_pressure: str
    port_pressure: str
    chartering_signal: str
    bunker_price_usd_mt: float
    coal_price_usd_mt: float


class MarketFactor(BaseModel):
    feature: str
    importance: float
    rank: int


class MarketIntelligenceResponse(BaseModel):
    mode: str
    updated_at: str
    indices: MarketIndices
    route_freight: float
    bunker: float
    coal: float
    market_regime: str
    market_regime_interpretation: str
    market_score: float
    probabilities: MarketProbabilities
    confidence: float
    freight_direction: str
    market_volatility: str
    forward_market_signal: str
    bunker_pressure: str
    port_pressure: str
    chartering_signal: str
    route: MarketRouteSnapshot
    top_factors: list[MarketFactor] = Field(default_factory=list)
    model_version: str
    dataset_version: str
    feature_version: str
    training_date: str
    horizon_days: int = 30
    note: str
