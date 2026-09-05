#!/usr/bin/env python3
"""
validate_port_data.py

Domain-specific sanity checks on port_constraints.json, on top of the
generic structural checks in verify_data_schema.py. This script checks
things that are true of real berths, not just valid JSON:

  - a vessel that fits the base draft also fits the conditional draft
    (conditional should only ever be more permissive, never less)
  - no two berths at the same port+berth_id have contradictory limits
  - every record has a plausible LOA/beam ratio (catches typos like a
    beam value that's actually an LOA value, or vice versa)
  - flags any port_id that isn't PARADIP, since only Paradip has been
    sourced and verified in this package (see 06_READY_DATA/README.md
    equivalent note in 03_DATA_CONTRACTS.md)

Usage:
    python3 validate_port_data.py [path/to/port_constraints.json]

    Defaults to ../data_templates/port_constraints.example.json

Exit code 0 = passed, 1 = failed.
Dependencies: none beyond the Python 3 standard library.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# A real bulk/coal vessel's beam is roughly 1/6 to 1/9 of its LOA. Anything
# outside a generous 1/4 to 1/12 band is worth a human double-checking --
# it usually means a beam and LOA got swapped when the record was entered.
PLAUSIBLE_LOA_BEAM_RATIO = (4.0, 12.0)


def load(path: Path) -> list[dict]:
    if not path.exists():
        print(f"ERROR: file not found: {path}")
        sys.exit(1)
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON in {path}: {e}")
        sys.exit(1)
    if not isinstance(data, list):
        print(f"ERROR: {path} root element must be a JSON array")
        sys.exit(1)
    return data


def main() -> int:
    default_path = Path(__file__).resolve().parent.parent / "data_templates" / "port_constraints.example.json"
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_path
    records = load(path)

    errors: list[str] = []
    warnings: list[str] = []

    for rec in records:
        label = f"{rec.get('port_id')}/{rec.get('berth_id')}"

        loa = rec.get("max_loa_m")
        beam = rec.get("max_beam_m")
        if isinstance(loa, (int, float)) and isinstance(beam, (int, float)) and beam > 0:
            ratio = loa / beam
            lo, hi = PLAUSIBLE_LOA_BEAM_RATIO
            if not (lo <= ratio <= hi):
                warnings.append(
                    f"{label}: LOA/beam ratio is {ratio:.1f} (LOA={loa}, "
                    f"beam={beam}) -- outside the plausible {lo}-{hi} range "
                    f"for a bulk/coal vessel berth. Double-check against the "
                    f"source before trusting this record."
                )

        base = rec.get("base_max_draft_m")
        cond = rec.get("conditional_draft_m")
        if isinstance(base, (int, float)) and isinstance(cond, (int, float)):
            if cond < base:
                errors.append(
                    f"{label}: conditional_draft_m ({cond}) is LESS than "
                    f"base_max_draft_m ({base}) -- a conditional allowance "
                    f"(e.g. high tide) should only ever raise the limit, "
                    f"never lower it. This looks like a data-entry error."
                )

        if rec.get("port_id") != "PARADIP":
            warnings.append(
                f"{label}: port_id is not PARADIP -- confirm this record "
                f"was pulled from that port authority's own published berth "
                f"specification (see 03_DATA_CONTRACTS.md) before using it "
                f"in a demo or eligibility check."
            )

    # Same (port_id, berth_id) should never appear with two different sets
    # of limits -- that's a merge conflict, not a data update.
    by_key: dict[tuple, list[dict]] = {}
    for rec in records:
        key = (rec.get("port_id"), rec.get("berth_id"))
        by_key.setdefault(key, []).append(rec)
    for key, recs in by_key.items():
        if len(recs) > 1:
            errors.append(
                f"{key}: appears {len(recs)} times with possibly different "
                f"limits -- each (port_id, berth_id) should have exactly "
                f"one record."
            )

    print(f"Checked {len(records)} berth record(s) from {path}\n")

    if warnings:
        print(f"{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  [warn] {w}")
        print()

    if errors:
        print(f"{len(errors)} error(s):")
        for e in errors:
            print(f"  [fail] {e}")
        print("\nRESULT: FAILED")
        return 1

    print("RESULT: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
