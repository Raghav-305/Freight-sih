"""
Pillar 3 -- Governance & Decision Workflow API routes.
"""
from fastapi import APIRouter, HTTPException, Response

from backend.app.schemas.decisions import DecisionActionRequest, DecisionCreateRequest
from backend.app.services import audit, decisions, reports
from backend.app.services.decisions import DecisionError

router = APIRouter(tags=["pillar-3-governance"])


def _handle(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except DecisionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/decisions")
@router.post("/api/decisions")
def create(req: DecisionCreateRequest):
    return decisions.create_decision(req)


@router.get("/decisions/{decision_id}")
@router.get("/api/decisions/{decision_id}")
def get(decision_id: str):
    return _handle(decisions.get_decision, decision_id)


@router.post("/decisions/{decision_id}/analyse")
@router.post("/api/decisions/{decision_id}/analyse")
def analyse(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.mark_analysed, decision_id, action)


@router.post("/decisions/{decision_id}/submit")
@router.post("/api/decisions/{decision_id}/submit")
def submit(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.submit_for_review, decision_id, action)


@router.post("/decisions/{decision_id}/approve")
@router.post("/api/decisions/{decision_id}/approve")
def approve(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.approve, decision_id, action)


@router.post("/decisions/{decision_id}/return")
@router.post("/api/decisions/{decision_id}/return")
def return_(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.return_decision, decision_id, action)


@router.post("/decisions/{decision_id}/reject")
@router.post("/api/decisions/{decision_id}/reject")
def reject(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.reject, decision_id, action)


@router.get("/decisions/{decision_id}/audit")
@router.get("/api/decisions/{decision_id}/audit")
def get_audit(decision_id: str):
    return {"chain": audit.get_chain(decision_id), "verification": audit.verify_chain(decision_id)}


@router.get("/decisions/{decision_id}/report")
@router.get("/api/decisions/{decision_id}/report")
def get_report(decision_id: str, format: str = "pdf"):
    decision = _handle(decisions.get_decision, decision_id)
    if format == "pdf":
        content = reports.build_pdf(decision)
        return Response(content=content, media_type="application/pdf",
                        headers={"Content-Disposition": f'attachment; filename="report_{decision_id}.pdf"'})
    if format == "xlsx":
        content = reports.build_xlsx(decision)
        return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        headers={"Content-Disposition": f'attachment; filename="report_{decision_id}.xlsx"'})
    raise HTTPException(status_code=400, detail="format must be pdf or xlsx")
