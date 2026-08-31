# Freight Chartering Intelligence Platform

AI-assisted maritime procurement and freight chartering decision-support system for local, offline-capable operation with your own trained ML models and your own database.

> **Important:** The Hatchable deployment is a demonstration/hosting version. The production/local architecture described in this README is the conventional React + TypeScript + Vite + FastAPI + Python + SQLAlchemy application specified for the project. For a truly air-gapped/offline installation, run the conventional repository on your own machine/server and do not depend on Hatchable at runtime.

## 1. What the system does

The system takes cargo, quantity, origin, destination, vessel class, laycan and contract requirements and produces an AI-assisted chartering recommendation.

Typical output includes:

- Current freight
- 7D / 30D / 60D / 90D forecast
- P10 / P25 / P50 / P75 / P90 uncertainty ranges
- Recommended vessel
- Hard-constraint feasibility
- Freight Opportunity Score (FOS)
- Fix / Wait / Partial Cover recommendation
- Contract / COA recommendation
- Recommended coverage
- Expected cost
- Baseline cost
- Expected saving
- Market / port / weather / geopolitical / supply / contract risk
- Expected congestion and waiting time
- Explainability / SHAP contributions
- Model, dataset and feature versions

The supplied project specification explicitly requires this to remain a decision-support system with authorized human review, not an autonomous government decision maker. fileciteturn2file0L354-L382

---

# 2. OFFLINE / NO-INTERNET REQUIREMENT

The application should be designed so that **after the required software packages, model files and database are installed/copied onto the machine, normal operation does not require internet access**.

For a fully offline or air-gapped deployment:

- Frontend assets must be bundled locally.
- Do not load Google Fonts, CDN Tailwind, CDN JavaScript, remote chart libraries or remote icon libraries at runtime.
- Backend must run locally.
- ML inference must load local model artifacts.
- Database must run locally or on the organization's internal network.
- All required reference datasets must be local.
- Weather/market/AIS updates must be imported through an approved offline/manual file transfer if live internet feeds are unavailable.
- External AI APIs are optional and should NOT be required for the core forecasting/recommendation workflow.
- Keep a `mock` mode so the frontend can also run without models or a database during UI development.

### Three supported operating modes

**1. Mock mode**

```text
Browser → local frontend → mock API/data
```

No database or ML model required.

**2. Local live mode**

```text
Browser → localhost FastAPI → local ML models → local PostgreSQL/MySQL
```

No internet required.

**3. Internal production mode**

```text
Browser → internal FastAPI → internal ML/model registry → internal DB
```

Internet is not required if all data/model dependencies are mirrored internally.

The project specification already calls for mock mode and local Docker services and says the basic frontend demo should run without the database or ML models. fileciteturn1file4L300-L322

---

# 3. EXACT MODEL LOCATION

When your trained models are ready, place them under:

```text
ml/models/
```

Recommended exact structure:

```text
ml/
├── models/
│   ├── forecasting/
│   │   ├── xgboost/
│   │   │   └── panamax_30d_v7/
│   │   │       ├── model.json
│   │   │       ├── metadata.json
│   │   │       └── feature_schema.json
│   │   ├── lightgbm/
│   │   ├── sarima/
│   │   │   └── panamax_30d_v7/
│   │   └── ensemble/
│   │       └── ensemble_v1.json
│   │
│   ├── congestion/
│   │   └── congestion_v1/
│   │       ├── model.pkl
│   │       └── metadata.json
│   │
│   └── idle_time/
│       └── idle_time_v1/
│
├── artifacts/
│   ├── preprocessing/
│   ├── scalers/
│   ├── encoders/
│   ├── feature_maps/
│   └── explainability/
│
├── inference/
│   ├── forecast.py
│   ├── congestion.py
│   ├── vessel.py
│   └── loader.py
│
├── preprocessing/
├── features/
├── evaluation/
├── explainability/
│   └── shap/
└── registry/
    └── model_registry.json
```

The key rule is:

> **Do not put trained model files in `frontend/`, `public/`, or browser-accessible static assets.**

The model must be loaded by Python on the backend.

