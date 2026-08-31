import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import shap
import matplotlib.pyplot as plt


HORIZONS = [7, 30, 60, 90]
CATEGORICAL_FEATURES = [
    "route_id", "origin", "destination_port", "vessel_class", "cargo_type"
]
MODEL_VERSION = "panamax_freight_v7"


def project_root():
    return Path(__file__).resolve().parents[2]


def build_features(df, artifact):
    encoder = artifact["encoder"]
    categorical = artifact["categorical_features"]
    numerical = artifact["numerical_features"]

    missing = [c for c in categorical + numerical if c not in df.columns]
    if missing:
        raise ValueError(f"Missing model input columns: {missing}")

    cat = encoder.transform(df[categorical])
    num = df[numerical].to_numpy()
    X = np.hstack([cat, num])

    feature_names = list(
        encoder.get_feature_names_out(categorical)
    ) + numerical

    return X, feature_names


def main():
    root = project_root()
    model_path = (
        root
        / "ml"
        / "models"
        / "forecasting"
        / "xgboost"
        / MODEL_VERSION
        / "model.pkl"
    )
    data_path = root / "data" / "processed" / "model_data.csv"
    output_dir = root / "ml" / "artifacts" / "explainability" / "shap"
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(model_path, "rb") as f:
        artifact = pickle.load(f)

    df = pd.read_csv(data_path)

    df = df.tail(min(2000, len(df))).copy()

    X, feature_names = build_features(df, artifact)
    X_df = pd.DataFrame(X, columns=feature_names)

    for h in HORIZONS:
        model = artifact["models"][h]

        explainer = shap.TreeExplainer(model)
        values = explainer.shap_values(X_df)

        shap_values = pd.DataFrame(values, columns=feature_names)
        shap_values.to_csv(
            output_dir / f"shap_values_{h}d.csv", index=False
        )

        importance = (
            shap_values.abs()
            .mean()
            .sort_values(ascending=False)
            .rename("mean_abs_shap")
            .reset_index()
            .rename(columns={"index": "feature"})
        )
        importance.to_csv(
            output_dir / f"shap_feature_importance_{h}d.csv",
            index=False,
        )

        # Summary plot
        plt.figure()
        shap.summary_plot(values, X_df, show=False)
        plt.tight_layout()
        plt.savefig(
            output_dir / f"shap_summary_{h}d.png",
            dpi=200,
            bbox_inches="tight",
        )
        plt.close()

        print(f"Finished SHAP for {h}-day horizon.")

    print(f"\nSHAP outputs saved to: {output_dir}")


if __name__ == "__main__":
    main()
