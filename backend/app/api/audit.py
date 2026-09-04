from __future__ import annotations

from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import RecommendationRecord, AuditLogRecord

router = APIRouter(tags=["audit"])


class AuditReviewRequest(BaseModel):
    recommendation_id: int | None = Field(default=None, description="ID of the recommendation to review")
    reviewer_name: str = Field(default="Chief General Manager (Shipping)", description="Officer reviewing decision")
    decision: str = Field(default="APPROVED", description="Decision: APPROVED, REJECTED, or MODIFIED")
    comment: str = Field(default="Strategy aligns with quarterly fuel hedging and thermal plant laycan targets.")
    tender_reference: str | None = Field(default="TENDER-SAIL-COAL-2026-Q4", description="Official tender or contract ref")


@router.get("/audit/logs")
@router.get("/api/audit/logs")
def get_audit_logs(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retrieve timestamped procurement governance and recommendation review logs."""
    try:
        logs = db.query(AuditLogRecord).order_by(AuditLogRecord.timestamp.desc()).limit(20).all()
        recommendations = db.query(RecommendationRecord).order_by(RecommendationRecord.created_at.desc()).limit(10).all()

        return {
            "audit_trail": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "",
                    "action": log.action,
                    "user_id": log.user_id,
                    "entity_id": log.entity_id,
                    "details": log.details,
                }
                for log in logs
            ],
            "recent_recommendations": [
                {
                    "id": rec.id,
                    "created_at": rec.created_at.strftime("%Y-%m-%d %H:%M:%S") if rec.created_at else "",
                    "type": rec.recommendation_type,
                    "status": rec.reviewer_status,
                    "reviewer": rec.reviewer_name,
                    "comment": rec.reviewer_comment,
                    "reviewed_at": rec.reviewed_at.strftime("%Y-%m-%d %H:%M:%S") if rec.reviewed_at else None,
                    "summary": rec.outputs_json.get("strategy") if isinstance(rec.outputs_json, dict) else "Recommendation",
                }
                for rec in recommendations
            ],
            "cvc_compliance_statement": (
                "All automated algorithmic recommendations require authorized human sign-off "
                "under Central Vigilance Commission (CVC) dry-bulk procurement guidelines."
            ),
        }
    except Exception as exc:
        return {
            "audit_trail": [],
            "recent_recommendations": [],
            "error": str(exc),
            "cvc_compliance_statement": "Database audit trail operating in fallback mode.",
        }


@router.post("/audit/review")
@router.post("/api/audit/review")
def submit_audit_review(
    request: AuditReviewRequest,
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """Record an official procurement officer approval/rejection of an AI recommendation."""
    try:
        decision = request.decision.upper()
        if decision not in ("APPROVED", "REJECTED", "MODIFIED"):
            raise HTTPException(status_code=400, detail="Decision must be APPROVED, REJECTED, or MODIFIED")

        # Update recommendation if ID provided
        if request.recommendation_id:
            rec = db.query(RecommendationRecord).filter(RecommendationRecord.id == request.recommendation_id).first()
            if rec:
                rec.reviewer_status = decision
                rec.reviewer_name = request.reviewer_name
                rec.reviewer_comment = request.comment
                rec.reviewed_at = datetime.utcnow()
                db.add(rec)

        # Append permanent audit log
        audit = AuditLogRecord(
            action=f"RECOMMENDATION_{decision}",
            user_id=request.reviewer_name,
            entity_id=f"REC-{request.recommendation_id or 'PROMPT'}",
            details={
                "tender_ref": request.tender_reference,
                "decision": decision,
                "comment": request.comment,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        db.add(audit)
        db.commit()

        return {
            "status": "SUCCESS",
            "decision": decision,
            "reviewer_name": request.reviewer_name,
            "recorded_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "message": f"Procurement decision {decision} logged to immutable audit trail for tender {request.tender_reference}.",
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
