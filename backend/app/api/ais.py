"""
API router for Real-Time Satellite AIS Streaming, Kalman Trajectory Filtering & Spoofing Audits.
"""
from __future__ import annotations

from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from backend.app.services.ais_tracker import ais_service

router = APIRouter(tags=["ais-streaming"])


class SpoofSimRequest(BaseModel):
    mmsi: int = 419001234


@router.websocket("/ws/ais")
@router.websocket("/api/ws/ais")
async def websocket_ais_endpoint(ws: WebSocket) -> None:
    """WebSocket endpoint broadcasting real-time Kalman-filtered vessel packets to frontend clients."""
    await ais_service.broadcaster.register(ws)
    try:
        while True:
            # Keep connection open; clients can also send ping/text
            await ws.receive_text()
    except WebSocketDisconnect:
        ais_service.broadcaster.unregister(ws)
    except Exception:
        ais_service.broadcaster.unregister(ws)


@router.get("/ais/live-vessels")
@router.get("/api/ais/live-vessels")
def get_live_vessels_endpoint() -> dict[str, Any]:
    """Retrieve snapshot of all currently tracked bulk vessels with raw and Kalman-filtered positions."""
    vessels = ais_service.get_live_vessels()
    return {
        "count": len(vessels),
        "vessels": vessels,
        "mode": ais_service.mode,
        "spoof_events_count": ais_service.spoof_events_count,
    }


@router.get("/ais/status")
@router.get("/api/ais/status")
def get_ais_status_endpoint() -> dict[str, Any]:
    """Return telemetry service health, active clients count, and Kalman filtering parameters."""
    return ais_service.get_status()


@router.post("/ais/simulate-spoof")
@router.post("/api/ais/simulate-spoof")
def simulate_spoof_endpoint(req: SpoofSimRequest = SpoofSimRequest()) -> dict[str, Any]:
    """Inject an artificial position jump into a vessel trajectory to test Kinematic Sanity & Spoofing alerts."""
    return ais_service.trigger_spoof(mmsi=req.mmsi)


@router.post("/ais/reset")
@router.post("/api/ais/reset")
def reset_ais_endpoint() -> dict[str, Any]:
    """Reset tracked vessel coordinates back to initial Indian bulk corridor positions."""
    return ais_service.reset()