The supplied project specification explicitly says model artifacts should be placed under `ml/models/...`, followed by an inference interface, model registration and FastAPI exposure. fileciteturn1file4L369-L409

---

# 4. WHAT EXACTLY SHOULD I GIVE THE PROJECT?

For each trained model, provide:

### A. Model artifact

Examples:

```text
model.json
model.pkl
model.joblib
model.onnx
model.pt
model.bin
```

The correct extension depends on how you trained/exported the model.

### B. Feature/preprocessing artifacts

If the model depends on preprocessing, provide all of it:

```text
scaler.pkl
encoder.pkl
feature_order.json
categorical_mapping.json
normalization.json
```

**Do not only give the final model weights.** The exact preprocessing used during training must be reproducible during inference.

### C. Model metadata

Every model should have:

```json
{
  "model_name": "xgb_panamax_30d",
  "model_version": "xgb_panamax_30d_v7",
  "model_type": "XGBoost",
  "training_date": "2026-08-28",
  "dataset_version": "route_features_v12",
  "feature_version": "v5.1",
  "target": "route_freight_usd_per_mt",
  "horizon": "30d"
}
```

Also document training features, units, expected input ranges, missing-value handling and evaluation metrics.

---

# 5. DATA REQUIRED

Keep production datasets outside the frontend.

Recommended local structure:

```text
data/
├── raw/
│   ├── freight/
│   ├── baltic/
│   ├── ais/
│   ├── fixtures/
│   ├── ports/
│   ├── weather/
│   ├── bunker/
│   ├── ffa/
│   └── commodities/
├── clean/
├── processed/
├── features/
└── fixtures/
```

The important data families are:

| Category | Required information |
|---|---|
| Freight | historical route freight, fixtures, voyage economics |
| Baltic | BDI, BPI, BSI and related indices |
| Vessel | DWT, LOA, beam, draft, speed, fuel consumption, class |
| AIS | positions, port calls, vessel movement/utilization |
| Ports | port master data, berths, loading/discharge capability |
| Constraints | draft, LOA, beam, DWT and berth limits |
| Congestion | queue, waiting time, berth utilization, historical P90 |
| Weather | observations, forecasts and severe-weather events |
| Commodity | coal/iron ore/grain prices and demand signals |
| Bunker | bunker prices and fuel economics |
| FFA | forward freight curves/signals |
| Fixtures | historical charter transactions |
| Risk events | weather, geopolitical, supply and contract events |
| Route features | final model-ready daily feature table |

The project specification identifies these same data entities, including `ports`, `port_constraints`, `vessels`, `freight_rates`, `fixtures`, `port_calls`, `ais_positions`, `commodity_prices`, `bunker_prices`, `ffa_prices`, `coal_imports`, `weather`, `route_daily_features`, `port_congestion`, `risk_events`, `model_versions`, `predictions` and `recommendations`. fileciteturn1file4L218-L236

---

# 6. DATABASE — POSTGRESQL OR MYSQL?

## Recommended: PostgreSQL

Use PostgreSQL for the production implementation because the original architecture specifies PostgreSQL with a TimescaleDB-compatible time-series structure.

```text
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/freight_intelligence
```

## MySQL is also possible

You can use MySQL if your organization already standardizes on it, **provided the database layer is written through SQLAlchemy and the schema avoids PostgreSQL-only/TimescaleDB-only SQL**.

```text
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/freight_intelligence
```

If MySQL is selected:

- keep SQLAlchemy models dialect-neutral
- avoid PostgreSQL-specific extensions
- replace TimescaleDB hypertables with ordinary indexed time-series tables
- verify JSON, UUID, timestamp and upsert behavior
- run the complete integration test suite against MySQL

Do not make the frontend aware of which database is being used.

The architecture must remain:

```text
React
  ↓
FastAPI
  ↓
Services
  ↓
ML / Optimization / Database
```

Never:

```text
React → PostgreSQL/MySQL
```

This separation is explicitly required by the project specification. fileciteturn1file4L240-L266

---

# 7. LOCAL PROJECT STRUCTURE

Use this as the canonical local repository:

