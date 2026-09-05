from fastapi import APIRouter, HTTPException, Response

from app.models import DecisionActionRequest, DecisionCreateRequest
from app.services import audit, decisions, reports
from app.services.decisions import DecisionError

router = APIRouter(prefix="/api/decisions", tags=["pillar-3-governance"])


def _handle(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except DecisionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("")
def create(req: DecisionCreateRequest):
    return decisions.create_decision(req)


@router.get("/{decision_id}")
def get(decision_id: str):
    return _handle(decisions.get_decision, decision_id)


@router.post("/{decision_id}/analyse")
def analyse(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.mark_analysed, decision_id, action)


@router.post("/{decision_id}/submit")
def submit(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.submit_for_review, decision_id, action)


@router.post("/{decision_id}/approve")
def approve(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.approve, decision_id, action)


@router.post("/{decision_id}/return")
def return_(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.return_decision, decision_id, action)


@router.post("/{decision_id}/reject")
def reject(decision_id: str, action: DecisionActionRequest):
    return _handle(decisions.reject, decision_id, action)


@router.get("/{decision_id}/audit")
def get_audit(decision_id: str):
    return {"chain": audit.get_chain(decision_id), "verification": audit.verify_chain(decision_id)}


@router.get("/{decision_id}/report")
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
