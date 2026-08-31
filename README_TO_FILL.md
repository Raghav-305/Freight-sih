# Freight Chartering Intelligence Project — Placeholder Fill Guide

This document is the project-ready fill-in guide for the current repo state. It is meant to tell you exactly where placeholders remain, what values must be inserted, and where the real ML model artifacts and datasets belong.

## Project status

I verified the repository is structurally valid:

- `python -m compileall backend ml optimization` → passed
- `npm --prefix frontend install --silent` → passed
- `npm --prefix frontend run build` → passed
- VS Code diagnostics for the backend, ML code, and frontend source folders → no errors reported

The code is not failing due to syntax, but several runtime values are still placeholders that must be replaced before production usage.

---

## 1. What is still placeholder

These are the current placeholder locations that must be completed.

### Model metadata placeholders

File: [ml/models/forecasting/xgboost/panamax_freight_v7/metadata.json](ml/models/forecasting/xgboost/panamax_freight_v7/metadata.json)

Current values that need real data:

- `replace-with-training-date`
- `replace-with-dataset-version`
- `replace-with-feature-version`

Add:

```json
{
  "model_name": "xgb_panamax_freight",
  "model_version": "xgb_panamax_freight_v7",
  "model_type": "XGBoost",
  "training_date": "2026-08-30",
  "dataset_version": "route_features_v12",
  "feature_version": "feature_set_v5",
  "target": "route_freight_usd_per_mt",
  "horizon": "7d_30d_60d_90d",
  "status": "active"
}
```

### Model registry placeholder

File: [ml/registry/model_registry.json](ml/registry/model_registry.json)

Current placeholder:

- `"status": "placeholder"`

Add the actual model details:

```json
{
  "active_forecasting_model": "xgb_panamax_freight_v7",
  "models": [
    {
      "model_version": "xgb_panamax_freight_v7",
      "family": "forecasting",
      "algorithm": "xgboost",
      "relative_path": "forecasting/xgboost/panamax_freight_v7",
      "artifact": "model.json",
      "feature_schema": "feature_schema.json",
      "metadata": "metadata.json",
      "status": "active"
    }
  ]
}
```

### Forecast inference mock placeholders

File: [ml/inference/forecast.py](ml/inference/forecast.py)

Current placeholder values:

- `dataset_version": "placeholder_dataset_v0"`
- `feature_version": "placeholder_features_v0"`
- `training_date": "replace-with-training-date"`

Replace with the real model metadata and valid output format.

### Congestion model placeholder

File: [ml/inference/congestion.py](ml/inference/congestion.py)

Current placeholder:

- `model_version": "placeholder_congestion_v0"`

Replace with the real model version for the congestion model.

### Optimization placeholders

These files still contain demo values:

- [optimization/contract_optimizer.py](optimization/contract_optimizer.py)
- [optimization/positioning.py](optimization/positioning.py)
- [optimization/scenario_engine.py](optimization/scenario_engine.py)

These should be replaced with actual optimization logic and realistic recommendation output.

### Model README placeholder

File: [ml/models/forecasting/xgboost/panamax_freight_v7/README.md](ml/models/forecasting/xgboost/panamax_freight_v7/README.md)

This file should document:

- model purpose
- input features
- artifacts used
- training date
- evaluation metrics
- assumptions and limitations

---

## 2. Where the actual ML models must go

Models must be placed under the Python-side ML folder, not under the frontend or public app folders.

Correct structure:

```text
ml/
├── models/
│   ├── forecasting/
│   │   ├── xgboost/
│   │   │   └── YOUR_MODEL_VERSION/
│   │   │       ├── model.json
│   │   │       ├── metadata.json
│   │   │       ├── feature_schema.json
│   │   │       └── preprocessing files if required
│   │   ├── sarima/
│   │   ├── lightgbm/
│   │   └── ensemble/
│   ├── congestion/
│   │   └── YOUR_CONGESTION_MODEL_VERSION/
│   │       ├── model.pkl
│   │       └── metadata.json
│   └── idle_time/
│       └── YOUR_IDLE_TIME_MODEL_VERSION/
├── artifacts/
│   ├── preprocessing/
│   ├── encoders/
│   ├── scalers/
│   └── explainability/
├── inference/
│   ├── forecast.py
│   ├── congestion.py
│   ├── loader.py
│   └── any runtime loaders
├── registry/
│   └── model_registry.json
└── ...
```

### Rules

- Keep the model files outside the browser.
- Keep all preprocessing files in `ml/artifacts` or along with the model directory.
- Register the model in [ml/registry/model_registry.json](ml/registry/model_registry.json).
- Ensure feature order and preprocessing match the training pipeline exactly.

