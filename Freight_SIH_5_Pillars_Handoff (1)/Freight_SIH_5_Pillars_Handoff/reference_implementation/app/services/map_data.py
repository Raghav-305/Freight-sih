"""
Pillar 2 -- Maritime GIS static layers + freshness ledger.

Static layers (ports/corridors/chokepoints) are read straight off disk so
they work with Wi-Fi off, per the Pillar 2 Definition of Done. Every layer
response is wrapped with a `truth_class` and `freshness` block so the
frontend FreshnessBadge always has something honest to render.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "06_READY_DATA")

LAYER_FILES = {
    "ports": ("ports.geojson", "STATIC_REFERENCE"),
    "corridors": ("corridors.geojson", "STATIC_REFERENCE"),
    "chokepoints": ("chokepoints.geojson", "STATIC_REFERENCE"),
}


def _load_geojson(filename: str) -> dict:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return {"type": "FeatureCollection", "features": []}
    with open(path) as f:
        return json.load(f)


def get_layer(layer_name: str) -> dict:
    if layer_name not in LAYER_FILES:
        raise KeyError(f"UNKNOWN_LAYER:{layer_name}")
    filename, truth_class = LAYER_FILES[layer_name]
    geojson = _load_geojson(filename)
    return {
        "layer": layer_name,
        "truth_class": truth_class,
        "geojson": geojson,
        "freshness": {
            "status": "AVAILABLE_OFFLINE",
            "last_success_at": None,
            "note": "Static reference data -- always available regardless of connectivity.",
        },
    }


def freshness_summary(hazard_adapter_status: dict | None = None) -> dict:
    """
    Aggregates freshness across static layers + the (mocked) hazard adapter so
    the frontend FreshnessTicker has one endpoint to poll.
    """
    layers = {name: {"truth_class": tc, "status": "AVAILABLE_OFFLINE"} for name, (_, tc) in LAYER_FILES.items()}
    if hazard_adapter_status:
        layers["hazards"] = hazard_adapter_status
    return {"checked_at": datetime.now(timezone.utc).isoformat(), "layers": layers}
