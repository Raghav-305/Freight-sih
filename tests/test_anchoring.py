"""Tests for the OPTIONAL Polygon Amoy anchoring. No network is used anywhere."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.anchoring import router
from backend.app.database.decisions import get_conn, reset_db_for_tests
from backend.app.services import anchoring, audit

KEY = "0x" + "11" * 32


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    reset_db_for_tests()
    anchoring._ensure_schema()
    with get_conn() as conn:
        conn.execute("DELETE FROM audit_anchors")
        conn.commit()
    monkeypatch.delenv("AMOY_PRIVATE_KEY", raising=False)
    yield


def _events(n, decision="d1"):
    for i in range(n):
        audit.append_event(decision, f"E{i}", "a", "r", None, {"i": i})


def _fake_ok(root):
    return {"tx_hash": "0x" + "ab" * 32, "block_number": 123, "confirmed": True}


def test_merkle_root_is_deterministic_and_order_sensitive():
    a, b, c = ("aa" * 32, "bb" * 32, "cc" * 32)
    assert anchoring.merkle_root([]) is None
    assert anchoring.merkle_root([a, b, c]) == anchoring.merkle_root([a, b, c])
    assert anchoring.merkle_root([a, b, c]) != anchoring.merkle_root([b, a, c])
    assert anchoring.merkle_root([a]) != anchoring.merkle_root([b])
    assert len(anchoring.merkle_root([a, b, c])) == 64


def test_not_configured_without_key():
    _events(2)
    res = anchoring.anchor_now(sender=_fake_ok)
    assert res["status"] == "NOT_CONFIGURED"
    assert anchoring.count_unanchored() == 2


def test_nothing_to_anchor_when_empty(monkeypatch):
    monkeypatch.setenv("AMOY_PRIVATE_KEY", KEY)
    assert anchoring.anchor_now(sender=_fake_ok)["status"] == "NOTHING_TO_ANCHOR"


def test_anchor_covers_batch_then_only_new_events(monkeypatch):
    monkeypatch.setenv("AMOY_PRIVATE_KEY", KEY)
    _events(3, "d1")
    _events(2, "d2")  # chains are per decision; anchor spans all of them
    first = anchoring.anchor_now(sender=_fake_ok)
    assert first["status"] == "ANCHORED"
    assert first["anchor"]["event_count"] == 5
    assert first["anchor"]["explorer_url"].startswith("https://amoy.polygonscan.com/tx/0x")
    assert anchoring.count_unanchored() == 0

    assert anchoring.anchor_now(sender=_fake_ok)["status"] == "NOTHING_TO_ANCHOR"

    _events(2, "d3")
    second = anchoring.anchor_now(sender=_fake_ok)
    assert second["anchor"]["first_event_id"] == first["anchor"]["last_event_id"] + 1
    assert second["anchor"]["event_count"] == 2


def test_offline_is_visible_and_events_stay_unanchored(monkeypatch):
    monkeypatch.setenv("AMOY_PRIVATE_KEY", KEY)
    _events(2)

    def offline(_root):
        raise anchoring.AnchorOffline("no internet")

    res = anchoring.anchor_now(sender=offline)
    assert res["status"] == "OFFLINE"
    assert res["unanchored_events"] == 2
    st = anchoring.get_status()
    assert st["state"] == "NOT_ANCHORED"
    assert st["last_attempt"]["status"] == "OFFLINE"
    # after internet returns, the same events are anchored
    assert anchoring.anchor_now(sender=_fake_ok)["status"] == "ANCHORED"
    assert anchoring.get_status()["last_attempt"] is None


def test_unexpected_error_never_raises_and_hides_key(monkeypatch):
    monkeypatch.setenv("AMOY_PRIVATE_KEY", KEY)
    _events(1)

    def boom(_root):
        raise RuntimeError(f"bad thing with {KEY}")

    res = anchoring.anchor_now(sender=boom)
    assert res["status"] == "FAILED"
    assert KEY not in res["message"]
    assert KEY not in (res["anchor"]["error"] or "")


def test_pending_when_receipt_not_yet_available(monkeypatch):
    monkeypatch.setenv("AMOY_PRIVATE_KEY", KEY)
    _events(1)
    res = anchoring.anchor_now(sender=lambda r: {"tx_hash": "0x" + "cd" * 32, "block_number": None, "confirmed": False})
    assert res["status"] == "PENDING"
    assert anchoring.count_unanchored() == 0


def test_verify_detects_tampering_after_anchor(monkeypatch):
    monkeypatch.setenv("AMOY_PRIVATE_KEY", KEY)
    _events(3)
    anchor = anchoring.anchor_now(sender=_fake_ok)["anchor"]
    assert anchoring.verify_anchor(anchor["anchor_id"])["local_match"] is True
    with get_conn() as conn:
        conn.execute("UPDATE decision_events SET current_hash=? WHERE event_id=2", ("ff" * 32,))
        conn.commit()
    assert anchoring.verify_anchor(anchor["anchor_id"])["local_match"] is False


def test_status_endpoint_works_offline_and_states_scope():
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    body = client.get("/api/audit/anchor-status").json()
    assert body["optional_feature"] is True and body["requires_internet"] is True
    assert "decision_events" in body["scope_note"] and "AuditLogRecord" in body["scope_note"]
    assert client.post("/audit/anchor").json()["status"] == "NOT_CONFIGURED"
    assert client.get("/audit/anchor/999/verify").status_code == 404
