from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import shap
from scipy.special import expit  # sigmoid

MODEL_VERSION = "bid_anomaly_detection_v1"


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_artifact() -> dict[str, Any]:
    model_path = (
        project_root()
        / "ml" / "models" / "collusion_detection" / MODEL_VERSION / "model.pkl"
    )
    with open(model_path, "rb") as f:
        return pickle.load(f)


def _build_row_matrix(row: pd.Series, artifact: dict[str, Any]) -> tuple[np.ndarray, list[str]]:
    categorical = artifact["categorical_features"]
    numerical = artifact["numerical_features"]
    encoder = artifact["encoder"]

    frame = pd.DataFrame([row])
    cat = encoder.transform(frame[categorical])
    num = frame[numerical].to_numpy(dtype=float)
    X = np.hstack([cat, num])

    feature_names = list(encoder.get_feature_names_out(categorical)) + numerical
    return X, feature_names


def _readable_feature_name(name: str) -> str:
    if name.startswith("origin_"):
        return f"Origin ({name.removeprefix('origin_')})"
    if name.startswith("destination_port_"):
        return f"Destination ({name.removeprefix('destination_port_')})"
    if name.startswith("vessel_class_"):
        return f"Vessel class ({name.removeprefix('vessel_class_')})"
    if name.startswith("cargo_type_"):
        return f"Cargo type ({name.removeprefix('cargo_type_')})"
    if name.startswith("route_id_"):
        return f"Route ({name.removeprefix('route_id_')})"

    friendly = {
        "quoted_freight_usd_mt": "Quoted freight rate",
        "market_freight_usd_mt": "Market freight rate",
        "predicted_fair_value_usd_mt": "Predicted fair value",
        "fair_value_lower_usd_mt": "Fair-value band (lower)",
        "fair_value_upper_usd_mt": "Fair-value band (upper)",
        "bid_deviation_pct": "Deviation from fair value (%)",
        "bunker_price_usd_mt": "Bunker price",
        "congestion_index": "Port congestion index",
        "predicted_waiting_hours": "Predicted waiting time",
        "broker_historical_bid_count": "Broker's historical bid count",
        "broker_historical_premium_pct": "Broker's historical premium (%)",
        "vessel_historical_bid_count": "Vessel's historical bid count",
        "broker_vessel_historical_frequency": "Broker-vessel pairing frequency",
        "bid_spread_pct": "Tender's bid spread (%)",
        "fair_value_band_breach": "Outside fair-value band (flag)",
        "high_positive_deviation_flag": "High positive deviation (flag)",
        "quantity_mt": "Cargo quantity",
        "bid_rank": "Bid rank",
        "winner": "Won the tender",
        "contract_duration_days": "Contract duration",
    }
    return friendly.get(name, name.replace("_", " ").capitalize())


def explain_bid(
    bid_row: pd.Series,
    top_n: int = 5,
    artifact: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if artifact is None:
        artifact = _load_artifact()

    model = artifact["model"]
    X, feature_names = _build_row_matrix(bid_row, artifact)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)[0]  # log-odds contributions, single row
    base_value = float(explainer.expected_value)
    probability = float(model.predict_proba(X)[0, 1])

    contributions = [
        {
            "feature": feature_names[i],
            "label": _readable_feature_name(feature_names[i]),
            "log_odds_contribution": round(float(shap_values[i]), 4),
        }
        for i in range(len(feature_names))
        if abs(shap_values[i]) > 1e-6
    ]

    toward_suspicious = sorted(
        [c for c in contributions if c["log_odds_contribution"] > 0],
        key=lambda c: c["log_odds_contribution"],
        reverse=True,
    )[:top_n]
    toward_normal = sorted(
        [c for c in contributions if c["log_odds_contribution"] < 0],
        key=lambda c: c["log_odds_contribution"],
    )[:top_n]

    baseline_probability = float(expit(base_value))

    lines = [
        f"Anomaly probability: {probability*100:.1f}%  "
        f"(baseline for a typical bid: {baseline_probability*100:.1f}%)",
        "",
    ]
    if toward_suspicious:
        lines.append("Pushed toward SUSPICIOUS:")
        for c in toward_suspicious:
            lines.append(f"  {c['label']:<32} +{c['log_odds_contribution']:.2f}")
        lines.append("")
    if toward_normal:
        lines.append("Pushed toward NORMAL:")
        for c in toward_normal:
            lines.append(f"  {c['label']:<32} {c['log_odds_contribution']:.2f}")

    narrative = "\n".join(lines)

    return {
        "tender_id": bid_row.get("tender_id"),
        "broker_id": bid_row.get("broker_id"),
        "probability": round(probability, 4),
        "baseline_probability": round(baseline_probability, 4),
        "toward_suspicious": toward_suspicious,
        "toward_normal": toward_normal,
        "narrative": narrative,
    }


def main() -> None:
    root = project_root()
    data_path = root / "data" / "raw" / "collusion" / "bid_tender_records_synthetic.csv"
    data = pd.read_csv(data_path, parse_dates=["tender_date"])

    artifact = _load_artifact()

    anomalous_tender_id = data.loc[data["synthetic_anomaly_ground_truth"] == 1, "tender_id"].iloc[0]
    tender_bids = data[data["tender_id"] == anomalous_tender_id]

    flagged_row = tender_bids[tender_bids["synthetic_anomaly_ground_truth"] == 1].iloc[0]
    normal_candidates = tender_bids[tender_bids["synthetic_anomaly_ground_truth"] == 0]
    normal_row = normal_candidates.iloc[0] if len(normal_candidates) > 0 else data[data["synthetic_anomaly_ground_truth"] == 0].iloc[0]

    for label, row in [("FLAGGED BID", flagged_row), ("NORMAL BID", normal_row)]:
        print(f"\n{'='*60}\n{label}: {row['broker_id']} on {row['tender_id']}\n{'='*60}")
        result = explain_bid(row, artifact=artifact)
        print(result["narrative"])


if __name__ == "__main__":
    main()
