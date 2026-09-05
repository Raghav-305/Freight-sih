# 04 — API IMPLEMENTATION SPEC

Every endpoint below is **already implemented and tested** in
`reference_implementation/`. This document is the contract reference —
copy the request/response shapes exactly when wiring your frontend, or copy
the router/service files directly (recommended, see
`00_MASTER_IMPLEMENTATION_ROADMAP.md` for which files to copy in which
phase).

All responses that produce a calculation follow a common envelope:
```json
{
  "result": { ... },
  "assumptions": { ... },
  "warnings": [ "..." ],
  "model_or_formula_version": "economics-v1"
}
```
This is intentional — the UI's "Assumptions drawer" (Pillar 1) and warning
badges throughout the Command Center read directly from this envelope. Do
not strip it down to just `result` when wiring the frontend.

---

## Pillar 1 — `backend/app/api/scenarios.py` (no prefix — matches your existing `/forecast` convention)

### `POST /scenarios/evaluate`
**Purpose:** compute landed cost and (if GCV supplied) energy-normalized
cost for one scenario.

Request:
```json
{
  "scenario_type": "IMPORT",
  "label": "Indonesian coal via Paradip",
  "costs": {
    "commodity": 0, "freight": 0, "insurance": 0,
    "port": 0, "handling": 0, "inland": 0, "other": 0
  },
  "gcv_kcal_per_kg": null,
  "quality": { "ash_pct": null, "moisture_pct": null },
  "metadata": { "currency": "USD", "observed_at": "2026-02-20T00:00:00Z" }
}
```
Response:
```json
{
  "result": {
    "label": "Indonesian coal via Paradip",
    "scenario_type": "IMPORT",
    "landed_cost_per_tonne": 0.0,
    "currency": "USD",
    "energy_gj_per_tonne": null,
    "cost_per_gj": null
  },
  "assumptions": { "cost_components_included": [], "cost_components_missing_or_zero": [], "energy_conversion_factor": "1 kcal/kg = 0.004184 GJ/tonne", "observed_at": "2026-02-20T00:00:00Z" },
  "input_provenance": { "source_type": "USER_INPUT", "observed_at": "2026-02-20T00:00:00Z" },
  "warnings": ["GCV not supplied: cost_per_gj disabled (definition-of-done rule)."],
  "model_or_formula_version": "economics-v1"
}
```
Error responses: 422 (Pydantic validation — e.g. `gcv_kcal_per_kg <= 0`).

Frontend usage: `evaluateScenario(body)` in `frontend/src/api.ts`. Backend service flow:
`backend/app/api/scenarios.py::evaluate` → `backend/app/services/economics.py::evaluate_scenario`.

### `POST /scenarios/compare`
Request: `{ "scenarios": [ <ScenarioRequest>, <ScenarioRequest>, ... ] }` (min 1)
Response: `result` is a list of evaluated scenarios each carrying `rank` and
`ranked_by` — ranked by `cost_per_gj` only if every scenario supplied GCV,
otherwise falls back to `landed_cost_per_tonne` with a warning explaining
why. Never labels anything "best" silently.

### `POST /scenarios/sensitivity`
Request:
```json
{
  "scenario": { "...ScenarioRequest..." },
  "waiting_days_p50": 2.5,
  "waiting_days_p90": 5.0,
  "daily_charter_hire_rate": 15000
}
```
Response `result` contains `cost_rows` (BASE + Freight ±10% + FX ±5% proxy +
Port ±20%), `gcv_rows` (GCV ±5%, only if GCV supplied), and
`waiting_day_rows` (P50/P90 delay-exposure estimates, only if
`daily_charter_hire_rate` supplied). This is a single-factor shock grid, not
a full cross-product — documented in `assumptions.cross_product: false`.

### `POST /blends/evaluate`
Request: `domestic`/`imported` (each a full `ScenarioRequest`),
`domestic_gcv_kcal_per_kg`, `imported_gcv_kcal_per_kg`, optional ash
percentages, `import_fraction` (0–1).
Response `result`: `blend_landed_cost_per_tonne`, `blend_gcv_kcal_per_kg`,
`blend_energy_gj_per_tonne`, `blend_cost_per_gj`, optional `blend_ash_pct`.

---

## Pillar 2 — `backend/app/api/map.py` (prefix `/map`)

### `GET /map/ports` | `/corridors` | `/chokepoints`
No request body. Returns the raw GeoJSON `FeatureCollection` from disk
(`backend/app/services/map_data.py::get_layer(name)`). Must work with zero network
calls — this is the offline-safe layer.

### `GET /map/hazards`
No request body. Returns `backend/app/services/imd_adapter.py::return_with_freshness()`
— currently mocked (`IMD_LIVE=0` by default). Response includes a `status`
field (`"MOCKED"` or `"LIVE"`) and `last_success_at`. **Never** let this
field say `LIVE` unless a genuine live HTTP call succeeded.

### `GET /map/freshness`
No request body. Aggregates hazard adapter status into a freshness summary
object: `{ "truth_class": ..., "status": ..., "last_success_at": ... }`.

Error responses: hazard adapter failure returns a defined failure state
(status `"FAILED"`), never silently falls back to stale-labelled-as-live
data.

Frontend usage: `getPorts()`, `getCorridors()`, `getChokepoints()`,
`getHazards()`, `getMapFreshness()` in `frontend/src/api.ts`. Rule from
`research/pillar_2_maritime_gis/IMPLEMENTATION_SPEC.md`: do not place network calls directly inside map
components — always go through `frontend/src/api.ts`.

---

## Pillar 4 — `backend/app/api/eligibility.py` (no prefix)

