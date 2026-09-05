import pytest

from backend.app.database.decisions import get_conn, reset_db_for_tests
from backend.app.services import audit


@pytest.fixture(autouse=True)
def clean_db():
    reset_db_for_tests()
    yield


def test_hash_chain_detects_tampering():
    audit.append_event("dec-1", "CREATED", "aadi", "analyst", None, {"x": 1})
    audit.append_event("dec-1", "SUBMITTED", "aadi", "analyst", None, {"x": 2})

    assert audit.verify_chain("dec-1")["valid"] is True

    # Tamper with a stored payload directly in the DB (simulating a DB-level attack).
    with get_conn() as conn:
        conn.execute("UPDATE decision_events SET payload_json=? WHERE decision_id='dec-1' AND event_id=1",
                     ('{"tampered":true}',))
        conn.commit()

    result = audit.verify_chain("dec-1")
    assert result["valid"] is False
    assert result["broken_at_event_id"] == 1


def test_chain_is_per_decision_and_links_previous_hash():
    e1 = audit.append_event("dec-2", "CREATED", "a", "r", None, {})
    e2 = audit.append_event("dec-2", "SUBMITTED", "a", "r", None, {})
    assert e2["previous_hash"] == e1["current_hash"]
