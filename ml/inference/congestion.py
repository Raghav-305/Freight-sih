from __future__ import annotations


def predict_congestion(payload: dict) -> dict:
    return {
        "port": payload.get("port", "unknown"),
        "expected_wait_days": 1.2,
        "p90_wait_days": 2.8,
        "model_version": "placeholder_congestion_v0",
    }