### `POST /ports/eligibility`
Request:
```json
{
  "vessel": { "loa_m": 295, "beam_m": 44, "draft_m": 15.5, "commodity": "Thermal Coal" },
  "port_id": "PARADIP",
  "berth_id": null,
  "commodity": null
}
```
Response:
```json
{
  "status": "ELIGIBLE_WITH_CONDITION",
  "reasons": ["DRAFT_EXCEEDS_BASE_LIMIT_WITHIN_CONDITIONAL_LIMIT"],
  "checks": [ { "berth_id": "BERTH_05", "berth_name": "Coal Berth-01", "status": "ELIGIBLE_WITH_CONDITION", "reasons": [...] } ],
  "evidence": [ { "berth_id": "BERTH_05", "source_url": "https://paradipport.gov.in/berth-specifications/", "verified_reference": "2026-02-23" } ],
  "warnings": [],
  "freshness": { "source": "STATIC_REFERENCE", "note": "Seed data -- verify against live port notice before ops." }
}
```
Status values: `ELIGIBLE`, `ELIGIBLE_WITH_CONDITION`, `INELIGIBLE`,
`UNKNOWN`. `UNKNOWN` occurs when vessel dimensions are missing or no
constraint record exists for the port/berth/commodity combination — never
force `UNKNOWN` into `ELIGIBLE`. When multiple berths match, the evaluator
returns the **most permissive** matching result but keeps every berth's
individual reasoning in `checks[]` for transparency.

### `POST /delay/exposure`
Request: `waiting_days_p10`, `waiting_days_p50`, `waiting_days_p90`,
`daily_charter_hire_rate_usd` (> 0).
Response `result`: `delay_exposure_low_p10_usd`, `_base_p50_usd`,
`_high_p90_usd`. Always carries the warning: *"This is a modelled
delay-cost estimate, NOT contractual demurrage. Use /demurrage/estimate for
that."*

### `POST /demurrage/estimate`
Request: `actual_or_forecast_port_time_days`, `allowed_laytime_days`,
`contract_rate_usd_per_day`.
Response `result`: `excess_days = max(0, port_time - allowed_laytime)`,
`contractual_demurrage_usd = excess_days * contract_rate`.

Frontend usage: `checkEligibility()`, `delayExposure()` (and equivalent for
demurrage) in `frontend/src/api.ts`.

---

## Pillar 3 — `backend/app/api/decisions.py` (prefix `/decisions`)

### `POST /decisions`
Request (`DecisionCreateRequest`): `cargo_description`, `scenario_snapshot`
(dict — embed the Pillar 1 scenario result), `eligibility_snapshot` (dict —
embed the Pillar 4 eligibility result), optional `forecast_quantiles`
(`p10`/`p50`/`p90`/`unit`), optional `explanation_reference`, optional
`route_risk_snapshot`, `source_versions` (dict), `created_by`,
`created_by_role`.
Response: the created decision object, status `DRAFT`, with `input_hash`
(SHA-256 of the canonicalized payload) and `analysis_version: 1`.

### `POST /decisions/{id}/analyse` | `/submit` | `/approve` | `/return` | `/reject`
Request (`DecisionActionRequest`): `actor`, `role`, optional `reason`.
Allowed transitions:
```
DRAFT → ANALYSED → SUBMITTED_FOR_REVIEW → APPROVED | RETURNED | REJECTED
RETURNED → ANALYSED (new analysis_version)
```
Rules enforced server-side: illegal transitions raise `409` with
`ILLEGAL_TRANSITION:<from>-><to>`; `return`/`reject` require a `reason`
(`409 REASON_REQUIRED` if missing); `approve` blocks self-approval when
`actor == created_by` (`409 SELF_APPROVAL_BLOCKED`); every transition
appends a hash-chained audit event.

### `GET /decisions/{id}`
Returns the decision with `payload` (the full frozen snapshot) parsed out.
`404`-equivalent: raises `DecisionError("DECISION_NOT_FOUND")` → `409` via
the router's error handler (adjust to `404` if you prefer stricter HTTP
semantics when merging).

### `GET /decisions/{id}/audit`
Returns `{ "chain": [...events...], "verification": <bool or detail> }`
from `backend/app/services/audit.py::get_chain()` / `verify_chain()`.

### `GET /decisions/{id}/report?format=pdf|xlsx`
Returns a binary file response (`application/pdf` or the XLSX MIME type)
built from the frozen snapshot via `backend/app/services/reports.py`. `format`
values outside `pdf`/`xlsx` return `400`.

---

## Pillar 5 — `backend/app/api/command_center.py` (prefix `/command-center`)

### `GET /command-center/summary`
No request body. Response:
```json
{
  "system_health": "OK",
  "decision_cases_by_status": { "DRAFT": 1, "SUBMITTED_FOR_REVIEW": 2 },
  "pending_review_count": 2,
  "map_freshness": { "truth_class": "...", "status": "...", "last_success_at": "..." },
  "notes": [
    "Values are only labelled LIVE when a genuine live feed is connected (see hazard adapter status).",
    "Drill into /decisions/{id} or /map/* for full evidence, not this summary."
  ]
}
```
This endpoint is intentionally cheap and read-only — counts and freshness
only. The frontend should drill into the pillar-specific endpoints above for
full payloads, not ask this endpoint to return everything.

---

## Backend service flow (for every pillar)
Router (`backend/app/api/*.py`) → Pydantic request model
(`backend/app/schemas/*.py`) → service function
(`backend/app/services/*.py`, pure logic, no FastAPI imports) → response
dict (matching the envelope above). This separation is why the reference
tests can test services directly without spinning up the HTTP layer — keep
it when you merge into your repo. See `08_REPO_INTEGRATION_MAP.md` for the
exact file-by-file mapping.
