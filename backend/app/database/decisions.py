"""
Pillar 3 & Pillar 2 Persistence Layer.

Provides SQLite persistence for decisions, decision_events, and map_freshness.
Compatible with SQLite and test fixture resets.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import sqlite3
import threading
from contextlib import contextmanager

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "freight_intelligence.db"

DB_PATH = os.environ.get("FREIGHT_SIH_DB_PATH", str(DEFAULT_DB_PATH))

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
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        conn.commit()


@contextmanager
def get_conn():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()


def reset_db_for_tests() -> None:
    """Used by test suites to get a clean slate."""
    try:
        with get_conn() as conn:
            conn.execute("DELETE FROM decision_events")
            try:
                conn.execute("DELETE FROM sqlite_sequence WHERE name='decision_events'")
            except sqlite3.OperationalError:
                pass
            conn.execute("DELETE FROM decisions")
            conn.execute("DELETE FROM map_freshness")
            conn.commit()
    except Exception:
        if os.path.exists(DB_PATH):
            try:
                os.remove(DB_PATH)
            except OSError:
                pass
        init_db()


def dumps(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


# Auto-initialize tables
init_db()
