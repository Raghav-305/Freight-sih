# ML TEAM — WHAT TO PROVIDE AND WHERE TO PUT IT

This document is the hand-off guide for the person/team implementing the real forecasting, congestion, vessel, risk, SHAP and optimization layers.

## 1. Important architecture rule

Do NOT modify the dashboard to contain ML logic.

Use:

`User input → frontend → API → backend service → ML/optimization → API response → frontend`

The frontend only collects inputs and visualizes returned results.

---

## 2. Where each model/code belongs

Create/maintain this repository structure when the project is moved to the conventional Python repository:

```text
freight-intelligence/
├── ml/
│   ├── models/
│   │   ├── forecasting/
│   │   │   ├── xgboost/
│   │   │   ├── sarima/
│   │   │   └── ensemble/
│   │   ├── congestion/
│   │   └── idle_time/
│   ├── artifacts/
│   │   ├── forecasting/
│   │   ├── congestion/
│   │   └── explainability/
│   ├── preprocessing/
│   ├── features/
│   ├── inference/
│   ├── evaluation/
│   ├── explainability/
│   │   └── shap/
│   └── registry/
│
├── backend/
│   └── app/
│       ├── api/
│       ├── services/
│       ├── schemas/
│       └── database/
│
├── optimization/
│   ├── vessel_selection.py
│   ├── contract_optimizer.py
│   ├── positioning.py
│   └── scenario_engine.py
│
└── data/
    ├── raw/
    │   ├── baltic/
    │   ├── ais/
    │   ├── ports/
    │   ├── weather/
    │   └── commodities/
    ├── clean/
    ├── processed/
    ├── features/
    └── fixtures/
```

### Where to place trained model files

- XGBoost model → `ml/models/forecasting/xgboost/`
- SARIMA model → `ml/models/forecasting/sarima/`
- Ensemble configuration/model → `ml/models/forecasting/ensemble/`
- Congestion model → `ml/models/congestion/`
- Idle-time model → `ml/models/idle_time/`
- Serialized model artifacts → `ml/artifacts/`
- Feature/preprocessing artifacts → `ml/artifacts/` or the versioned preprocessing directory
- SHAP-related explainability code → `ml/explainability/shap/`

Do not expose model files to the browser.

---

# 3. What data the project needs

The original system specification requires these major data families:

| Data | Examples / purpose |
|---|---|
| Freight | historical route freight rates, fixtures, voyage economics |
| Baltic indices | BDI, BPI, BSI and related dry-bulk market indicators |
| Vessel | vessel class, DWT, LOA, beam, draft, speed, fuel consumption |
| AIS | vessel positions, movements, port calls and utilization signals |
| Ports | port identity, location, berths, loading/discharge capability |
| Port constraints | draft, LOA, beam, DWT and berth restrictions |
| Port congestion | queue, waiting time, utilization, historical P90 waiting |
| Weather | weather conditions and events affecting loading/transit |
| Commodities | coal/iron ore/grain prices and demand/import signals |
| Bunker | bunker prices and fuel economics |
| FFA | forward freight agreement market features |
| Fixtures | historical charter fixtures and transaction observations |
| Coal imports | destination/origin demand signals where applicable |
| Risk events | weather, geopolitical, supply, port and contract events |
| Route features | daily model-ready route feature dataset |

Never place confidential government/company data into Git or the public frontend.

---

# 4. Minimum forecast input

The forecast service should accept at least:

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

The model service may additionally require historical route features, market features, bunker, FFA, congestion, weather, commodity and vessel features.

Document every feature with unit, timestamp, source, refresh frequency and transformation.

---

# 5. Required forecast output