---

## 3. What to add for each model

For each trained model, add these items:

### Required

- model artifact file
- metadata JSON
- feature schema JSON
- preprocessing artifacts, if used
- registry entry

### Example metadata

```json
{
  "model_name": "xgb_panamax_freight",
  "model_version": "xgb_panamax_freight_v7",
  "model_type": "XGBoost",
  "training_date": "2026-08-30",
  "dataset_version": "route_features_v12",
  "feature_version": "feature_set_v5",
  "target": "route_freight_usd_per_mt",
  "horizon": "7d_30d_60d_90d",
  "status": "active"
}
```

### Example registry item

```json
{
  "model_version": "xgb_panamax_freight_v7",
  "family": "forecasting",
  "algorithm": "xgboost",
  "relative_path": "forecasting/xgboost/panamax_freight_v7",
  "artifact": "model.json",
  "feature_schema": "feature_schema.json",
  "metadata": "metadata.json",
  "status": "active"
}
```

---

## 4. Environment values to fill in

Use [.env.example](.env.example) as the template and create a real local `.env` file.

### Frontend values

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_MODE=live
VITE_APP_NAME=Freight Chartering Intelligence Platform
VITE_APP_ENV=local
```

### Backend values

```env
ENVIRONMENT=local
DATABASE_URL=postgresql+psycopg://freight_user:freight_password@localhost:5432/freight_intelligence
CORS_ORIGINS=http://localhost:5173
MODEL_ROOT_PATH=./ml/models
MODEL_ARTIFACT_PATH=./ml/artifacts
MODEL_REGISTRY_PATH=./ml/registry/model_registry.json
DATA_ROOT_PATH=./data
```

### Replace with real values later

- actual DB username/password
- internal hosts and ports
- correct CORS origins
- production secret variables
- model paths if moved outside repo

---

## 5. Data folders to populate

The project expects data under the following folders:

```text
data/
├── raw/
│   ├── freight/
│   ├── ais/
│   ├── baltic_indices/
│   ├── bunker/
│   ├── commodities/
│   ├── congestion/
│   ├── ffa/
│   ├── fixtures/
│   ├── ports/
│   ├── risk_events/
│   └── weather/
├── clean/
├── processed/
├── features/
├── fixtures/
└── ...
```

Add real route, market, bunker, weather, AIS, congestion, and port data before validating model inference.

---

## 6. Backend contract that must remain stable

The FastAPI response contract is defined in [backend/app/schemas/forecast.py](backend/app/schemas/forecast.py) and should stay stable between model updates.

Expected output structure:

```json
{
  "current_freight": 18.5,
  "forecast": {
    "7d": { "p10": 17.8, "p50": 19.2, "p90": 21.5 },
    "30d": { "p10": 18.1, "p50": 20.8, "p90": 24.7 },
    "60d": { "p10": 18.4, "p50": 21.9, "p90": 26.0 },
    "90d": { "p10": 18.8, "p50": 23.2, "p90": 27.4 }
  },
  "confidence": 0.72,
  "model_version": "xgb_panamax_freight_v7",
  "dataset_version": "route_features_v12",
  "feature_version": "feature_set_v5",
  "training_date": "2026-08-30",
  "shap": []
}
```

The frontend and backend should both use this shape.

---

## 7. Completion checklist

Check the following before calling the project production-ready:

- [ ] Real model artifact files exist in `ml/models`
- [ ] Real model metadata is filled in the model JSON and registry
- [ ] Placeholder values are removed from [ml/inference/forecast.py](ml/inference/forecast.py)
- [ ] Placeholder values are removed from [ml/inference/congestion.py](ml/inference/congestion.py)
- [ ] Reality is filled into [ml/registry/model_registry.json](ml/registry/model_registry.json)
- [ ] Optimization modules use real logic, not placeholders
- [ ] Actual `.env` values are configured
- [ ] Data folders are populated with valid local data
- [ ] Backend API returns the expected forecast contract
- [ ] Frontend points to the live backend URL

---

## 8. Recommended next actions

1. Add the actual model artifacts under `ml/models`.
2. Fill the training metadata values for each model.
3. Replace placeholder registry entries.
4. Remove mock forecast logic and connect real inference.
5. Validate the FastAPI response before enabling the frontend.
6. Then run the end-to-end live flow with data + backend + frontend.

---

## 9. Summary

This repo is a valid scaffold with working build integrity, but it is still a placeholder project in its current state. The missing items are not syntax errors—they are real deployment values: model metadata, model registry entries, data files, environment config, and live inference logic.

That is the work to complete before this becomes a real operational forecasting and chartering system.
