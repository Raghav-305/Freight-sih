from __future__ import annotations

from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ml.inference.congestion import predict_congestion

router = APIRouter(tags=["ports"])

# Accurate Port Master data based on new_port_constraints.csv
PORTS = [
    {
        "name": "Dhamra",
        "port_code": "DHA",
        "queue": 3,
        "average_wait_days": 4.2,
        "p90_wait_days": 6.5,
        "berth_utilization": 78,
        "draft_limit_m": 18.0,
        "max_dwt_mt": 100000,
        "max_loa_m": 280,
        "max_beam_m": 45,
        "has_tidal_restriction": False,
        "risk": "MEDIUM",
    },
    {
        "name": "Gangavaram",
        "port_code": "GAN",
        "queue": 2,
        "average_wait_days": 3.1,
        "p90_wait_days": 5.6,
        "berth_utilization": 72,
        "draft_limit_m": 15.5,
        "max_dwt_mt": 95000,
        "max_loa_m": 275,
        "max_beam_m": 43,
        "has_tidal_restriction": False,
        "risk": "LOW",
    },
    {
        "name": "Gopalpur",
        "port_code": "GOP",
        "queue": 2,
        "average_wait_days": 2.8,
        "p90_wait_days": 4.9,
        "berth_utilization": 68,
        "draft_limit_m": 14.0,
        "max_dwt_mt": 70000,
        "max_loa_m": 250,
        "max_beam_m": 40,
        "has_tidal_restriction": False,
        "risk": "LOW",
    },
    {
        "name": "Haldia",
        "port_code": "HAL",
        "queue": 4,
        "average_wait_days": 5.5,
        "p90_wait_days": 8.7,
        "berth_utilization": 82,
        "draft_limit_m": 12.5,
        "max_dwt_mt": 60000,
        "max_loa_m": 230,
        "max_beam_m": 38,
        "has_tidal_restriction": True,
        "risk": "HIGH",
    },
    {
        "name": "Paradip",
        "port_code": "PAR",
        "queue": 3,
        "average_wait_days": 4.1,
        "p90_wait_days": 6.2,
        "berth_utilization": 76,
        "draft_limit_m": 14.5,
        "max_dwt_mt": 85000,
        "max_loa_m": 300,
        "max_beam_m": 46,
        "has_tidal_restriction": False,
        "risk": "MEDIUM",
    },
    {
        "name": "Vizag",
        "port_code": "VIZ",
        "queue": 3,
        "average_wait_days": 4.4,
        "p90_wait_days": 6.8,
        "berth_utilization": 74,
        "draft_limit_m": 14.5,
        "max_dwt_mt": 65000,
        "max_loa_m": 240,
        "max_beam_m": 40,
        "has_tidal_restriction": False,
        "risk": "MEDIUM",
    },
]

# Standard Vessel Physical Specifications
VESSEL_SPECS = {
    "handysize": {"draft_m": 10.2, "loa_m": 180, "beam_m": 30.0, "dwt_mt": 38000},
    "supramax": {"draft_m": 12.8, "loa_m": 190, "beam_m": 32.3, "dwt_mt": 58000},
    "panamax": {"draft_m": 14.2, "loa_m": 228, "beam_m": 32.3, "dwt_mt": 82000},
    "capesize": {"draft_m": 17.8, "loa_m": 292, "beam_m": 45.0, "dwt_mt": 180000},
}


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
    vessel_class_key = request.vessel_type.strip().lower()
    specs = VESSEL_SPECS.get(vessel_class_key, VESSEL_SPECS["panamax"])

    vessel_dwt = request.vessel_dwt or specs["dwt_mt"]

    # ML Congestion prediction
    prediction = predict_congestion(port_code, arrival_date, vessel_dwt, request.vessel_type)
    wait_days = max(float(prediction.get("expected_wait_days", 0.0)), 0.0)

    # Real Physical Constraint Evaluations
    draft_ok = specs["draft_m"] <= port["draft_limit_m"]
    dwt_ok = vessel_dwt <= port["max_dwt_mt"]
    loa_ok = specs["loa_m"] <= port["max_loa_m"]
    queue_ok = wait_days < 9.0  # Alert if queue waiting exceeds 9 days

    # Overall feasibility
    feasible = draft_ok and dwt_ok and loa_ok and queue_ok

    constraints = {
        "draft": draft_ok,
        "berth_loa": loa_ok,
        "dwt_capacity": dwt_ok,
        "queue_tolerance": queue_ok,
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
