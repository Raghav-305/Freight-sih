from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ml.inference.congestion import predict_congestion

router = APIRouter(tags=["ports"])

PORTS = [
    {"name": "Dhamra", "port_code": "DHA", "queue": 3, "average_wait_days": 4.2, "p90_wait_days": 6.5, "berth_utilization": 78, "draft_limit_m": 18.5, "risk": "MEDIUM"},
    {"name": "Gangavaram", "port_code": "GAN", "queue": 2, "average_wait_days": 3.1, "p90_wait_days": 5.6, "berth_utilization": 72, "draft_limit_m": 16.5, "risk": "LOW"},
    {"name": "Gopalpur", "port_code": "GOP", "queue": 2, "average_wait_days": 2.8, "p90_wait_days": 4.9, "berth_utilization": 68, "draft_limit_m": 14.0, "risk": "LOW"},
    {"name": "Haldia", "port_code": "HAL", "queue": 4, "average_wait_days": 5.5, "p90_wait_days": 8.7, "berth_utilization": 82, "draft_limit_m": 12.5, "risk": "HIGH"},
    {"name": "Paradip", "port_code": "PAR", "queue": 3, "average_wait_days": 4.1, "p90_wait_days": 6.2, "berth_utilization": 76, "draft_limit_m": 17.0, "risk": "MEDIUM"},
    {"name": "Vizag", "port_code": "VIZ", "queue": 3, "average_wait_days": 4.4, "p90_wait_days": 6.8, "berth_utilization": 74, "draft_limit_m": 15.5, "risk": "MEDIUM"},
]


class PortCheckRequest(BaseModel):
    port: str
    vessel_type: str = "Panamax"
    cargo_quantity: float = Field(gt=0)
    arrival_date: str | None = None
    vessel_dwt: int | None = None


class PortCheckResponse(BaseModel):
    port: str
    vessel_type: str
    feasible: bool
    constraints: dict[str, bool]
    congestion_days: float
    current_queue: int
    model_version: str


@router.get("/ports")
@router.get("/api/ports")
def list_ports() -> dict[str, Any]:
    return {"ports": PORTS}


@router.post("/port/check", response_model=PortCheckResponse)
@router.post("/api/port/check", response_model=PortCheckResponse)
def check_port(request: PortCheckRequest) -> dict[str, Any]:
    port_name = request.port.strip()
    port = next((item for item in PORTS if item["name"].lower() == port_name.lower()), None)
    if port is None:
        raise ValueError(f"Unknown port: {request.port}")

    port_code = port["port_code"]
    arrival_date = request.arrival_date or "2026-07-15"
    vessel_dwt = request.vessel_dwt or max(45000, int(request.cargo_quantity * 0.55))

    prediction = predict_congestion(port_code, arrival_date, vessel_dwt, request.vessel_type)
    wait_days = max(float(prediction.get("expected_wait_days", 0.0)), 0.0)
    feasible = wait_days < 10.0

    constraints = {
        "draft": True,
        "berth": True,
        "vessel_type": True,
        "queue": wait_days < 8.0,
    }

    return {
        "port": port_name,
        "vessel_type": request.vessel_type,
        "feasible": feasible,
        "constraints": constraints,
        "congestion_days": round(wait_days, 2),
        "current_queue": port["queue"],
        "model_version": "congestion_sih_v1",
    }
