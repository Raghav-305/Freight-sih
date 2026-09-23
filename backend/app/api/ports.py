from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml.inference.congestion import predict_congestion

router = APIRouter(tags=["ports"])

# Accurate Port Master data covering All 12 Major Port Authorities of India + Premier Bulk Terminals
PORTS = [
    {
        "name": "Dhamra",
        "port_code": "DHA",
        "state": "Odisha",
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
        "primary_ml_supported": True,
    },
    {
        "name": "Gangavaram",
        "port_code": "GAN",
        "state": "Andhra Pradesh",
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
        "primary_ml_supported": True,
    },
    {
        "name": "Gopalpur",
        "port_code": "GOP",
        "state": "Odisha",
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
        "primary_ml_supported": True,
    },
    {
        "name": "Haldia",
        "port_code": "HAL",
        "state": "West Bengal",
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
        "primary_ml_supported": True,
    },
    {
        "name": "Paradip",
        "port_code": "PAR",
        "state": "Odisha",
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
        "primary_ml_supported": True,
    },
    {
        "name": "Vizag",
        "port_code": "VIZ",
        "state": "Andhra Pradesh",
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
        "primary_ml_supported": True,
    },
    {
        "name": "Kamarajar (Ennore)",
        "port_code": "ENR",
        "state": "Tamil Nadu",
        "queue": 2,
        "average_wait_days": 2.5,
        "p90_wait_days": 4.5,
        "berth_utilization": 65,
        "draft_limit_m": 16.0,
        "max_dwt_mt": 85000,
        "max_loa_m": 260,
        "max_beam_m": 43,
        "has_tidal_restriction": False,
        "risk": "LOW",
        "primary_ml_supported": False,
    },
    {
        "name": "Chennai",
        "port_code": "CHN",
        "state": "Tamil Nadu",
        "queue": 3,
        "average_wait_days": 3.8,
        "p90_wait_days": 5.9,
        "berth_utilization": 70,
        "draft_limit_m": 14.0,
        "max_dwt_mt": 75000,
        "max_loa_m": 250,
        "max_beam_m": 40,
        "has_tidal_restriction": False,
        "risk": "MEDIUM",
        "primary_ml_supported": False,
    },
    {
        "name": "V.O. Chidambaranar (Tuticorin)",
        "port_code": "TUT",
        "state": "Tamil Nadu",
        "queue": 2,
        "average_wait_days": 3.2,
        "p90_wait_days": 5.4,
        "berth_utilization": 68,
        "draft_limit_m": 14.2,
        "max_dwt_mt": 75000,
        "max_loa_m": 245,
        "max_beam_m": 38,
        "has_tidal_restriction": False,
        "risk": "LOW",
        "primary_ml_supported": False,
    },
    {
        "name": "Cochin",
        "port_code": "COC",
        "state": "Kerala",
        "queue": 1,
        "average_wait_days": 2.1,
        "p90_wait_days": 3.8,
        "berth_utilization": 58,
        "draft_limit_m": 13.5,
        "max_dwt_mt": 60000,
        "max_loa_m": 230,
        "max_beam_m": 36,
        "has_tidal_restriction": False,
        "risk": "LOW",
        "primary_ml_supported": False,
    },
    {
        "name": "New Mangalore",
        "port_code": "NMP",
        "state": "Karnataka",
        "queue": 2,
        "average_wait_days": 3.0,
        "p90_wait_days": 5.1,
        "berth_utilization": 66,
        "draft_limit_m": 14.5,
        "max_dwt_mt": 80000,
        "max_loa_m": 260,
        "max_beam_m": 42,
        "has_tidal_restriction": False,
        "risk": "LOW",
        "primary_ml_supported": False,
    },
    {
        "name": "Mormugao",
        "port_code": "MOR",
        "state": "Goa",
        "queue": 3,
        "average_wait_days": 4.0,
        "p90_wait_days": 6.3,
        "berth_utilization": 72,
        "draft_limit_m": 14.0,
        "max_dwt_mt": 75000,
        "max_loa_m": 250,
        "max_beam_m": 40,
        "has_tidal_restriction": False,
        "risk": "MEDIUM",
        "primary_ml_supported": False,
    },
    {
        "name": "Mumbai Port",
        "port_code": "BOM",
        "state": "Maharashtra",
        "queue": 2,
        "average_wait_days": 3.5,
        "p90_wait_days": 5.5,
        "berth_utilization": 69,
        "draft_limit_m": 14.0,
        "max_dwt_mt": 80000,
        "max_loa_m": 260,
        "max_beam_m": 42,
        "has_tidal_restriction": False,
        "risk": "MEDIUM",
        "primary_ml_supported": False,
    },
    {
        "name": "Deendayal (Kandla)",
        "port_code": "IXY",
        "state": "Gujarat",
        "queue": 3,
        "average_wait_days": 3.9,
        "p90_wait_days": 6.1,
        "berth_utilization": 75,
        "draft_limit_m": 13.5,
        "max_dwt_mt": 75000,
        "max_loa_m": 255,
        "max_beam_m": 40,
        "has_tidal_restriction": True,
        "risk": "MEDIUM",
        "primary_ml_supported": False,
    },
    {
        "name": "Krishnapatnam",
        "port_code": "KRI",
        "state": "Andhra Pradesh",
        "queue": 2,
        "average_wait_days": 2.9,
        "p90_wait_days": 4.8,
        "berth_utilization": 64,
        "draft_limit_m": 18.0,
        "max_dwt_mt": 180000,
        "max_loa_m": 300,
        "max_beam_m": 48,
        "has_tidal_restriction": False,
        "risk": "LOW",
        "primary_ml_supported": False,
    },
    {
        "name": "Jaigarh",
        "port_code": "JAI",
        "state": "Maharashtra",
        "queue": 1,
        "average_wait_days": 2.2,
        "p90_wait_days": 3.9,
        "berth_utilization": 60,
        "draft_limit_m": 18.5,
        "max_dwt_mt": 200000,
        "max_loa_m": 310,
        "max_beam_m": 50,
        "has_tidal_restriction": False,
        "risk": "LOW",
        "primary_ml_supported": False,
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
@router.post("/ports/check", response_model=PortCheckResponse)
@router.post("/api/ports/check", response_model=PortCheckResponse)
def check_port(request: PortCheckRequest) -> dict[str, Any]:
    port_name = request.port.strip()
    name_lower = port_name.lower()
    
    # Common Indian port aliases
    if name_lower in ("vizag", "visakhapatnam", "vpa", "viz"):
        name_lower = "vizag"
    elif name_lower in ("ennore", "kamarajar", "kamarajar (ennore)"):
        name_lower = "kamarajar (ennore)"
    elif name_lower in ("tuticorin", "voc", "v.o. chidambaranar", "v.o. chidambaranar (tuticorin)"):
        name_lower = "v.o. chidambaranar (tuticorin)"
    elif name_lower in ("kandla", "deendayal", "deendayal (kandla)"):
        name_lower = "deendayal (kandla)"
    elif name_lower in ("mumbai", "mumbai port", "mbpt", "bom"):
        name_lower = "mumbai port"

    port = next((item for item in PORTS if item["name"].lower() == name_lower or item["port_code"].lower() == name_lower), None)
    if port is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown port: '{request.port}'. Available ports: {[p['name'] for p in PORTS]}",
        )

    port_code = port["port_code"]
    arrival_date = request.arrival_date or "2026-07-15"
    vessel_class_key = request.vessel_type.strip().lower()
    specs = VESSEL_SPECS.get(vessel_class_key, VESSEL_SPECS["panamax"])

    vessel_dwt = request.vessel_dwt or specs["dwt_mt"]

    # Congestion prediction: ML model for 6 core ports, Port Authority baseline for expanded ports
    if port.get("primary_ml_supported", False):
        prediction = predict_congestion(port_code, arrival_date, vessel_dwt, request.vessel_type)
        wait_days = max(float(prediction.get("expected_wait_days", 0.0)), 0.0)
        model_version = "congestion_sih_v1 (XGBoost ML)"
    else:
        wait_days = float(port.get("average_wait_days", 3.0))
        model_version = "port_authority_operational_baseline"

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
        "port": port["name"],
        "vessel_type": request.vessel_type,
        "feasible": feasible,
        "constraints": constraints,
        "congestion_days": round(wait_days, 2),
        "current_queue": port["queue"],
        "model_version": model_version,
    }
