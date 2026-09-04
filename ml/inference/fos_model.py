"""Leakage-safe Freight Opportunity Score model and production inference."""

from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Dict, Iterable, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


DECISIONS = ("AVOID_WAIT", "WAIT", "MONITOR", "GOOD_OPPORTUNITY", "FIX_NOW")
COMPONENT_WEIGHTS = {
    "forecast": 0.25,
    "rate_opportunity": 0.15,
    "market_signal": 0.15,
    "fleet_supply": 0.10,
    "port_congestion": 0.10,
    "weather_risk": 0.10,
    "voyage_economics": 0.15,
}
FORECAST_COLUMNS = {
    7: "model_forecast_7d_usd_mt",
    30: "model_forecast_30d_usd_mt",
    60: "model_forecast_60d_usd_mt",
}
LEAKAGE_TOKENS = ("future_", "target", "label", "actual_after", "backtest")


def _clip_score(value: pd.Series | np.ndarray | float) -> pd.Series | np.ndarray | float:
    return np.clip(value, 0.0, 100.0)


def _percentile_score(value: pd.Series, low: float, high: float) -> pd.Series:
    return _clip_score((value - low) / (high - low) * 100.0)


class FreightOpportunityScorer:
    """Train, score, explain, and backtest route-level FOS observations."""

    def __init__(self, artifact_dir: str | Path):
        self.artifact_dir = Path(artifact_dir)
        self.model: Optional[Pipeline] = None
        self.feature_columns: list[str] = []
        self.model_features: list[str] = []
        self.external_forecast_used = False

    @staticmethod
    def leakage_safe_features(df: pd.DataFrame) -> list[str]:
        excluded = {"date", "route_id", "origin", "destination_port", "destination_port_id",
                    "vessel_class", "cargo_type", "fos_recommendation", "fos_version"}
        features = []
        for column in df.select_dtypes(include=[np.number]).columns:
            name = column.lower()
            if column not in excluded and not any(token in name for token in LEAKAGE_TOKENS):
                if not name.startswith("model_forecast_") and df[column].notna().any():
                    features.append(column)
        return features

    @staticmethod
    def add_targets(df: pd.DataFrame) -> pd.DataFrame:
        result = df.sort_values(["route_id", "date"]).copy()
        grouped = result.groupby("route_id", sort=False)["freight_usd_mt"]
        for horizon in (7, 30, 60):
            future = grouped.shift(-horizon)
            result[f"future_return_{horizon}d_pct"] = (future / result["freight_usd_mt"] - 1.0) * 100.0
            result[f"future_change_{horizon}d_usd_mt"] = future - result["freight_usd_mt"]
        return result

    def fit(self, df: pd.DataFrame, train_end: str = "2023-12-31") -> Dict[str, float]:
        data = self.add_targets(df)
        data["date"] = pd.to_datetime(data["date"])
        train = data[(data["date"] <= train_end) & data["future_return_30d_pct"].notna()].copy()
        self.model_features = self.leakage_safe_features(data)
        if not self.model_features:
            raise ValueError("No leakage-safe numeric features are available for training")
        self.model = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", RandomForestRegressor(n_estimators=250, max_depth=12, min_samples_leaf=8,
                                             random_state=42, n_jobs=-1)),
        ])
        self.model.fit(train[self.model_features], train["future_return_30d_pct"])
        return {"train_rows": int(len(train)), "train_end": train_end,
                "feature_count": int(len(self.model_features))}

    def _learned_forecast(self, data: pd.DataFrame) -> pd.Series:
        if self.model is None:
            raise ValueError("Model is not fitted. Call fit() or load() first.")
        return pd.Series(self.model.predict(data[self.model_features]), index=data.index)

    def _forecast_return(self, data: pd.DataFrame, horizon: int) -> tuple[pd.Series, pd.Series]:
        current = data["freight_usd_mt"].replace(0, np.nan)
        forecast_column = FORECAST_COLUMNS[horizon]
        if forecast_column in data and data[forecast_column].notna().any():
            forecast = data[forecast_column].where(data[forecast_column].notna(), data["freight_usd_mt"])
            self.external_forecast_used = True
            source = pd.Series("trained_forecast_model", index=data.index)
        else:
            predicted_return = self._learned_forecast(data)
            forecast = current * (1.0 + predicted_return / 100.0)
            source = pd.Series("temporal_fos_return_model", index=data.index)
        return (forecast / current - 1.0) * 100.0, source

    def score(self, df: pd.DataFrame, horizon: int = 30) -> pd.DataFrame:
        if horizon not in (7, 30, 60):
            raise ValueError("horizon must be 7, 30, or 60")
        data = df.copy()
        data["date"] = pd.to_datetime(data["date"])
        expected_return, forecast_source = self._forecast_return(data, horizon)
        current = data["freight_usd_mt"].replace(0, np.nan)
        rate = data.get("current_rate_opportunity_score", pd.Series(50.0, index=data.index)).fillna(50)
        market = (data.get("market_score", pd.Series(50.0, index=data.index)).fillna(50) +
                  data.get("ffa_score", pd.Series(50.0, index=data.index)).fillna(50)) / 2
        supply = data.get("fleet_supply_score", pd.Series(50.0, index=data.index)).fillna(50)
        congestion = 100 - data.get("congestion_score", pd.Series(50.0, index=data.index)).fillna(50)
        weather = 100 - data.get("weather_risk_score", pd.Series(50.0, index=data.index)).fillna(50)
        economics = data.get("risk_adjusted_score", data.get("economic_score", pd.Series(50.0, index=data.index))).fillna(50)
        forecast = _percentile_score(expected_return, -10, 10)
        components = pd.DataFrame({
            "forecast_score": forecast,
            "rate_opportunity_score": _clip_score(rate),
            "market_signal_score": _clip_score(market),
            "fleet_supply_score": _clip_score(supply),
            "port_congestion_score": _clip_score(congestion),
            "weather_risk_score": _clip_score(weather),
            "voyage_economics_score": _clip_score(economics),
        }, index=data.index)
        fos = sum(components[name + "_score"] * weight for name, weight in COMPONENT_WEIGHTS.items())
        result = data[[column for column in ("date", "route_id", "origin", "destination_port",
                                              "vessel_class", "freight_usd_mt") if column in data]].copy()
        result["expected_return_pct"] = expected_return
        result["expected_freight_usd_mt"] = current * (1 + expected_return / 100)
        result["forecast_source"] = forecast_source
        result = pd.concat([result, components], axis=1)
        result["fos"] = _clip_score(fos).round(2)
        result["fos_recommendation"] = pd.cut(result["fos"], [-1, 20, 40, 60, 80, 101], labels=DECISIONS)
        for component in components.columns:
            result[f"contribution_{component}"] = (components[component] *
                                                     COMPONENT_WEIGHTS[component.replace("_score", "")]).round(2)
        return result

    def backtest(self, scored: pd.DataFrame, source: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
        actual = self.add_targets(source)
        keys = ["date", "route_id"]
        joined = scored.merge(actual[keys + ["future_return_7d_pct", "future_return_30d_pct", "future_return_60d_pct"]],
                              on=keys, how="left")
        rows = []
        for horizon in (7, 30, 60):
            target = joined[f"future_return_{horizon}d_pct"]
            actionable = joined["fos_recommendation"].notna() & target.notna()
            signal_up = joined["fos"] >= 60
            signal_down = joined["fos"] < 40
            correct = ((signal_up & (target > 0)) | (signal_down & (target <= 0))) & actionable
            precision_denominator = (signal_up & actionable).sum()
            rows.append({
                "horizon_days": horizon, "observations": int(actionable.sum()),
                "hit_rate": float(correct.sum() / actionable.sum()) if actionable.sum() else np.nan,
                "precision_fix_now": float(((signal_up & (target > 0) & actionable).sum() / precision_denominator)
                                           if precision_denominator else np.nan),
                "false_signal_rate": float((((signal_up & (target <= 0)) | (signal_down & (target > 0))) & actionable).sum() /
                                            actionable.sum()) if actionable.sum() else np.nan,
                "savings_usd_mt": float(np.where(signal_down & actionable, np.maximum(-target, 0),
                                                  np.where(signal_up & actionable, np.maximum(target, 0), 0)).sum()),
            })
        return joined, pd.DataFrame(rows)

    def save(self, metadata: Optional[Dict] = None) -> None:
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        with open(self.artifact_dir / "fos_model.pkl", "wb") as handle:
            pickle.dump(self.model, handle)
        (self.artifact_dir / "fos_feature_schema.json").write_text(json.dumps(self.model_features, indent=2))
        (self.artifact_dir / "fos_metadata.json").write_text(json.dumps(metadata or {}, indent=2, default=str))

    def load(self) -> "FreightOpportunityScorer":
        with open(self.artifact_dir / "fos_model.pkl", "rb") as handle:
            self.model = pickle.load(handle)
        self.model_features = json.loads((self.artifact_dir / "fos_feature_schema.json").read_text())
        return self

    def feature_importance(self) -> pd.DataFrame:
        if self.model is None:
            raise ValueError("Model is not fitted")
        values = self.model.named_steps["model"].feature_importances_
        return pd.DataFrame({"feature": self.model_features, "importance": values}).sort_values("importance", ascending=False)


def production_score(input_csv: str | Path, artifact_dir: str | Path, output_csv: str | Path) -> pd.DataFrame:
    """Load persisted artifacts and score a CSV for production inference."""
    scorer = FreightOpportunityScorer(artifact_dir).load()
    scored = scorer.score(pd.read_csv(input_csv))
    scored.to_csv(output_csv, index=False)
    return scored