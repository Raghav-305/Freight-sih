#!/usr/bin/env python3
"""
verify_data_schema.py

Validates the static reference data files (port_constraints.json,
ports.geojson, corridors.geojson, chokepoints.geojson) against the schemas
defined in 03_DATA_CONTRACTS.md. Run this before wiring backend code to
any of these files, and again after editing them.

Usage:
    python3 verify_data_schema.py [--data-dir PATH]

    --data-dir defaults to ../data_templates relative to this script
    (i.e. the copy shipped in this handoff package). Point it at your
    repo's real data folder once you've copied the files in (Phase 1
    of 00_MASTER_IMPLEMENTATION_ROADMAP.md).

Exit code 0 = all checks passed. Exit code 1 = at least one check failed
(details printed to stdout).

Dependencies: none beyond the Python 3 standard library.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ERRORS: list[str] = []
WARNINGS: list[str] = []


def fail(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def check_port_constraints(path: Path) -> None:
    if not path.exists():
        fail(f"MISSING: {path} (expected port_constraints.json)")
        return
    try:
        records = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        fail(f"{path}: invalid JSON ({e})")
        return

    if not isinstance(records, list):
        fail(f"{path}: root element must be a JSON array")
        return

    required_fields = {
        "port_id": str, "berth_id": str, "berth_name": str, "commodity": str,
        "max_loa_m": (int, float), "max_beam_m": (int, float),
        "base_max_draft_m": (int, float), "source_url": str,
        "verified_reference": str,
    }
    seen_keys = set()

    for i, rec in enumerate(records):
        label = f"{path.name}[{i}]"
        if not isinstance(rec, dict):
            fail(f"{label}: record is not an object")
            continue

        for field, expected_type in required_fields.items():
            if field not in rec:
                fail(f"{label}: missing required field '{field}'")
                continue
            if not isinstance(rec[field], expected_type):
                fail(f"{label}: field '{field}' has wrong type "
                     f"(got {type(rec[field]).__name__})")

        for numeric_field in ("max_loa_m", "max_beam_m", "base_max_draft_m"):
            val = rec.get(numeric_field)
            if isinstance(val, (int, float)) and val <= 0:
                fail(f"{label}: '{numeric_field}' must be > 0, got {val}")

        cond_draft = rec.get("conditional_draft_m")
        base_draft = rec.get("base_max_draft_m")
        if cond_draft is not None:
            if not isinstance(cond_draft, (int, float)):
                fail(f"{label}: 'conditional_draft_m' must be numeric or null")
            elif isinstance(base_draft, (int, float)) and cond_draft < base_draft:
                fail(f"{label}: 'conditional_draft_m' ({cond_draft}) must be "
                     f">= 'base_max_draft_m' ({base_draft})")
            if not rec.get("condition_type"):
                fail(f"{label}: 'conditional_draft_m' is set but "
                     f"'condition_type' is missing")

        if not str(rec.get("source_url", "")).startswith("http"):
            fail(f"{label}: 'source_url' does not look like a real URL")

        key = (rec.get("port_id"), rec.get("berth_id"))
        if key in seen_keys:
            fail(f"{label}: duplicate (port_id, berth_id) = {key}")
        seen_keys.add(key)

    port_ids = {r.get("port_id") for r in records if isinstance(r, dict)}
    if port_ids - {"PARADIP"}:
        warn(f"{path.name}: contains port_id(s) other than PARADIP "
             f"({sorted(port_ids - {'PARADIP'})}) -- confirm each one was "
             f"sourced from that port authority's own published berth "
             f"specification before trusting it in a demo.")

    print(f"[ok] {path.name}: {len(records)} berth record(s) checked")


# Each static layer file uses its own discriminator property name, matching
# what's actually shipped in data_templates/geojson/ -- see
# 03_DATA_CONTRACTS.md section 2 for the reasoning. Don't force a single
# generic "type" field where the real files don't have one.
LAYER_DISCRIMINATOR_FIELD = {
    "ports": "role",
    "corridors": "type",
    "chokepoints": "category",
}


def check_geojson(path: Path, layer: str) -> None:
    if not path.exists():
        fail(f"MISSING: {path}")
        return
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        fail(f"{path}: invalid JSON ({e})")
        return

    if data.get("type") != "FeatureCollection":
        fail(f"{path.name}: root 'type' must be 'FeatureCollection'")
        return

    features = data.get("features", [])
    if not features:
        warn(f"{path.name}: FeatureCollection has zero features")

    discriminator = LAYER_DISCRIMINATOR_FIELD.get(layer, "type")

    for i, feat in enumerate(features):
        label = f"{path.name}.features[{i}]"
        props = feat.get("properties", {})
        if "name" not in props:
            fail(f"{label}: properties.name missing")
        if discriminator not in props:
            fail(f"{label}: properties.{discriminator} missing "
                 f"(this layer's discriminator field, see 03_DATA_CONTRACTS.md)")
        geom = feat.get("geometry", {})
        if "type" not in geom or "coordinates" not in geom:
            fail(f"{label}: geometry missing type/coordinates")

    # truth_class is not present in the shipped files (see contract note) --
    # this is a reminder for the frontend/backend layer, not a per-feature
    # requirement, so it's a one-line note rather than a per-feature warning.
    print(f"[ok] {path.name}: {len(features)} feature(s) checked "
          f"(remember: serve this layer tagged truth_class=STATIC_REFERENCE "
          f"in the API response, per 03_DATA_CONTRACTS.md -- the raw file "
          f"itself does not carry that tag)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_dir = Path(__file__).resolve().parent.parent / "data_templates"
    parser.add_argument("--data-dir", type=Path, default=default_dir,
                         help="Folder containing port_constraints.json and "
                              "geojson/*.geojson (default: %(default)s)")
    args = parser.parse_args()

    data_dir: Path = args.data_dir
    print(f"Checking data in: {data_dir}\n")

    port_constraints = data_dir / "port_constraints.example.json"
    if not port_constraints.exists():
        port_constraints = data_dir / "port_constraints.json"
    check_port_constraints(port_constraints)

    geo_dir = data_dir / "geojson"
    if not geo_dir.exists():
        geo_dir = data_dir
    check_geojson(geo_dir / "ports.geojson", "ports")
    check_geojson(geo_dir / "corridors.geojson", "corridors")
    check_geojson(geo_dir / "chokepoints.geojson", "chokepoints")

    print()
    if WARNINGS:
        print(f"{len(WARNINGS)} warning(s):")
        for w in WARNINGS:
            print(f"  [warn] {w}")
        print()

    if ERRORS:
        print(f"{len(ERRORS)} error(s):")
        for e in ERRORS:
            print(f"  [fail] {e}")
        print("\nRESULT: FAILED")
        return 1

    print("RESULT: ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
