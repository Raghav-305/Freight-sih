"""
OPTIONAL external anchoring of the audit hash chain (Polygon Amoy testnet).

SCOPE -- read this first
------------------------
Anchoring covers ONLY the hash-chained ``decision_events`` table (Pillar 3
decision workflow, see services/audit.py). It does NOT cover the legacy
``AuditLogRecord`` table behind /audit/logs and /audit/review, which is not
hash-chained.

Design
------
* Batch  = every decision_events row with event_id greater than the last
           successfully anchored event_id (ordered by event_id).
* Leaves = each row's existing ``current_hash`` (already binds its predecessor).
* Root   = SHA-256 Merkle root over the leaves.
* Chain  = one 0-value transaction to the wallet itself, ``data`` = 32-byte root.
           No smart contract needed; the root is visible in "Input Data" on the
           block explorer.
* Local  = result stored in the ``audit_anchors`` table (same SQLite file).

Safety rules
------------
* Nothing in the core system imports this module. Forecasting, recommendations
  and ``audit.append_event`` never depend on it or on internet access.
* ``web3`` is imported lazily, so the backend boots without it installed.
* The SQLite connection helper holds a global lock while open, so network I/O
  is NEVER done inside ``with get_conn()``.
* The private key comes only from the AMOY_PRIVATE_KEY environment variable and
  is never returned by the API or written to logs / the database.
"""
from __future__ import annotations

import hashlib
import importlib.util
import os
import threading
from datetime import datetime, timezone
from typing import Any, Callable

from backend.app.database.decisions import get_conn

try:  # python-dotenv is already a backend dependency; .env stays optional
    from dotenv import load_dotenv

    load_dotenv(override=False)
except Exception:  # pragma: no cover
    pass

NETWORK_NAME = "Polygon Amoy Testnet"
CHAIN_ID = 80002  # hard-coded on purpose: refuse to send on any other chain
EXPLORER_TX_URL = "https://amoy.polygonscan.com/tx/{tx_hash}"
DEFAULT_RPC_URL = "https://rpc-amoy.polygon.technology"

SCOPE_NOTE = (
    "Anchoring covers ONLY the hash-chained decision_events (Pillar 3 decision "
    "timeline). It does NOT cover the legacy AuditLogRecord table shown as "
    "'Immutable Audit Trail' (/audit/logs), which is not hash-chained."
)

MAX_BATCH = 1000
RPC_TIMEOUT_S = 8
RECEIPT_TIMEOUT_S = 40

# Status values stored in audit_anchors.status
CONFIRMED, PENDING = "CONFIRMED", "PENDING"
FAILED, OFFLINE = "FAILED", "OFFLINE"
_COUNTED = (CONFIRMED, PENDING)  # statuses that "use up" a batch of events

SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_anchors (
    anchor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    merkle_root TEXT NOT NULL,
    first_event_id INTEGER NOT NULL,
    last_event_id INTEGER NOT NULL,
    event_count INTEGER NOT NULL,
    tx_hash TEXT,
    network TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    block_number INTEGER,
    status TEXT NOT NULL,
    error TEXT,
    created_at TEXT NOT NULL
);
"""

_anchor_lock = threading.Lock()


class AnchorOffline(Exception):
    """RPC endpoint unreachable (no internet, DNS failure, timeout...)."""


class AnchorNotConfigured(Exception):
    """Missing private key or web3 library."""


# --------------------------------------------------------------------------
# Merkle tree
# --------------------------------------------------------------------------
def _leaf(hex_hash: str) -> bytes:
    return hashlib.sha256(b"\x00" + bytes.fromhex(hex_hash)).digest()


def _node(left: bytes, right: bytes) -> bytes:
    return hashlib.sha256(b"\x01" + left + right).digest()


def merkle_root(hex_hashes: list[str]) -> str | None:
    """SHA-256 Merkle root (hex). Odd node is promoted, not duplicated."""
    if not hex_hashes:
        return None
    level = [_leaf(h) for h in hex_hashes]
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            nxt.append(_node(level[i], level[i + 1]) if i + 1 < len(level) else level[i])
        level = nxt
    return level[0].hex()


# --------------------------------------------------------------------------
# Local storage helpers (each call opens/closes its own short connection)
# --------------------------------------------------------------------------
def _ensure_schema() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        conn.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _last_anchored_event_id() -> int:
    _ensure_schema()
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COALESCE(MAX(last_event_id), 0) AS m FROM audit_anchors WHERE status IN (?,?)",
            _COUNTED,
        ).fetchone()
        return int(row["m"])


def count_unanchored() -> int:
    last = _last_anchored_event_id()
    with get_conn() as conn:
        row = conn.execute("SELECT COUNT(*) AS c FROM decision_events WHERE event_id > ?", (last,)).fetchone()
        return int(row["c"])


def _next_batch() -> list[dict]:
    last = _last_anchored_event_id()
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT event_id, current_hash FROM decision_events WHERE event_id > ? ORDER BY event_id ASC LIMIT ?",
            (last, MAX_BATCH),
        ).fetchall()
        return [dict(r) for r in rows]


def _insert_anchor(root: str, first_id: int, last_id: int, count: int, status: str,
                   tx_hash: str | None = None, block_number: int | None = None,
                   error: str | None = None) -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO audit_anchors
               (merkle_root, first_event_id, last_event_id, event_count, tx_hash, network,
                chain_id, block_number, status, error, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (root, first_id, last_id, count, tx_hash, NETWORK_NAME, CHAIN_ID,
             block_number, status, error, _now()),
        )
        conn.commit()
        anchor_id = cur.lastrowid
    return get_anchor(anchor_id)  # type: ignore[return-value]


def _public(row: dict) -> dict:
    d = dict(row)
    d["explorer_url"] = EXPLORER_TX_URL.format(tx_hash=d["tx_hash"]) if d.get("tx_hash") else None
    return d


def get_anchor(anchor_id: int) -> dict | None:
    _ensure_schema()
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM audit_anchors WHERE anchor_id=?", (anchor_id,)).fetchone()
        return _public(row) if row else None


def _latest(statuses: tuple[str, ...] | None) -> dict | None:
    _ensure_schema()
    with get_conn() as conn:
        if statuses:
            q = f"SELECT * FROM audit_anchors WHERE status IN ({','.join('?' * len(statuses))}) ORDER BY anchor_id DESC LIMIT 1"
            row = conn.execute(q, statuses).fetchone()
        else:
            row = conn.execute("SELECT * FROM audit_anchors ORDER BY anchor_id DESC LIMIT 1").fetchone()
        return _public(row) if row else None


# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
def _private_key() -> str | None:
    key = (os.environ.get("AMOY_PRIVATE_KEY") or "").strip()
    return key or None


def _rpc_url() -> str:
    return (os.environ.get("AMOY_RPC_URL") or DEFAULT_RPC_URL).strip()


def _web3_installed() -> bool:
    return importlib.util.find_spec("web3") is not None


def _scrub(text: str) -> str:
    """Make sure the private key can never leak through an error message."""
    key = _private_key()
    if key:
        text = text.replace(key, "***").replace(key.removeprefix("0x"), "***")
    return text[:400]


# --------------------------------------------------------------------------
# The only function that touches the network
# --------------------------------------------------------------------------
def _send_anchor_tx(root_hex: str) -> dict:
    """Send 0-value self-tx with the root as data. Returns tx_hash/block/confirmed."""
    key = _private_key()
    if not key:
        raise AnchorNotConfigured("AMOY_PRIVATE_KEY is not set.")
    if not _web3_installed():
        raise AnchorNotConfigured("web3 is not installed (pip install web3).")

    from web3 import Web3  # lazy import
    from web3.exceptions import TimeExhausted

    w3 = Web3(Web3.HTTPProvider(_rpc_url(), request_kwargs={"timeout": RPC_TIMEOUT_S}))
    try:
        connected = w3.is_connected()
    except Exception as exc:  # pragma: no cover
        raise AnchorOffline(str(exc)) from exc
    if not connected:
        raise AnchorOffline("Cannot reach the Amoy RPC endpoint (no internet or RPC down).")

    try:
        if w3.eth.chain_id != CHAIN_ID:
            raise RuntimeError(f"RPC is on chain {w3.eth.chain_id}, expected Amoy {CHAIN_ID}. Refusing to send.")

        acct = w3.eth.account.from_key(key)
        latest = w3.eth.get_block("latest")
        base_fee = latest.get("baseFeePerGas", w3.to_wei(30, "gwei"))
        try:
            tip = max(int(w3.eth.max_priority_fee), w3.to_wei(30, "gwei"))  # Amoy enforces a ~25 gwei min tip
        except Exception:
            tip = w3.to_wei(30, "gwei")
        max_fee = int(base_fee) * 2 + tip
        gas = 30000  # 21000 base + 32 data bytes; unused gas is not charged

        balance = w3.eth.get_balance(acct.address)
        if balance < gas * max_fee:
            raise RuntimeError(
                f"Test wallet {acct.address} has too little POL. Fund it from the Amoy faucet and retry."
            )

        tx = {
            "chainId": CHAIN_ID,
            "nonce": w3.eth.get_transaction_count(acct.address, "pending"),
            "to": acct.address,
            "value": 0,
            "data": "0x" + root_hex,
            "gas": gas,
            "maxFeePerGas": max_fee,
            "maxPriorityFeePerGas": tip,
            "type": 2,
        }
        signed = acct.sign_transaction(tx)
        raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction")
        tx_hash = w3.eth.send_raw_transaction(raw).hex()
        if not tx_hash.startswith("0x"):
            tx_hash = "0x" + tx_hash
    except AnchorOffline:
        raise
    except Exception as exc:
        if _looks_offline(exc):
            raise AnchorOffline(str(exc)) from exc
        raise

    try:
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=RECEIPT_TIMEOUT_S, poll_latency=2)
    except TimeExhausted:
        return {"tx_hash": tx_hash, "block_number": None, "confirmed": False}
    except Exception as exc:
        if _looks_offline(exc):
            return {"tx_hash": tx_hash, "block_number": None, "confirmed": False}
        raise
    if receipt["status"] != 1:
        raise RuntimeError(f"Transaction {tx_hash} reverted on-chain.")
    return {"tx_hash": tx_hash, "block_number": int(receipt["blockNumber"]), "confirmed": True}


def _looks_offline(exc: Exception) -> bool:
    name = type(exc).__name__.lower()
    text = str(exc).lower()
    return any(s in name or s in text for s in (
        "connection", "timeout", "timed out", "name resolution", "network is unreachable",
        "max retries", "temporary failure", "nodename nor servname",
    ))


# --------------------------------------------------------------------------
# Public API used by the router
# --------------------------------------------------------------------------
def anchor_now(sender: Callable[[str], dict] | None = None) -> dict[str, Any]:
    """Anchor the next batch. Never raises; always returns a status dict."""
    send = sender or _send_anchor_tx

    if not _anchor_lock.acquire(blocking=False):
        return _result("BUSY", "Another anchoring run is already in progress.")
    try:
        if _private_key() is None:
            return _result("NOT_CONFIGURED", "AMOY_PRIVATE_KEY is not set. Anchoring is optional and currently disabled.")

        batch = _next_batch()
        if not batch:
            return _result("NOTHING_TO_ANCHOR", "No new audit events since the last anchor.")

        root = merkle_root([b["current_hash"] for b in batch])
        first_id, last_id = batch[0]["event_id"], batch[-1]["event_id"]
        try:
            sent = send(root)  # network I/O happens here, no DB connection open
        except AnchorNotConfigured as exc:
            return _result("NOT_CONFIGURED", str(exc))
        except AnchorOffline as exc:
            row = _insert_anchor(root, first_id, last_id, len(batch), OFFLINE, error=_scrub(str(exc)))
            return _result("OFFLINE", "Not anchored - offline / RPC unreachable. Core system is unaffected.", row)
        except Exception as exc:  # noqa: BLE001 - must never crash the API
            row = _insert_anchor(root, first_id, last_id, len(batch), FAILED, error=_scrub(str(exc)))
            return _result("FAILED", _scrub(str(exc)), row)

        status = CONFIRMED if sent.get("confirmed") else PENDING
        row = _insert_anchor(root, first_id, last_id, len(batch), status,
                             tx_hash=sent["tx_hash"], block_number=sent.get("block_number"))
        msg = "Anchored on Polygon Amoy." if status == CONFIRMED else \
            "Transaction sent but not yet confirmed. Check the explorer link shortly."
        return _result("ANCHORED" if status == CONFIRMED else "PENDING", msg, row)
    finally:
        _anchor_lock.release()


def _result(status: str, message: str, anchor: dict | None = None) -> dict[str, Any]:
    return {"status": status, "message": message, "anchor": anchor, "unanchored_events": _safe_count()}


def _safe_count() -> int | None:
    try:
        return count_unanchored()
    except Exception:  # pragma: no cover
        return None


def get_status() -> dict[str, Any]:
    """Local-DB-only status. Works fully offline."""
    latest_ok = _latest(_COUNTED)
    last_attempt = _latest(None)
    attempt_failed_after = bool(
        last_attempt and last_attempt["status"] in (OFFLINE, FAILED)
        and (latest_ok is None or last_attempt["anchor_id"] > latest_ok["anchor_id"])
    )
    return {
        "optional_feature": True,
        "requires_internet": True,
        "network": NETWORK_NAME,
        "chain_id": CHAIN_ID,
        "state": "ANCHORED" if latest_ok else "NOT_ANCHORED",
        "configured": _private_key() is not None,
        "web3_installed": _web3_installed(),
        "unanchored_events": count_unanchored(),
        "latest_anchor": latest_ok,
        "last_attempt": last_attempt if attempt_failed_after else None,
        "scope_note": SCOPE_NOTE,
    }


def verify_anchor(anchor_id: int, onchain: bool = False) -> dict[str, Any] | None:
    """Recompute the root from local events and compare (offline). Optionally check the chain too."""
    anchor = get_anchor(anchor_id)
    if anchor is None:
        return None
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT current_hash FROM decision_events WHERE event_id BETWEEN ? AND ? ORDER BY event_id ASC",
            (anchor["first_event_id"], anchor["last_event_id"]),
        ).fetchall()
    recomputed = merkle_root([r["current_hash"] for r in rows])
    out: dict[str, Any] = {
        "anchor_id": anchor_id,
        "stored_root": anchor["merkle_root"],
        "recomputed_root": recomputed,
        "events_found": len(rows),
        "events_expected": anchor["event_count"],
        "local_match": recomputed == anchor["merkle_root"] and len(rows) == anchor["event_count"],
        "scope_note": SCOPE_NOTE,
    }
    if onchain:
        out["onchain"] = _verify_onchain(anchor)
    return out


def _verify_onchain(anchor: dict) -> dict[str, Any]:
    if not anchor.get("tx_hash"):
        return {"checked": False, "error": "No transaction hash stored for this anchor."}
    if not _web3_installed():
        return {"checked": False, "error": "web3 is not installed."}
    try:
        from web3 import Web3

        w3 = Web3(Web3.HTTPProvider(_rpc_url(), request_kwargs={"timeout": RPC_TIMEOUT_S}))
        tx = w3.eth.get_transaction(anchor["tx_hash"])
        data = tx["input"].hex() if hasattr(tx["input"], "hex") else str(tx["input"])
        data = data.removeprefix("0x")
        return {"checked": True, "onchain_data": data, "matches": data == anchor["merkle_root"]}
    except Exception as exc:  # noqa: BLE001
        return {"checked": False, "error": _scrub(f"Offline or RPC error: {exc}")}


# --------------------------------------------------------------------------
# Optional periodic anchoring (off unless ANCHOR_INTERVAL_MINUTES > 0)
# --------------------------------------------------------------------------
_scheduler_started = False


def start_scheduler_if_enabled() -> bool:
    global _scheduler_started
    try:
        minutes = float(os.environ.get("ANCHOR_INTERVAL_MINUTES", "0") or 0)
    except ValueError:
        minutes = 0
    if minutes <= 0 or _scheduler_started or _private_key() is None:
        return False
    _scheduler_started = True

    def loop() -> None:
        import time

        while True:
            time.sleep(minutes * 60)
            try:
                anchor_now()
            except Exception:  # pragma: no cover - the loop must never die
                pass

    threading.Thread(target=loop, name="audit-anchor-scheduler", daemon=True).start()
    return True
