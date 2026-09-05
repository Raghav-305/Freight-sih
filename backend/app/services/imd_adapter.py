"""
Pillar 2 -- IMD (India Meteorological Department) hazard adapter.

Implements: fetch() / normalize() / validate_timestamp() / cache() / return_with_freshness().
Ships MOCKED by default (`IMD_LIVE=0`) with honest status tagging.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

IMD_LIVE = os.environ.get("IMD_LIVE", "0") == "1"
CACHE_TTL_MINUTES = 60

_cache: dict = {"data": None, "cached_at": None}


class AdapterFailure(Exception):
    pass


def fetch() -> dict:
    """Raw fetch from the upstream source. Mocked unless IMD_LIVE=1."""
    if not IMD_LIVE:
        return {
            "raw_source": "MOCK",
            "advisories": [
                {"id": "DEMO-CYCLONE-BELT", "region": "Bay of Bengal", "severity": "ADVISORY_DEMO"}
            ],
            "issued_at": None,
        }
    raise AdapterFailure("IMD_LIVE=1 but no live implementation wired yet")


def normalize(raw: dict) -> dict:
    return {
        "source": raw.get("raw_source", "UNKNOWN"),
        "advisories": raw.get("advisories", []),
        "issued_at": raw.get("issued_at"),
    }


def validate_timestamp(normalized: dict) -> bool:
    issued_at = normalized.get("issued_at")
    if issued_at is None:
        return True
    try:
        issued = datetime.fromisoformat(issued_at)
    except ValueError:
        return False
    return datetime.now(timezone.utc) - issued < timedelta(hours=6)


def cache(normalized: dict) -> None:
    _cache["data"] = normalized
    _cache["cached_at"] = datetime.now(timezone.utc)


def return_with_freshness() -> dict:
    """
    Fetch -> normalize -> validate -> cache -> respond pipeline.
    Never returns stale data mislabelled as LIVE.
    """
    try:
        raw = fetch()
        normalized = normalize(raw)
        if not validate_timestamp(normalized):
            raise AdapterFailure("STALE_OR_INVALID_TIMESTAMP")
        cache(normalized)
        status = "DEMO_SIMULATION" if not IMD_LIVE else "OFFICIAL_PERIODIC"
        return {
            "status": status,
            "data": normalized,
            "last_success_at": _cache["cached_at"].isoformat() if _cache["cached_at"] else None,
        }
    except AdapterFailure as exc:
        if _cache["data"] is not None:
            return {
                "status": "FAILED_SHOWING_LAST_KNOWN_STALE",
                "data": _cache["data"],
                "last_success_at": _cache["cached_at"].isoformat() if _cache["cached_at"] else None,
                "error": str(exc),
            }
        return {"status": "FAILED_NO_CACHE", "data": None, "last_success_at": None, "error": str(exc)}
