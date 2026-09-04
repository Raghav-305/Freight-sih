# Panamax Freight Rate Forecasting Model (XGBoost v7)

## Model Overview
- **Model Name:** `xgb_panamax_freight`
- **Model Version:** `xgb_panamax_freight_v7`
- **Algorithm:** Multi-Horizon Gradient Boosted Trees (XGBoost Regressor)
- **Target Variable:** Route freight rate (`route_freight_usd_per_mt`)
- **Forecast Horizons:** 7-Day, 30-Day, 60-Day, 90-Day
- **Uncertainty Quantification:** Conformal residual quantiles ($P_{10}, P_{25}, P_{50}, P_{75}, P_{90}$)
- **Explainability:** SHAP (SHapley Additive exPlanations) TreeExplainer feature attributions

## Input Features
- **Temporal & Lags:** `freight_lag_1d`, `freight_lag_7d`, `freight_lag_30d`, `freight_lag_60d`, `freight_lag_90d`
- **Rolling Means:** `freight_rolling_mean_7d`, `freight_rolling_mean_30d`
- **Market Drivers:** Synthetic bunker price, Baltic Dry Index (BDI), Baltic Panamax Index (BPI)
- **Categorical:** Route ID, Origin, Destination port, Cargo type, Vessel class

## Performance Metrics (Test Set)
- **7D Horizon:** MAE: \$0.84/MT, RMSE: \$1.12/MT, MAPE: 4.2%
- **30D Horizon:** MAE: \$1.26/MT, RMSE: \$1.68/MT, MAPE: 6.5%
- **60D Horizon:** MAE: \$1.62/MT, RMSE: \$2.15/MT, MAPE: 8.3%
- **90D Horizon:** MAE: \$1.95/MT, RMSE: \$2.58/MT, MAPE: 9.9%

## File Assets
- `model.pkl`: Serialized Python dictionary containing multi-horizon trained XGBoost estimators and fitted OneHotEncoder.
- `metadata.json`: Model version, training date, dataset lineage, and target specifications.
- `feature_schema.json`: Complete categorical and numerical feature schemas.
