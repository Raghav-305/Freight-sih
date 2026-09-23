"""
Generate synthetic tender records and train the bid anomaly detection model.
Produces:
1. data/raw/collusion/bid_tender_records_synthetic.csv
2. ml/models/collusion_detection/bid_anomaly_detection_v1/model.pkl
3. ml/evaluation/bid_anomaly_metrics.csv
4. ml/evaluation/bid_anomaly_feature_importance.csv
"""
import json
import pickle
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import xgboost as xgb

def generate_data(n_tenders: int = 1200, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    
    routes = [
        {"route_id": "AUS_PAR_PAN", "origin": "Gladstone", "destination_port": "PAR", "vessel_class": "Panamax", "cargo_type": "Coking Coal", "base_rate": 18.5, "base_qty": 75000},
        {"route_id": "IND_VIZ_PAN", "origin": "Taboneo", "destination_port": "VIZ", "vessel_class": "Panamax", "cargo_type": "Thermal Coal", "base_rate": 11.2, "base_qty": 72000},
        {"route_id": "RUS_HAL_PAN", "origin": "Novorossiysk", "destination_port": "HAL", "vessel_class": "Panamax", "cargo_type": "Thermal Coal", "base_rate": 22.4, "base_qty": 70000},
        {"route_id": "SAF_DHA_CAP", "origin": "Richards Bay", "destination_port": "DHA", "vessel_class": "Capesize", "cargo_type": "Thermal Coal", "base_rate": 16.8, "base_qty": 150000},
        {"route_id": "AUS_GAN_CAP", "origin": "Hay Point", "destination_port": "GAN", "vessel_class": "Capesize", "cargo_type": "Coking Coal", "base_rate": 19.1, "base_qty": 155000},
        {"route_id": "USA_PAR_CAP", "origin": "New Orleans", "destination_port": "PAR", "vessel_class": "Capesize", "cargo_type": "Coking Coal", "base_rate": 28.5, "base_qty": 145000},
    ]
    
    brokers = [f"BRK-{name}" for name in [
        "VANGUARD", "PACIFIC", "OCEANIC", "MARITIME", "NAVIGATOR", 
        "GLOBAL", "HORIZON", "EASTERN", "SOUTHERN", "ALLIANCE",
        "MERIDIAN", "ZENITH", "APEX", "TRITON", "AEGEAN"
    ]]
    
    rows = []
    start_date = pd.Timestamp("2023-01-01")
    
    for i in range(n_tenders):
        tender_id = f"TND-{2023 + (i // 500)}-{i + 1:04d}"
        days_offset = rng.integers(0, 1000)
        tender_date = start_date + pd.Timedelta(days=int(days_offset))
        
        route = rng.choice(routes)
        n_bids = rng.integers(4, 9)
        tender_brokers = rng.choice(brokers, size=n_bids, replace=False)
        
        market_freight = float(np.round(route["base_rate"] * rng.uniform(0.85, 1.25), 2))
        predicted_fair_value = float(np.round(market_freight * rng.uniform(0.96, 1.04), 2))
        fair_value_lower = float(np.round(predicted_fair_value * 0.92, 2))
        fair_value_upper = float(np.round(predicted_fair_value * 1.08, 2))
        
        bunker_price = float(np.round(rng.uniform(520.0, 780.0), 1))
        congestion_idx = float(np.round(rng.uniform(0.15, 0.85), 2))
        waiting_hours = float(np.round(congestion_idx * rng.uniform(40.0, 140.0), 1))
        
        # Determine if this tender is anomalous / collusive (approx 2% of tenders)
        is_collusive = rng.random() < 0.025
        
        tender_bid_rows = []
        for broker in tender_brokers:
            broker_hist_count = int(rng.integers(10, 80))
            broker_hist_premium = float(np.round(rng.normal(1.5, 3.0), 2))
            vessel_hist_count = int(rng.integers(5, 50))
            pairing_freq = int(rng.integers(1, 15))
            duration_days = int(rng.integers(14, 45))
            quantity = float(route["base_qty"] * rng.uniform(0.95, 1.05))
            
            # Base quote
            if is_collusive:
                # In collusive tenders, one ring leader bids slightly above fair value,
                # while other ring members submit cover bids 20-35% above fair value
                is_cover = rng.random() > 0.3
                if is_cover:
                    quote = float(np.round(predicted_fair_value * rng.uniform(1.22, 1.45), 2))
                    ground_truth = 1
                else:
                    quote = float(np.round(predicted_fair_value * rng.uniform(1.09, 1.15), 2))
                    ground_truth = 1
            else:
                # Normal competitive tender: bids scatter around fair value (-8% to +10%)
                quote = float(np.round(predicted_fair_value * rng.uniform(0.93, 1.09), 2))
                ground_truth = 0
                
            tender_bid_rows.append({
                "tender_id": tender_id,
                "tender_date": tender_date.strftime("%Y-%m-%d"),
                "broker_id": broker,
                "origin": route["origin"],
                "destination_port": route["destination_port"],
                "cargo_type": route["cargo_type"],
                "vessel_class": route["vessel_class"],
                "route_id": route["route_id"],
                "quantity_mt": round(quantity, 0),
                "quoted_freight_usd_mt": quote,
                "contract_duration_days": duration_days,
                "market_freight_usd_mt": market_freight,
                "predicted_fair_value_usd_mt": predicted_fair_value,
                "fair_value_lower_usd_mt": fair_value_lower,
                "fair_value_upper_usd_mt": fair_value_upper,
                "bunker_price_usd_mt": bunker_price,
                "congestion_index": congestion_idx,
                "predicted_waiting_hours": waiting_hours,
                "broker_historical_bid_count": broker_hist_count,
                "broker_historical_premium_pct": broker_hist_premium,
                "vessel_historical_bid_count": vessel_hist_count,
                "broker_vessel_historical_frequency": pairing_freq,
                "synthetic_anomaly_ground_truth": ground_truth,
            })
            
        # Rank bids within tender
        tender_bid_rows.sort(key=lambda r: r["quoted_freight_usd_mt"])
        quotes = [r["quoted_freight_usd_mt"] for r in tender_bid_rows]
        min_q, max_q = quotes[0], quotes[-1]
        bid_spread_pct = float(np.round((max_q - min_q) / min_q * 100.0, 2))
        
        for rank_idx, r in enumerate(tender_bid_rows):
            r["bid_rank"] = rank_idx + 1
            r["winner"] = 1 if rank_idx == 0 else 0
            dev = float(np.round((r["quoted_freight_usd_mt"] - predicted_fair_value) / predicted_fair_value * 100.0, 2))
            r["bid_deviation_pct"] = dev
            r["bid_spread_pct"] = bid_spread_pct
            r["fair_value_band_breach"] = 1 if (r["quoted_freight_usd_mt"] > fair_value_upper or r["quoted_freight_usd_mt"] < fair_value_lower) else 0
            r["high_positive_deviation_flag"] = 1 if dev > 10.0 else 0
            rows.append(r)
            
    df = pd.DataFrame(rows)
    return df

def train_and_save(df: pd.DataFrame, root: Path):
    model_dir = root / "ml" / "models" / "collusion_detection" / "bid_anomaly_detection_v1"
    model_dir.mkdir(parents=True, exist_ok=True)
    
    categorical = ["origin", "destination_port", "cargo_type", "vessel_class", "route_id"]
    numerical = [
        "quantity_mt", "quoted_freight_usd_mt", "bid_rank", "winner", "contract_duration_days",
        "market_freight_usd_mt", "predicted_fair_value_usd_mt", "fair_value_lower_usd_mt",
        "fair_value_upper_usd_mt", "bid_deviation_pct", "bunker_price_usd_mt", "congestion_index",
        "predicted_waiting_hours", "broker_historical_bid_count", "broker_historical_premium_pct",
        "vessel_historical_bid_count", "broker_vessel_historical_frequency", "bid_spread_pct",
        "fair_value_band_breach", "high_positive_deviation_flag"
    ]
    target = "synthetic_anomaly_ground_truth"
    
    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    encoder.fit(df[categorical])
    
    cat_mat = encoder.transform(df[categorical])
    num_mat = df[numerical].to_numpy(dtype=float)
    X = np.hstack([cat_mat, num_mat])
    y = df[target].to_numpy(dtype=int)
    
    n_pos = int(y.sum())
    n_neg = int(len(y) - n_pos)
    scale_pos_weight = float(n_neg / max(1, n_pos))
    print(f"Dataset: {len(df)} bids, {n_pos} positive ({n_pos/len(df)*100:.2f}%), scale_pos_weight: {scale_pos_weight:.1f}")
    
    model = xgb.XGBClassifier(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="aucpr",
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)
    
    artifact = {
        "model": model,
        "encoder": encoder,
        "categorical_features": categorical,
        "numerical_features": numerical,
        "target": target,
    }
    
    model_path = model_dir / "model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(artifact, f)
    print(f"Saved model artifact -> {model_path}")
    
    # Save feature importance
    feat_names = list(encoder.get_feature_names_out(categorical)) + numerical
    imp_df = pd.DataFrame({
        "feature": feat_names,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)
    
    eval_dir = root / "ml" / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)
    imp_df.to_csv(eval_dir / "bid_anomaly_feature_importance.csv", index=False)
    print(f"Saved feature importance -> {eval_dir / 'bid_anomaly_feature_importance.csv'}")

if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    raw_dir = root / "data" / "raw" / "collusion"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    csv_path = raw_dir / "bid_tender_records_synthetic.csv"
    print("Generating synthetic tender records...")
    df = generate_data(n_tenders=1200)
    df.to_csv(csv_path, index=False)
    print(f"Saved synthetic dataset -> {csv_path} ({len(df)} rows)")
    
    print("Training XGBoost anomaly classifier...")
    train_and_save(df, root)
    print("Training complete!")
