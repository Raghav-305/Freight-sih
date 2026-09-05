"""
Pillar 4 -- Physical port/berth eligibility, delay exposure, demurrage.

Constraint priority per 04_PILLAR_4_PORT_OPERATIONS/IMPLEMENTATION_SPEC.md:
    berth-specific rule > current port notice > generic port reference

`evaluate()` never forces UNKNOWN into ELIGIBLE, and distinguishes
ELIGIBLE_WITH_CONDITION (e.g. HIGH_TIDE) from a plain pass.
"""
from __future__ import annotations

import json
import os
from typing import Optional

from app.models import DelayExposureRequest, DemurrageRequest, EligibilityRequest

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "06_READY_DATA", "port_constraints.json")


def _load_constraints() -> list[dict]:
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH) as f:
        return json.load(f)


def _select_berth_records(port_id: str, berth_id: Optional[str], commodity: Optional[str]) -> list[dict]:
    records = [r for r in _load_constraints() if r["port_id"] == port_id]
    if berth_id:
        records = [r for r in records if r["berth_id"] == berth_id]
    if commodity:
        # exact commodity match preferred; fall back to all records for the berth if none match
        matched = [r for r in records if r.get("commodity", "").lower() == commodity.lower()]
        records = matched or records
    return records


def evaluate(req: EligibilityRequest) -> dict:
    vessel = req.vessel
    checks = []
    evidence = []
    warnings = []

    required = (vessel.loa_m, vessel.beam_m, vessel.draft_m)
    if any(v is None for v in required):
        return {
            "status": "UNKNOWN",
            "reasons": ["VESSEL_DATA_MISSING"],
            "checks": [],
            "evidence": [],
            "warnings": ["One or more of loa_m/beam_m/draft_m missing on vessel; cannot evaluate."],
            "freshness": None,
        }

    records = _select_berth_records(req.port_id, req.berth_id, req.commodity or vessel.commodity)
    if not records:
        return {
            "status": "UNKNOWN",
            "reasons": ["NO_BERTH_CONSTRAINT_RECORD"],
            "checks": [],
            "evidence": [],
            "warnings": [f"No constraint record for port_id={req.port_id} (berth/commodity filter may be too narrow)."],
            "freshness": None,
        }

    # Evaluate every matching berth record; return the best outcome (most permissive)
    # but keep every berth's reasoning in `checks` for transparency.
    best_status = "INELIGIBLE"
    best_reasons: list[str] = []
    status_rank = {"INELIGIBLE": 0, "UNKNOWN": 1, "ELIGIBLE_WITH_CONDITION": 2, "ELIGIBLE": 3}

    for rec in records:
        reasons = []
        condition = False

        def _check(vessel_val, limit_key, conditional_key, code):
            nonlocal condition
            limit = rec.get(limit_key)
            if limit is None:
                return
            if vessel_val <= limit:
                return
            cond_limit = rec.get(conditional_key)
            if cond_limit is not None and vessel_val <= cond_limit:
                condition = True
                reasons.append(f"{code}_WITHIN_CONDITIONAL_LIMIT")
                return
            reasons.append(code)

        _check(vessel.loa_m, "max_loa_m", None, "LOA_EXCEEDS_LIMIT")
        _check(vessel.beam_m, "max_beam_m", None, "BEAM_EXCEEDS_LIMIT")
        _check(vessel.draft_m, "base_max_draft_m", "conditional_draft_m", "DRAFT_EXCEEDS_BASE_LIMIT")

        blocking = [r for r in reasons if not r.endswith("WITHIN_CONDITIONAL_LIMIT")]
        if blocking:
            rec_status = "INELIGIBLE"
        elif condition:
            rec_status = "ELIGIBLE_WITH_CONDITION"
        else:
            rec_status = "ELIGIBLE"

        checks.append({
            "berth_id": rec["berth_id"], "berth_name": rec.get("berth_name"),
            "status": rec_status, "reasons": reasons,
        })
        evidence.append({
            "berth_id": rec["berth_id"], "source_url": rec.get("source_url"),
            "verified_reference": rec.get("verified_reference"),
        })

        if status_rank[rec_status] > status_rank[best_status]:
            best_status, best_reasons = rec_status, reasons

    return {
        "status": best_status,
        "reasons": best_reasons,
        "checks": checks,
        "evidence": evidence,
        "warnings": warnings,
        "freshness": {"source": "STATIC_REFERENCE", "note": "Seed data -- verify against live port notice before ops."},
    }


def delay_exposure(req: DelayExposureRequest) -> dict:
    low = req.waiting_days_p10 * req.daily_charter_hire_rate_usd
    base = req.waiting_days_p50 * req.daily_charter_hire_rate_usd
    high = req.waiting_days_p90 * req.daily_charter_hire_rate_usd
    return {
        "result": {
            "delay_exposure_low_p10_usd": round(low, 2),
            "delay_exposure_base_p50_usd": round(base, 2),
            "delay_exposure_high_p90_usd": round(high, 2),
        },
        "assumptions": {"formula": "waiting_days * daily_charter_hire_rate_usd", "quantiles": "P10/P50/P90"},
        "warnings": ["This is a modelled delay-cost estimate, NOT contractual demurrage. Use /demurrage/estimate for that."],
        "model_or_formula_version": "port-ops-v1",
    }


def demurrage_estimate(req: DemurrageRequest) -> dict:
    excess_days = max(0.0, req.actual_or_forecast_port_time_days - req.allowed_laytime_days)
    amount = excess_days * req.contract_rate_usd_per_day
    return {
        "result": {
            "excess_days": round(excess_days, 3),
            "contractual_demurrage_usd": round(amount, 2),
        },
        "assumptions": {"formula": "max(0, port_time - allowed_laytime) * contract_rate"},
        "warnings": [] if req.allowed_laytime_days and req.contract_rate_usd_per_day else [
            "allowed_laytime_days or contract_rate_usd_per_day is zero -- confirm these are real contract terms, not placeholders."
        ],
        "model_or_formula_version": "port-ops-v1",
    }
