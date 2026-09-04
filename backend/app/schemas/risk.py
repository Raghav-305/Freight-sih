from pydantic import BaseModel


class RiskRequest(BaseModel):
    route_id: str
    origin_country: str
    destination_port: str
    date: str


class RiskScores(BaseModel):
    market: float
    port: float
    weather: float
    geopolitical: float
    supply: float
    contract: float


class RiskResponse(BaseModel):
    mode: str = "rule_based"
    route_id: str
    origin_country: str
    destination_port: str
    destination_port_name: str
    date: str
    market: float
    port: float
    weather: float
    geopolitical: float
    supply: float
    contract: float
    overall: float
    overall_risk: float
    scores: RiskScores
