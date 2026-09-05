from fastapi import APIRouter, HTTPException

from app.adapters import imd_adapter
from app.services import map_data

router = APIRouter(prefix="/api/map", tags=["pillar-2-gis"])


@router.get("/ports")
def ports():
    return map_data.get_layer("ports")


@router.get("/corridors")
def corridors():
    return map_data.get_layer("corridors")


@router.get("/chokepoints")
def chokepoints():
    return map_data.get_layer("chokepoints")


@router.get("/hazards")
def hazards():
    return imd_adapter.return_with_freshness()


@router.get("/freshness")
def freshness():
    hazard_status = imd_adapter.return_with_freshness()
    return map_data.freshness_summary({"truth_class": hazard_status["status"], "status": hazard_status["status"],
                                        "last_success_at": hazard_status["last_success_at"]})
