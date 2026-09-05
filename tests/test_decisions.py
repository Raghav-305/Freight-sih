import pytest

from backend.app.database.decisions import reset_db_for_tests
from backend.app.schemas.decisions import DecisionActionRequest, DecisionCreateRequest
from backend.app.services import decisions
from backend.app.services.decisions import DecisionError


@pytest.fixture(autouse=True)
def clean_db():
    reset_db_for_tests()
    yield


def _create():
    return decisions.create_decision(DecisionCreateRequest(
        cargo_description="Coking coal, 60kt, Paradip",
        scenario_snapshot={"result": {"landed_cost_per_tonne": 100}},
        eligibility_snapshot={"status": "ELIGIBLE"},
        created_by="aadi",
        created_by_role="analyst",
    ))


def test_submitted_snapshot_is_immutable():
    d = _create()
    decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    submitted = decisions.submit_for_review(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    frozen_hash = submitted["input_hash"]

    # Illegal to jump straight back to ANALYSED without going through RETURNED.
    with pytest.raises(DecisionError):
        decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))

    reread = decisions.get_decision(d["decision_id"])
    assert reread["input_hash"] == frozen_hash


def test_self_approval_blocked():
    d = _create()
    decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    decisions.submit_for_review(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    with pytest.raises(DecisionError):
        decisions.approve(d["decision_id"], DecisionActionRequest(actor="aadi", role="approver"))
    # A different, authorized approver succeeds.
    approved = decisions.approve(d["decision_id"], DecisionActionRequest(actor="zach", role="approver"))
    assert approved["status"] == "APPROVED"


def test_rejection_requires_reason():
    d = _create()
    decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    decisions.submit_for_review(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    with pytest.raises(DecisionError):
        decisions.reject(d["decision_id"], DecisionActionRequest(actor="zach", role="approver", reason=None))
    rejected = decisions.reject(d["decision_id"], DecisionActionRequest(actor="zach", role="approver", reason="Route risk too high"))
    assert rejected["status"] == "REJECTED"


def test_returned_preserves_prior_evidence_and_bumps_version():
    d = _create()
    decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    decisions.submit_for_review(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    returned = decisions.return_decision(d["decision_id"], DecisionActionRequest(actor="zach", role="approver", reason="Need updated GCV"))
    assert returned["status"] == "RETURNED"
    reanalysed = decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    assert reanalysed["analysis_version"] == 2
