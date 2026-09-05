"""
Pillar 5 -- Command Center aggregation API route.
"""
from fastapi import APIRouter

from backend.app.database.decisions import get_conn
from backend.app.services import imd_adapter, map_data

router = APIRouter(tags=["pillar-5-command-center"])


@router.get("/command-center/summary")
@router.get("/api/command-center/summary")
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
            "truth_class": hazard["status"],
            "status": hazard["status"],
            "last_success_at": hazard["last_success_at"],
        }),
        "notes": [
            "Values are only labelled LIVE when a genuine live feed is connected (see hazard adapter status).",
            "Drill into /decisions/{id} or /map/* for full evidence, not this summary.",
        ],
    }
