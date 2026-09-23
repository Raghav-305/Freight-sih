from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

MODEL_VERSION = "bid_anomaly_detection_v1"
DEFAULT_THRESHOLD = 0.5


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_artifact() -> dict[str, Any]:
    model_path = (
        project_root()
        / "ml" / "models" / "collusion_detection" / MODEL_VERSION / "model.pkl"
    )
    with open(model_path, "rb") as f:
        return pickle.load(f)


def _build_matrix(row: pd.Series, artifact: dict[str, Any]) -> np.ndarray:
    categorical = artifact["categorical_features"]
    numerical = artifact["numerical_features"]
    encoder = artifact["encoder"]

    frame = pd.DataFrame([row])
    cat = encoder.transform(frame[categorical])
    num = frame[numerical].to_numpy(dtype=float)
    return np.hstack([cat, num])


def score_bid(
    bid: dict[str, Any] | pd.Series,
    threshold: float = DEFAULT_THRESHOLD,
    artifact: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if artifact is None:
        artifact = _load_artifact()

    row = pd.Series(bid) if isinstance(bid, dict) else bid
    X = _build_matrix(row, artifact)

    model = artifact["model"]
    probability = float(model.predict_proba(X)[0, 1])
    flagged = probability >= threshold

    return {
        "tender_id": row.get("tender_id"),
        "broker_id": row.get("broker_id"),
        "anomaly_probability": round(probability, 4),
        "flagged": bool(flagged),
        "threshold_used": threshold,
        "model_version": MODEL_VERSION,
    }


def score_tender(
    tender_bids: pd.DataFrame,
    threshold: float = DEFAULT_THRESHOLD,
    artifact: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    if artifact is None:
        artifact = _load_artifact()
    return [
        score_bid(row, threshold=threshold, artifact=artifact)
        for _, row in tender_bids.iterrows()
    ]


def _demo_lookup(tender_id: str, data: pd.DataFrame) -> pd.DataFrame:
    return data[data["tender_id"] == tender_id].copy()


def main() -> None:
    root = project_root()
    data_path = root / "data" / "raw" / "collusion" / "bid_tender_records_synthetic.csv"
    data = pd.read_csv(data_path, parse_dates=["tender_date"])

    artifact = _load_artifact()

    anomalous_tender_id = data.loc[data["synthetic_anomaly_ground_truth"] == 1, "tender_id"].iloc[0]
    normal_tender_id = data.loc[data["synthetic_anomaly_ground_truth"] == 0, "tender_id"].iloc[0]

    for label, tender_id in [("KNOWN ANOMALOUS", anomalous_tender_id), ("NORMAL", normal_tender_id)]:
        print(f"\n{'='*60}\n{label} TENDER: {tender_id}\n{'='*60}")
        tender_bids = _demo_lookup(tender_id, data)
        results = score_tender(tender_bids, artifact=artifact)
        for r in results:
            flag_str = "FLAGGED" if r["flagged"] else "normal"
            print(f"  {r['broker_id']:<14} probability={r['anomaly_probability']:.4f}  [{flag_str}]")


if __name__ == "__main__":
    main()