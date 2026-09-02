from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)

HORIZONS = [7, 30, 60, 90]
LAGS = [1, 7, 30, 60, 90]
ROLLING_WINDOWS = [7, 30]
MODEL_VERSION = "panamax_freight_v7"

HISTORY_FEATURES = [f"freight_lag_{lag}d" for lag in LAGS] + [
    f"freight_rolling_mean_{window}d" for window in ROLLING_WINDOWS
]


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def build_matrix(df: pd.DataFrame, artifact: dict, numerical_features: list[str]) -> np.ndarray:
    categorical = artifact["categorical_features"]
    encoder = artifact["encoder"]
    cat = encoder.transform(df[categorical])
    num = df[numerical_features].to_numpy()
    return np.hstack([cat, num])


def wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    denominator = np.abs(y_true).sum()
    if denominator == 0:
        return float("nan")
    return float(np.abs(y_true - y_pred).sum() / denominator * 100)


def _score(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mse = mean_squared_error(y_true, y_pred)
    return {
        "MAE": mean_absolute_error(y_true, y_pred),
        "RMSE": float(np.sqrt(mse)),
        "MAPE": mean_absolute_percentage_error(y_true, y_pred) * 100,
        "WAPE": wape(y_true, y_pred),
        "R2": r2_score(y_true, y_pred),
    }


def _naive_score(target_true: pd.Series, naive_pred: pd.Series) -> dict[str, float]:
    return _score(target_true.to_numpy(), naive_pred.to_numpy())


def compute_model_performance() -> dict[str, Any]:
    root = project_root()
    model_dir = root / "ml" / "models" / "forecasting" / "xgboost" / MODEL_VERSION
    model_path = model_dir / "model.pkl"
    metadata_path = model_dir / "metadata.json"
    data_path = root / "data" / "processed" / "model_data.csv"

    with open(model_path, "rb") as model_file:
        artifact = pickle.load(model_file)

    metadata: dict[str, Any] = {}
    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as metadata_file:
            metadata = json.load(metadata_file)

    numerical_features = artifact["numerical_features"]
    data = pd.read_csv(data_path, parse_dates=["date"])

    train = data[data["date"] < "2025-01-01"].copy().dropna(subset=HISTORY_FEATURES)
    validation = data[(data["date"] >= "2025-01-01") & (data["date"] < "2025-10-01")].copy()
    test = data[data["date"] >= "2025-10-01"].copy()

    X_train = build_matrix(train, artifact, numerical_features)
    X_validation = build_matrix(validation, artifact, numerical_features)
    X_test = build_matrix(test, artifact, numerical_features)

    rows = []
    for horizon in HORIZONS:
        target_col = f"target_{horizon}d"
        model = artifact["models"][horizon]

        horizon_report: dict[str, Any] = {
            "horizon": f"{horizon}d",
            "model_version": metadata.get("model_version", MODEL_VERSION),
            "dataset_version": metadata.get("dataset_version", "unknown"),
            "training_date": metadata.get("training_date", "unknown"),
        }

        for split_name, X_split, split_df in (
            ("train", X_train, train),
            ("val", X_validation, validation),
            ("test", X_test, test),
        ):
            y = split_df[target_col]
            mask = y.notna().to_numpy()
            if mask.sum() == 0:
                for metric in ("MAE", "RMSE", "MAPE", "WAPE", "R2"):
                    horizon_report[f"{split_name}_{metric}"] = None
                horizon_report[f"{split_name}_rows"] = 0
                continue

            predictions = model.predict(X_split[mask])
            scores = _score(y[mask].to_numpy(), predictions)
            for metric, value in scores.items():
                horizon_report[f"{split_name}_{metric}"] = round(float(value), 4)
            horizon_report[f"{split_name}_rows"] = int(mask.sum())

            if split_name == "test":
                naive_pred = split_df.loc[mask, "freight_usd_mt"]
                naive_scores = _naive_score(y[mask], naive_pred)
                for metric, value in naive_scores.items():
                    horizon_report[f"test_naive_{metric}"] = round(float(value), 4)

        rows.append(horizon_report)

    report_dir = root / "ml" / "evaluation"
    report_dir.mkdir(parents=True, exist_ok=True)
    report_df = pd.DataFrame(rows)
    report_df.to_csv(report_dir / "model_performance_report.csv", index=False)
    with open(report_dir / "model_performance_report.json", "w", encoding="utf-8") as out_file:
        json.dump(rows, out_file, indent=2)

    return {"rows": rows, "report_df": report_df.to_dict(orient="records")}


if __name__ == "__main__":
    compute_model_performance()
