"""
SQLite persistence layer.

Deliberately minimal (stdlib sqlite3, no ORM) so Raghav can swap this for
Postgres later without untangling an ORM abstraction first. Every write goes
through explicit, named functions -- nothing generic/dynamic -- so the audit
trail behaviour is easy to reason about in a jury Q&A.

Pillar mapping: Pillar 3 (governance/audit) + Pillar 1 (scenario cache).
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager

DB_PATH = os.environ.get("FREIGHT_SIH_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "freight_sih.db"))

_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS decisions (
    decision_id TEXT PRIMARY KEY,
    analysis_version INTEGER NOT NULL,
    status TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL,
    role TEXT NOT NULL,
    reason TEXT,
    payload_json TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(decision_id) REFERENCES decisions(decision_id)
);

CREATE TABLE IF NOT EXISTS map_freshness (
    layer_id TEXT PRIMARY KEY,
    truth_class TEXT NOT NULL,
    last_success_at TEXT,
    last_attempt_at TEXT,
    status TEXT NOT NULL
);
"""


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        conn.commit()


@contextmanager
def get_conn():
    with _lock:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()


def reset_db_for_tests() -> None:
    """Used only by the pytest suite to get a clean slate per test module."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()


def dumps(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)