```text
freight-intelligence/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config/
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   └── dependencies/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── ml/
│   ├── models/             ← PUT TRAINED MODELS HERE
│   ├── artifacts/          ← scalers/encoders/preprocessors
│   ├── preprocessing/
│   ├── features/
│   ├── inference/          ← MODEL LOADING + PREDICTION CODE
│   ├── evaluation/
│   ├── explainability/
│   └── registry/
│
├── optimization/
│   ├── vessel_selection.py
│   ├── contract_optimizer.py
│   ├── positioning.py
│   └── scenario_engine.py
│
├── data/
│   ├── raw/
│   ├── clean/
│   ├── processed/
│   ├── features/
│   └── fixtures/
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
├── docs/
├── tests/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 8. ENVIRONMENT VARIABLES

Create:

```text
.env
```

from:

```text
.env.example
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_MODE=live
VITE_APP_NAME=Freight Chartering Intelligence Platform
VITE_APP_ENV=local
```

For UI-only development:

```env
VITE_API_MODE=mock
```

Backend:

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/freight_intelligence
MODEL_REGISTRY_PATH=./ml/registry/model_registry.json
MODEL_ROOT_PATH=./ml/models
MODEL_ARTIFACT_PATH=./ml/artifacts
DATA_ROOT_PATH=./data
CORS_ORIGINS=http://localhost:5173
ENVIRONMENT=local
```

The supplied project specification already defines `VITE_API_BASE_URL`, `VITE_API_MODE`, `DATABASE_URL`, `MODEL_REGISTRY_PATH`, `MLFLOW_TRACKING_URI` and `CORS_ORIGINS` as the relevant configuration pattern. fileciteturn1file4L270-L296

---

# 9. HOW THE REAL MODEL CONNECTS

When the ML model is ready:

### Step 1 — Copy model

```text
ml/models/forecasting/xgboost/panamax_30d_v7/
```

### Step 2 — Add model loader

Example responsibility:

```text
ml/inference/forecast.py
```

It should:

1. Load the artifact once.
2. Validate feature order.
3. Apply the exact training preprocessing.
4. Run inference.
5. Produce probabilistic outputs.
6. Produce explainability data where supported.
7. Attach model metadata.

### Step 3 — Register it

Add it to:

```text
ml/registry/model_registry.json
```

### Step 4 — Connect FastAPI

For example:

```text
backend/app/api/forecast.py
backend/app/services/forecast_service.py
```

### Step 5 — Keep the response contract stable

The frontend should continue receiving:

```json
{
  "current_freight": 19.4,
  "forecast": {
    "7d": {"p10": 18.7, "p50": 19.8, "p90": 21.4},
    "30d": {"p10": 18.1, "p50": 21.0, "p90": 25.2},
    "60d": {"p10": 19.1, "p50": 22.5, "p90": 27.8},
    "90d": {"p10": 19.8, "p50": 23.2, "p90": 29.7}
  },
  "confidence": 0.78,
  "model_version": "xgb_panamax_30d_v7",
  "dataset_version": "route_features_v12",
  "feature_version": "v5.1",
  "training_date": "2026-08-28",
  "shap": []
}
```

### Step 6 — Switch frontend to live

```env
VITE_API_MODE=live
VITE_API_BASE_URL=http://localhost:8000
```

### Step 7 — Test API before opening the dashboard

Do not connect the frontend until the FastAPI endpoint returns the correct schema.

---

# 10. LOCAL INSTALLATION

## Option A — Completely local without Docker

Install locally:

- Python
- Node.js
- PostgreSQL OR MySQL

Then:

```bash
cd freight-intelligence
```

### Backend

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Configure `.env`, create the database, run migrations, then:

