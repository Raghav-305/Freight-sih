import pytest

from backend.app.database.decisions import reset_db_for_tests
from backend.app.schemas.decisions import DecisionActionRequest, DecisionCreateRequest
from backend.app.services import decisions, reports


@pytest.fixture(autouse=True)
def clean_db():
    reset_db_for_tests()
    yield


def test_report_reproduces_frozen_snapshot():
    d = decisions.create_decision(DecisionCreateRequest(
        cargo_description="Thermal coal blend, NTPC plant X",
        scenario_snapshot={"result": {"landed_cost_per_tonne": 88.2}},
        eligibility_snapshot={"status": "ELIGIBLE_WITH_CONDITION"},
        created_by="aadi", created_by_role="analyst",
    ))
    decisions.mark_analysed(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))
    submitted = decisions.submit_for_review(d["decision_id"], DecisionActionRequest(actor="aadi", role="analyst"))

    pdf_bytes_1 = reports.build_pdf(submitted)
    pdf_bytes_2 = reports.build_pdf(submitted)
    assert pdf_bytes_1[:4] == b"%PDF"
    assert pdf_bytes_2[:4] == b"%PDF"
    assert abs(len(pdf_bytes_1) - len(pdf_bytes_2)) < 50

    xlsx_bytes = reports.build_xlsx(submitted)
    assert xlsx_bytes[:2] == b"PK"


def test_report_omits_shap_when_not_computed():
    d = decisions.create_decision(DecisionCreateRequest(
        cargo_description="Test cargo",
        scenario_snapshot={}, eligibility_snapshot={},
        created_by="aadi", created_by_role="analyst",
    ))
    sections = reports._sections(d)
    shap_section = dict(sections)["5. Explanation / SHAP Drivers"]
    assert "Not computed" in shap_section
