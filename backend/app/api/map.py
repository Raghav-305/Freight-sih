"""
Pillar 2 -- Maritime GIS API routes.
"""
from fastapi import APIRouter

from backend.app.services import imd_adapter, map_data

router = APIRouter(tags=["pillar-2-gis"])


@router.get("/map/ports")
@router.get("/api/map/ports")
def ports():
    return map_data.get_layer("ports")


@router.get("/map/corridors")
@router.get("/api/map/corridors")
def corridors():
    return map_data.get_layer("corridors")


@router.get("/map/chokepoints")
@router.get("/api/map/chokepoints")
def chokepoints():
    return map_data.get_layer("chokepoints")


@router.get("/map/hazards")
@router.get("/api/map/hazards")
def hazards():
    return imd_adapter.return_with_freshness()


@router.get("/map/freshness")
@router.get("/api/map/freshness")
def freshness():
    hazard_status = imd_adapter.return_with_freshness()
    return map_data.freshness_summary({
        "truth_class": hazard_status["status"],
        "status": hazard_status["status"],
        "last_success_at": hazard_status["last_success_at"],
    })
