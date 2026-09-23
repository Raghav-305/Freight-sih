from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)

MODEL_VERSION = "bid_anomaly_detection_v1"
TARGET = "synthetic_anomaly_ground_truth"


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_artifact() -> dict[str, Any]:
    model_path = (
        project_root()
        / "ml" / "models" / "collusion_detection" / MODEL_VERSION / "model.pkl"
    )
    with open(model_path, "rb") as f:
        return pickle.load(f)


def _load_metadata() -> dict[str, Any]:
    metadata_path = (
        project_root()
        / "ml" / "models" / "collusion_detection" / MODEL_VERSION / "metadata.json"
    )
    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _build_matrix(df: pd.DataFrame, artifact: dict[str, Any]) -> np.ndarray:
    categorical = artifact["categorical_features"]
    numerical = artifact["numerical_features"]
    encoder = artifact["encoder"]
    cat = encoder.transform(df[categorical])
    num = df[numerical].to_numpy(dtype=float)
    return np.hstack([cat, num])


def _grouped_stratified_split(bids: pd.DataFrame, test_size: float = 0.2, random_state: int = 42):
    tender_labels = bids.groupby("tender_id")[TARGET].max()
    tender_ids = tender_labels.index.to_numpy()
    tender_y = tender_labels.to_numpy()

    anomalous_tenders = tender_ids[tender_y == 1]
    normal_tenders = tender_ids[tender_y == 0]

    rng = np.random.default_rng(random_state)
    rng.shuffle(anomalous_tenders)
    rng.shuffle(normal_tenders)

    n_test_anom = max(1, int(len(anomalous_tenders) * test_size))
    n_test_norm = int(len(normal_tenders) * test_size)

    test_tenders = set(anomalous_tenders[:n_test_anom]) | set(normal_tenders[:n_test_norm])
    train_tenders = set(tender_ids) - test_tenders

    train = bids[bids["tender_id"].isin(train_tenders)].copy()
    test = bids[bids["tender_id"].isin(test_tenders)].copy()
    return train, test


def _classification_scores(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> dict[str, float]:
    return {
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_true, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_proba)), 4),
        "pr_auc": round(float(average_precision_score(y_true, y_proba)), 4),
        "flagged_count": int(y_pred.sum()),
        "n_rows": int(len(y_true)),
        "n_positive": int(y_true.sum()),
    }


def compute_bid_anomaly_performance() -> dict[str, Any]:
    root = project_root()
    data_path = root / "data" / "raw" / "collusion" / "bid_tender_records_synthetic.csv"
    output_dir = root / "ml" / "evaluation"
    output_dir.mkdir(parents=True, exist_ok=True)

    artifact = _load_artifact()
    metadata = _load_metadata()
    model = artifact["model"]

    bids = pd.read_csv(data_path, parse_dates=["tender_date"])
    train, test = _grouped_stratified_split(bids)

    X_train = _build_matrix(train, artifact)
    X_test = _build_matrix(test, artifact)
    y_train = train[TARGET].to_numpy()
    y_test = test[TARGET].to_numpy()

    results = {}
    for split_name, X, y, df in (("train", X_train, y_train, train), ("test", X_test, y_test, test)):
        y_pred = model.predict(X)
        y_proba = model.predict_proba(X)[:, 1]
        results[split_name] = {
            "model": _classification_scores(y, y_pred, y_proba),
        }

        naive_pred = df["fair_value_band_breach"].to_numpy()
        naive_proba = naive_pred.astype(float)
        results[split_name]["naive_baseline"] = _classification_scores(y, naive_pred, naive_proba)

    print("\nBID ANOMALY MODEL PERFORMANCE REPORT")
    print("=" * 70)
    print(f"Model version: {metadata.get('model_version', MODEL_VERSION)}")
    print(f"Training date: {metadata.get('training_date', 'unknown')}")
    print(f"Dataset version: {metadata.get('dataset_version', 'unknown')}")

    for split_name in ("train", "test"):
        print(f"\n-- {split_name.upper()} --")
        for source in ("model", "naive_baseline"):
            m = results[split_name][source]
            print(
                f"  {source:<15} precision={m['precision']:.3f}  recall={m['recall']:.3f}  "
                f"f1={m['f1']:.3f}  balanced_acc={m['balanced_accuracy']:.3f}  "
                f"pr_auc={m['pr_auc']:.3f}  flagged={m['flagged_count']}/{m['n_rows']}"
            )

    test_model = results["test"]["model"]
    test_naive = results["test"]["naive_baseline"]
    if test_naive["flagged_count"] > 0:
        reduction_pct = round(
            (test_naive["flagged_count"] - test_model["flagged_count"]) / test_naive["flagged_count"] * 100, 1
        )
        print(
            f"\nModel flags {reduction_pct}% fewer bids than the naive baseline "
            f"({test_model['flagged_count']} vs {test_naive['flagged_count']}) "
            f"while catching {test_model['recall']*100:.0f}% of true anomalies "
            f"(vs naive's {test_naive['recall']*100:.0f}%)."
        )

    y_test_pred = model.predict(X_test)
    cm = confusion_matrix(y_test, y_test_pred)
    print("\nTest confusion matrix (rows=actual, cols=predicted):")
    print(cm)

    report_rows = []
    for split_name in ("train", "test"):
        for source in ("model", "naive_baseline"):
            row = {"split": split_name, "source": source, **results[split_name][source]}
            report_rows.append(row)
    report_df = pd.DataFrame(report_rows)

    report_path = output_dir / "bid_anomaly_performance_report.csv"
    report_df.to_csv(report_path, index=False)
    print(f"\nSaved -> {report_path}")

    json_path = output_dir / "bid_anomaly_performance_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Saved -> {json_path}")

    return {"results": results, "report_df": report_df}


if __name__ == "__main__":
    compute_bid_anomaly_performance()