```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

After dependencies are installed, this setup does not require internet for normal runtime operation.

---

# 11. OFFLINE INSTALLATION

For an air-gapped machine, do the dependency installation on an internet-connected staging machine first.

Prepare:

- Python wheel cache / offline package directory
- Node package cache or packaged `node_modules`
- local model artifacts
- local datasets
- database backup/schema
- all frontend static assets

Transfer the approved package bundle to the offline machine.

Then install from local package caches only. Do not allow the application to fetch remote JavaScript, fonts, models, APIs or data at runtime.

For strict air-gapped operation, disable optional external integrations and use locally mirrored data feeds.

---

# 12. DOCKER LOCAL SETUP

Recommended local services:

```text
frontend
backend
postgres
```

Optional:

```text
mlflow
```

MLflow is useful for model tracking but must NOT be a runtime requirement for basic inference.

Example:

```bash
docker compose up --build
```

The database volume should persist separately from the application containers.

For an offline deployment, build/pull all required images before entering the air-gapped environment.

---

# 13. HOW TO TEST THE WHOLE PROJECT

Test from the bottom up.

```text
Database
  ↓
Data loading
  ↓
Feature generation
  ↓
ML inference
  ↓
Congestion prediction
  ↓
Economic engine
  ↓
Vessel constraints
  ↓
Vessel ranking
  ↓
FOS
  ↓
Contract optimizer
  ↓
Risk engine
  ↓
FastAPI
  ↓
Frontend
```

## Test input 1 — Basic forecast

```json
{
  "origin": "Gladstone",
  "destination": "Dhamra",
  "vessel_type": "Panamax",
  "cargo_type": "Coal",
  "cargo_quantity": 80000,
  "laycan_start": "2026-10-10",
  "laycan_end": "2026-10-20"
}
```

Expected checks:

- Request accepted.
- Features generated.
- Model loads successfully.
- Forecast contains 7D/30D/60D/90D.
- Each horizon has P10/P50/P90.
- Model version returned.
- Dataset version returned.
- Feature version returned.
- SHAP/contribution data returned if supported.
- Frontend displays the result without recalculating it.

## Test input 2 — Vessel feasibility

```json
{
  "origin": "Gladstone",
  "destination": "Dhamra",
  "vessel_type": "Panamax",
  "cargo_type": "Coal",
  "cargo_quantity": 80000
}
```

Check:

- Capacity
- DWT
- Draft
- LOA
- Beam
- Port compatibility
- Handling constraints

Every failed constraint should have a human-readable reason.

## Test input 3 — Charter optimization

```json
{
  "cargo_quantity": 480000,
  "origin": "Australia",
  "destination": "Dhamra",
  "period_start": "2026-10-01",
  "period_end": "2027-03-31",
  "contract_options": ["spot", "short_term", "multi_voyage", "coa"]
}
```

Verify:

- allocation percentages
- expected cost
- baseline cost
- expected saving
- risk
- recommended strategy
- fixing window

## Test input 4 — What-if

Start with:

```json
{
  "cargo_quantity": 400000,
  "origin": "Australia",
  "destination": "Indonesia",
  "vessel_type": "Panamax",
  "coverage": 60,
  "freight_change_pct": 0,
  "bunker_change_pct": 0,
  "congestion_change_days": 0
}
```

Then change:

```json
{
  "cargo_quantity": 500000,
  "coverage": 70,
  "freight_change_pct": 8,
  "bunker_change_pct": 5,
  "congestion_change_days": 0.5
}
```

Compare baseline and scenario outputs.

---

# 14. API TESTING WITH CURL

Forecast:

```bash
curl -X POST http://127.0.0.1:8000/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "origin":"Gladstone",
    "destination":"Dhamra",
    "vessel_type":"Panamax",
    "cargo_type":"Coal",
    "cargo_quantity":80000,
    "laycan_start":"2026-10-10",
    "laycan_end":"2026-10-20"
  }'
```

What-if:

```bash
curl -X POST http://127.0.0.1:8000/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "cargo_quantity":500000,
    "origin":"Australia",
    "destination":"Indonesia",
    "vessel_type":"Panamax",
    "coverage":70,
    "freight_change_pct":8,
    "bunker_change_pct":5,
    "congestion_change_days":0.5
  }'
```

FastAPI's Swagger interface should also be available at:

```text
http://127.0.0.1:8000/docs
```

---

# 15. MODEL TESTING

Before connecting a model to the frontend, run inference directly.

Example conceptual command:

```bash
python -m ml.inference.forecast \
  --origin Gladstone \
  --destination Dhamra \
  --vessel Panamax \
  --cargo 80000 \
  --laycan-start 2026-10-10 \
  --laycan-end 2026-10-20
