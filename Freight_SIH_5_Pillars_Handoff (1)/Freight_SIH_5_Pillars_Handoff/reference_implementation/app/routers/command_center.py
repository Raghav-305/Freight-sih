"""
Pillar 5 -- /command-center/summary aggregates across pillars server-side so
the frontend does not orchestrate unrelated calls (IMPLEMENTATION_SPEC.md
rule). This intentionally stays read-only and cheap: it reports counts and
freshness, not full payloads -- drill-down uses the pillar-specific endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.adapters import imd_adapter
from app.db import get_conn
from app.services import map_data

router = APIRouter(prefix="/api/command-center", tags=["pillar-5-command-center"])


@router.get("/summary")
def summary():
    with get_conn() as conn:
        rows = conn.execute("SELECT status, COUNT(*) as c FROM decisions GROUP BY status").fetchall()
        by_status = {r["status"]: r["c"] for r in rows}

    hazard = imd_adapter.return_with_freshness()

    return {
        "system_health": "OK",
        "decision_cases_by_status": by_status,
        "pending_review_count": by_status.get("SUBMITTED_FOR_REVIEW", 0),
        "map_freshness": map_data.freshness_summary({
            "truth_class": hazard["status"], "status": hazard["status"],
            "last_success_at": hazard["last_success_at"],
        }),
        "notes": [
            "Values are only labelled LIVE when a genuine live feed is connected (see hazard adapter status).",
            "Drill into /api/decisions/{id} or /api/map/* for full evidence, not this summary.",
        ],
    }
