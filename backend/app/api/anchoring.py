"""
OPTIONAL external anchoring endpoints (Polygon Amoy testnet).

Covers ONLY the hash-chained decision_events, NOT the legacy AuditLogRecord
table behind /audit/logs. See services/anchoring.py.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.services import anchoring

router = APIRouter(tags=["audit-anchoring (optional)"])


@router.get("/audit/anchor-status")
@router.get("/api/audit/anchor-status")
def anchor_status():
    """Latest anchor + explorer link. Reads only the local DB, so it works offline."""
    return anchoring.get_status()


@router.post("/audit/anchor")
@router.post("/api/audit/anchor")
def anchor_now():
    """'Anchor now' button. Always returns HTTP 200 with a status field (never hangs/crashes)."""
    return anchoring.anchor_now()


@router.get("/audit/anchor/{anchor_id}/verify")
@router.get("/api/audit/anchor/{anchor_id}/verify")
def verify(anchor_id: int, onchain: bool = False):
    """Recompute the Merkle root from local events (offline). ?onchain=true also checks the testnet tx."""
    result = anchoring.verify_anchor(anchor_id, onchain=onchain)
    if result is None:
        raise HTTPException(status_code=404, detail="ANCHOR_NOT_FOUND")
    return result


# Periodic anchoring is opt-in: only starts if ANCHOR_INTERVAL_MINUTES > 0 and a key is set.
anchoring.start_scheduler_if_enabled()
