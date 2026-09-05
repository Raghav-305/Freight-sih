"""
Pillar 3 -- Decision workflow.

DRAFT -> ANALYSED -> SUBMITTED_FOR_REVIEW -> APPROVED | RETURNED | REJECTED

Rules enforced here:
  - a submitted snapshot cannot be silently mutated (payload_json is frozen
    at SUBMITTED_FOR_REVIEW and never rewritten by later actions)
  - approval/return/reject records actor/role/time/reason
  - rejection requires a reason
  - self-approval is blocked when approver == creator (configurable off for demo/testing)
  - every transition appends a hash-chained audit event
"""
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone

from backend.app.database.decisions import dumps, get_conn
from backend.app.schemas.decisions import DecisionActionRequest, DecisionCreateRequest
from backend.app.services import audit

ALLOWED_TRANSITIONS = {
    "DRAFT": {"ANALYSED"},
    "ANALYSED": {"SUBMITTED_FOR_REVIEW"},
    "SUBMITTED_FOR_REVIEW": {"APPROVED", "RETURNED", "REJECTED"},
    "RETURNED": {"ANALYSED"},
}


class DecisionError(Exception):
    pass


def _input_hash(payload: dict) -> str:
    return hashlib.sha256(dumps(payload).encode()).hexdigest()


def create_decision(req: DecisionCreateRequest, block_self_approval: bool = True) -> dict:
    decision_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    payload = req.model_dump()
    input_hash = _input_hash(payload)

    with get_conn() as conn:
        conn.execute(
            """INSERT INTO decisions
               (decision_id, analysis_version, status, input_hash, payload_json,
                created_at, updated_at, created_by)
               VALUES (?,?,?,?,?,?,?,?)""",
            (decision_id, 1, "DRAFT", input_hash, dumps(payload), now, now, req.created_by),
        )
        conn.commit()

    audit.append_event(decision_id, "CREATED", req.created_by, req.created_by_role, None,
                       {"analysis_version": 1, "input_hash": input_hash})
    return get_decision(decision_id)


def get_decision(decision_id: str) -> dict:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM decisions WHERE decision_id=?", (decision_id,)).fetchone()
        if not row:
            raise DecisionError("DECISION_NOT_FOUND")
        d = dict(row)
        d["payload"] = json.loads(d.pop("payload_json"))
        return d


def _transition(decision_id: str, new_status: str, action: DecisionActionRequest,
                require_reason: bool = False, block_self_approval: bool = False,
                creator_check: bool = False) -> dict:
    decision = get_decision(decision_id)
    current = decision["status"]

    if new_status not in ALLOWED_TRANSITIONS.get(current, set()):
        raise DecisionError(f"ILLEGAL_TRANSITION:{current}->{new_status}")

    if require_reason and not action.reason:
        raise DecisionError("REASON_REQUIRED")

    if creator_check and block_self_approval and action.actor == decision["created_by"]:
        raise DecisionError("SELF_APPROVAL_BLOCKED")

    now = datetime.now(timezone.utc).isoformat()
    new_version = decision["analysis_version"] + 1 if new_status == "ANALYSED" and current == "RETURNED" else decision["analysis_version"]

    with get_conn() as conn:
        conn.execute(
            "UPDATE decisions SET status=?, updated_at=?, analysis_version=? WHERE decision_id=?",
            (new_status, now, new_version, decision_id),
        )
        conn.commit()

    audit.append_event(decision_id, f"TRANSITION_{current}_TO_{new_status}", action.actor, action.role,
                       action.reason, {"from": current, "to": new_status, "analysis_version": new_version})
    return get_decision(decision_id)


def mark_analysed(decision_id: str, action: DecisionActionRequest) -> dict:
    return _transition(decision_id, "ANALYSED", action)


def submit_for_review(decision_id: str, action: DecisionActionRequest) -> dict:
    return _transition(decision_id, "SUBMITTED_FOR_REVIEW", action)


def approve(decision_id: str, action: DecisionActionRequest) -> dict:
    return _transition(decision_id, "APPROVED", action, block_self_approval=True, creator_check=True)


def return_decision(decision_id: str, action: DecisionActionRequest) -> dict:
    return _transition(decision_id, "RETURNED", action, require_reason=True)


def reject(decision_id: str, action: DecisionActionRequest) -> dict:
    return _transition(decision_id, "REJECTED", action, require_reason=True)
