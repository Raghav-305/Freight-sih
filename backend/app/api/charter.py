from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.app.schemas.charter import (
    CharterOptimizeRequest,
    CharterOptimizeResponse,
    CharterStrategyRequest,
    CharterStrategyResponse,
)
from backend.app.database.session import get_db
from backend.app.database.models import RecommendationRecord, AuditLogRecord
from optimization.contract_optimizer import optimize_contract
from optimization.charter_strategy import get_charter_recommendation

router = APIRouter(tags=["charter"])


@router.post("/charter/optimize", response_model=CharterOptimizeResponse)
@router.post("/api/charter/optimize", response_model=CharterOptimizeResponse)
def optimize_charter_contracts(
    request: CharterOptimizeRequest,
    db: Session = Depends(get_db)
) -> CharterOptimizeResponse:
    try:
        payload = request.model_dump()
        result = optimize_contract(payload)

        # Log recommendation to database for CVC/GFR audit governance
        try:
            rec = RecommendationRecord(
                recommendation_type="charter_contract",
                inputs_json=payload,
                outputs_json=result,
                reviewer_status="PENDING_REVIEW"
            )
            db.add(rec)
            db.commit()

            audit = AuditLogRecord(
                action="CHARTER_PORTFOLIO_OPTIMIZED",
                user_id="chartering_desk",
                entity_id=f"REC-{rec.id}",
                details={"strategy": result["strategy"], "expected_saving": result["expected_saving"]}
            )
            db.add(audit)
            db.commit()
        except Exception:
            db.rollback()

        return CharterOptimizeResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/charter/strategy", response_model=CharterStrategyResponse)
@router.post("/api/charter/strategy", response_model=CharterStrategyResponse)
def charter_strategy_lp(
    request: CharterStrategyRequest,
    db: Session = Depends(get_db)
) -> CharterStrategyResponse:
    """Run exact Linear Programming (HiGHS solver) contract optimization across voyage structures."""
    try:
        payload = request.model_dump()
        result = get_charter_recommendation(**payload)

        # Log to audit trail
        try:
            rec = RecommendationRecord(
                recommendation_type="charter_strategy_lp",
                inputs_json=payload,
                outputs_json=result,
                reviewer_status="PENDING_REVIEW"
            )
            db.add(rec)
            db.commit()

            audit = AuditLogRecord(
                action="CHARTER_STRATEGY_LP_SOLVED",
                user_id="chartering_desk",
                entity_id=f"REC-{rec.id}",
                details={
                    "origin": result["origin_port"],
                    "destination": result["destination_port_name"],
                    "voyages_needed": result["voyages_needed"],
                    "expected_saving_usd": result["expected_saving_usd"]
                }
            )
            db.add(audit)
            db.commit()
        except Exception:
            db.rollback()

        return CharterStrategyResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