Return:

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
  "shap": [
    {"feature": "BPI", "impact": 0.78, "direction": "positive"}
  ]
}
```

Do not remove version metadata. It is required for reproducibility and auditability.

---

# 6. SHAP / explainability

The ML service should calculate SHAP or another approved feature-attribution method. The frontend should receive structured contributions such as:

`feature`, `impact`, `direction`.

The frontend must NOT calculate SHAP.

A recommendation should eventually be traceable to its input data, model version, major drivers, major risks, constraints and assumptions.

---

# 7. Congestion model

The congestion service should eventually predict expected waiting/congestion for relevant ports/routes and return timestamps, uncertainty where supported, model version and source metadata.

The output should be consumable by the economic engine and contract optimizer.

---

# 8. Vessel feasibility

Inputs should include cargo quantity/type, origin, destination, laycan and vessel information.

The constraint engine should check at least:

- cargo capacity
- DWT
- draft
- LOA
- beam
- port compatibility
- handling time
- other operational constraints defined by the domain team

Return PASS/FAIL plus the reason for each checked constraint.

The frontend only displays these results.

---

# 9. Optimization inputs

The optimizer needs:

- cargo demand
- period / laycan
- freight forecast
- vessel availability
- port constraints
- congestion
- bunker
- market risk
- supply risk
- contract options
- operational constraints

Supported strategy families should include spot, short-term, multi-voyage and COA.

Return allocation percentages, expected cost, baseline cost, expected saving, downside/upside where supported, risk, recommended strategy and fixing window.

---

# 10. How to test the whole system

## Test Case A — Forecast

Enter:

- Origin: Gladstone
- Destination: Dhamra
- Vessel: Panamax
- Cargo: Coal
- Quantity: 80,000 MT
- Laycan: 10 Oct 2026 – 20 Oct 2026

Click **Generate Forecast**.

Verify:

1. API receives all fields.
2. Forecast returns 7D/30D/60D/90D.
3. Each horizon contains P10/P50/P90.
4. Model version is returned.
5. Dataset and feature versions are returned.
6. SHAP contributions are returned.
7. Dashboard renders without a frontend calculation.

## Test Case B — Vessel recommendation

Use the same cargo/route.

Expected demo behavior:

- Panamax → PASS / preferred
- Supramax → PASS / alternative
- Capesize → FAIL where draft/port constraints are incompatible
- Handysize → FAIL where capacity is insufficient

For live testing, verify every PASS/FAIL against the actual constraint-engine response.

## Test Case C — Port check

Input:

```json
{
  "port": "Dhamra",
  "vessel_type": "Panamax",
  "cargo_quantity": 80000
}
```

Verify draft, LOA, beam, DWT and congestion results are returned.

## Test Case D — Charter recommendation

Input:

- Cargo: 480,000 MT
- Origin: Australia
- Destination: Dhamra
- Period: Oct 2026 – Mar 2027

Verify that the optimizer returns a strategy and allocation rather than the frontend calculating it.

## Test Case E — What-if

Start with:

- Cargo: 400,000 MT
- Origin: Australia
- Destination: Indonesia
- Vessel: Panamax
- Coverage: 60%

Change cargo to 500,000 MT and recalculate.

Verify the response contains:

- baseline
- scenario
- freight difference
- forecast difference
- vessel recommendation
- contract strategy
- expected cost
- expected saving
- risk
- congestion
- waiting
- spot exposure
- decision impact

## Test Case F — Risk

Load `/api/risk` and verify category scores plus event-driven alerts. Confirm severity, affected route/region, expected impact, source and last-updated metadata.

## Test Case G — Data quality

Load `/api/data-quality` and verify every dataset has missing %, duplicate %, invalid values, timestamp and quality status.

## Test Case H — Model performance

Load `/api/models` and verify model names, performance metrics and version/status metadata. Backtests must use historical information available at the prediction timestamp; prevent look-ahead bias.

---

# 11. API-level testing examples

With a conventional FastAPI deployment, test using Swagger at `/docs` or an API client.

### Forecast

```bash
curl -X POST http://localhost:8000/forecast \
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

### What-if

```bash
curl -X POST http://localhost:8000/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "cargo_quantity":500000,
    "origin":"Australia",
    "destination":"Indonesia",
    "vessel_type":"Panamax",
    "coverage":60
  }'
```

The exact live base URL depends on deployment. Do not hard-code production URLs into the frontend.

---

# 12. End-to-end testing order

Run tests in this order:

`Data → Features → Forecast → Congestion → Economic Engine → Constraints → Vessel Ranking → FOS → Optimization → Risk → API → Frontend`

If a downstream result is wrong, first inspect the earliest failed layer rather than patching the frontend.

---

# 13. Before calling a model production-ready

Verify:

- no look-ahead bias
- train/validation/test separation
- time-aware backtesting
- missing-data handling
- outlier handling
- feature versioning
- model versioning
- reproducible preprocessing
- calibration / uncertainty evaluation
- MAE/RMSE/MAPE/WAPE reporting where appropriate
- route/vessel segmentation where justified
- monitoring for data drift
- monitoring for model degradation
- explainability output
- failure/fallback behavior

Never claim guaranteed savings or 100% accuracy.

---

# 14. Final integration rule

When the real model is ready, the normal change should be:

`model artifact + inference implementation + backend service + API contract`

NOT:

`rewrite React frontend`.

If the API contract remains stable, the existing decision-support interface can consume the real outputs directly.