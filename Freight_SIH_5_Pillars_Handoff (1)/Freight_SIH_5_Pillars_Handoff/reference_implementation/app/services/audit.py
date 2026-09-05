"""
Pillar 3 -- Tamper-evident audit hash chain.

event.current_hash = SHA256(previous_hash + canonical_event_payload)

This is "tamper-evident", not a legal certification -- see JUDGE_QA.md.
Genesis hash is 64 zeroes so the first event in a chain still has a
well-defined previous_hash to hash against.
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from app.db import dumps, get_conn

GENESIS_HASH = "0" * 64


def event_hash(previous_hash: str, payload: dict) -> str:
    canonical = dumps(payload)
    return hashlib.sha256((previous_hash + canonical).encode()).hexdigest()


def append_event(decision_id: str, event_type: str, actor: str, role: str,
                  reason: str | None, payload: dict) -> dict:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT current_hash FROM decision_events WHERE decision_id=? ORDER BY event_id DESC LIMIT 1",
            (decision_id,),
        ).fetchone()
        previous_hash = row["current_hash"] if row else GENESIS_HASH

        full_payload = {"event_type": event_type, "actor": actor, "role": role,
                         "reason": reason, "data": payload}
        current_hash = event_hash(previous_hash, full_payload)
        created_at = datetime.now(timezone.utc).isoformat()

        conn.execute(
            """INSERT INTO decision_events
               (decision_id, event_type, actor, role, reason, payload_json,
                previous_hash, current_hash, created_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (decision_id, event_type, actor, role, reason, dumps(payload),
             previous_hash, current_hash, created_at),
        )
        conn.commit()
        return {"event_type": event_type, "previous_hash": previous_hash,
                "current_hash": current_hash, "created_at": created_at}


def get_chain(decision_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM decision_events WHERE decision_id=? ORDER BY event_id ASC",
            (decision_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def verify_chain(decision_id: str) -> dict:
    """Recomputes every hash from stored payloads and reports the first break, if any."""
    chain = get_chain(decision_id)
    previous_hash = GENESIS_HASH
    for ev in chain:
        import json
        full_payload = {"event_type": ev["event_type"], "actor": ev["actor"], "role": ev["role"],
                         "reason": ev["reason"], "data": json.loads(ev["payload_json"])}
        recomputed = event_hash(previous_hash, full_payload)
        if recomputed != ev["current_hash"] or previous_hash != ev["previous_hash"]:
            return {"valid": False, "broken_at_event_id": ev["event_id"]}
        previous_hash = ev["current_hash"]
    return {"valid": True, "broken_at_event_id": None, "event_count": len(chain)}