```

Verify the model works independently of FastAPI.

Then test:

```text
Model inference → FastAPI → curl/Swagger → frontend
```

This isolates failures instead of debugging the entire stack simultaneously.

---

# 16. DATABASE TESTING

After creating the database:

1. Run migrations.
2. Load a small approved fixture dataset.
3. Confirm all tables exist.
4. Confirm indexes exist for time-series queries.
5. Confirm timestamps/time zones are consistent.
6. Run feature generation.
7. Confirm the model can retrieve the required feature rows.
8. Run the complete API tests.

Never let the browser connect directly to the database.

---

# 17. FRONTEND TESTING

Run:

```bash
npm test
```

and production build:

```bash
npm run build
```

Test every route:

```text
/
/market
/forecast
/vessels
/ports
/charter
/what-if
/risk
/data-quality
/models
/settings
```

Test:

- valid input
- missing input
- invalid input
- API timeout
- API 4xx
- API 5xx
- empty dataset
- model unavailable
- database unavailable
- malformed model response
- stale data
- unsupported vessel
- impossible port constraints

---

# 18. PRODUCTION MODEL READINESS

Do not deploy a model merely because it produces predictions.

Verify:

- time-aware train/validation/test split
- no look-ahead bias
- reproducible preprocessing
- feature versioning
- model versioning
- dataset versioning
- MAE/RMSE/MAPE/WAPE where appropriate
- uncertainty calibration
- route/vessel segmentation
- missing-value behavior
- outlier behavior
- drift monitoring
- model degradation monitoring
- SHAP/explainability
- inference latency
- failure behavior
- fallback behavior

Backtests must only use information that would have been available at the prediction timestamp.

---

# 19. SECURITY FOR LOCAL / GOVERNMENT DEPLOYMENT

- Keep `.env` out of source control.
- Never put database credentials in React.
- Never expose model files through `frontend/public`.
- Restrict CORS to trusted origins.
- Add authentication and RBAC before production use.
- Add audit logs for recommendations and changes.
- Record who requested a prediction.
- Record model/data/feature versions.
- Record recommendation inputs and outputs.
- Protect confidential datasets.
- Back up the database.
- Back up model artifacts.
- Use signed/versioned release bundles for air-gapped deployment.

---

# 20. THE SIMPLE ANSWER: WHERE DO I PUT MY MODEL?

If you only remember one section, remember this:

```text
freight-intelligence/
└── ml/
    └── models/
        └── forecasting/
            └── xgboost/
                └── YOUR_MODEL_VERSION/
                    ├── model file
                    ├── metadata.json
                    └── feature_schema.json
```

For example:

```text
ml/models/forecasting/xgboost/panamax_30d_v7/model.json
```

Then:

```text
ml/inference/forecast.py
```

loads it, performs preprocessing + inference, and FastAPI exposes the result.

**Do not change the frontend just because the model changes.** Keep the API response contract stable.

The supplied architecture was specifically designed so that real ML models can be dropped into `ml/models/...`, exposed through inference/FastAPI, and connected by changing API configuration rather than rebuilding the frontend. fileciteturn1file4L369-L409

---

# 21. FINAL DEPLOYMENT CHECKLIST

Before handing the system to users:

- [ ] Frontend runs locally without internet
- [ ] Backend runs locally without internet
- [ ] Database runs locally/internal
- [ ] Models load from `ml/models/`
- [ ] Preprocessing artifacts load correctly
- [ ] Forecast inference works independently
- [ ] Congestion inference works independently
- [ ] Vessel constraints work
- [ ] Optimization works
- [ ] Risk engine works
- [ ] FastAPI endpoints work
- [ ] Frontend receives live API responses
- [ ] Mock mode still works
- [ ] No browser runtime dependency on CDN resources
- [ ] No model files exposed to browser
- [ ] No database credentials in frontend
- [ ] Data lineage recorded
- [ ] Model version recorded
- [ ] Dataset version recorded
- [ ] Backtests pass
- [ ] Human-review disclaimer is present
- [ ] Audit logging is enabled before production#   F r e i g h t - s i h  
 