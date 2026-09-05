# 05 — RAGHAV EXECUTION CHECKLIST

Checkbox list, same order as `00_MASTER_IMPLEMENTATION_ROADMAP.md`. Work
top to bottom. Don't skip Phase 0. Every path below is a real path in
`github.com/Raghav-305/Freight-sih` — see `08_REPO_INTEGRATION_MAP.md` if
anything doesn't match what you find in the repo.

## Phase 0 — Baseline
- [ ] Existing Freight-sih repo cloned/pulled, on a feature branch
- [ ] Frontend `npm install && npm run dev` starts clean
- [ ] Backend starts clean, `/docs` shows existing routes
- [ ] Existing `/forecast` and `/what-if` endpoints return real responses
- [ ] DB connection confirmed
- [ ] Resolved whether live routers are under `backend/app/api/` or the
      root-level `api/` folder, and whether migrations are under
      `database/migrations/` or the root-level `migrations/` — confirmed
      which one is real (see `08_REPO_INTEGRATION_MAP.md`)

## Phase 1 — Data layer
- [ ] Create `data/reference/` folder (sibling to `data/raw`, `data/clean`, etc.)
- [ ] Copy `data_templates/geojson/ports.geojson` into it
- [ ] Copy `data_templates/geojson/corridors.geojson` into it
- [ ] Copy `data_templates/geojson/chokepoints.geojson` into it
- [ ] Copy `data_templates/port_constraints.example.json` in as `port_constraints.json`
- [ ] Run `scripts/verify_data_schema.py --data-dir data/reference` — all pass
- [ ] Confirm `port_constraints.json` contains ONLY Paradip records

## Phase 2 — Pillar 4: Port Operations
- [ ] Copy `EligibilityRequest`/`DelayExposureRequest`/`DemurrageRequest`/`VesselSpec` models into `backend/app/schemas/eligibility.py`
- [ ] Copy `backend/app/services/eligibility.py`, update `DATA_PATH` to `data/reference/`
- [ ] Copy `backend/app/api/eligibility.py`, register in `backend/app/main.py`
- [ ] `POST /ports/eligibility` returns correct status for known Paradip berths
- [ ] `POST /ports/eligibility` returns `UNKNOWN` for an unlisted port
- [ ] `POST /delay/exposure` and `POST /demurrage/estimate` return correct math
- [ ] Copy `frontend/src/components/EligibilityMatrix.tsx`, wire to `checkEligibility()` in `frontend/src/api.ts`
- [ ] `INELIGIBLE`/`ELIGIBLE_WITH_CONDITION` visually distinct from `ELIGIBLE` (not color-only)
- [ ] Copy `tests/test_eligibility.py` into repo's `tests/`, `pytest tests/test_eligibility.py -v` passes against merged code

## Phase 3 — Pillar 3: Governance
- [ ] Copy `DecisionCreateRequest`/`DecisionActionRequest`/`ForecastQuantiles` into `backend/app/schemas/decisions.py`
- [ ] Create `decisions` table + audit events table as a migration in `database/migrations/` (adapt the schema from `reference_implementation/app/db.py` to your existing SQLAlchemy/Postgres-or-MySQL setup, in `backend/app/database/decisions.py`)
- [ ] Copy `backend/app/services/decisions.py` (state machine)
- [ ] Copy `backend/app/services/audit.py` (hash chain + `verify_chain()`)
- [ ] Copy `backend/app/services/reports.py` (PDF via reportlab, XLSX via openpyxl)
- [ ] Copy `backend/app/api/decisions.py`, register in `backend/app/main.py`
- [ ] Create a decision, walk it DRAFT→ANALYSED→SUBMITTED_FOR_REVIEW→APPROVED
- [ ] Confirm self-approval is blocked (`actor == created_by` on approve → 409)
- [ ] Confirm return/reject without a reason is rejected
- [ ] Confirm submitted payload cannot be mutated
- [ ] Confirm `verify_chain()` detects a tampered event
- [ ] Download a PDF report, confirm all 10 sections present, section 5 says "Not computed" if no SHAP wired
- [ ] Add the exact decision-support-only banner text to the UI shell
- [ ] Copy `frontend/src/components/AuditTimeline.tsx`, wire to `GET /decisions/{id}/audit`
- [ ] Copy `test_decisions.py`, `test_audit.py`, `test_reports.py` into `tests/`, `pytest tests/test_decisions.py tests/test_audit.py tests/test_reports.py -v` passes

## Phase 4 — Pillar 1: Economics
- [ ] Copy `CostBreakdown`/`ScenarioRequest`/`ScenarioCompareRequest`/`SensitivityRequest`/`BlendRequest` into `backend/app/schemas/scenarios.py`
- [ ] Copy `backend/app/services/economics.py`
- [ ] Copy `backend/app/api/scenarios.py`, register in `backend/app/main.py`
- [ ] `POST /scenarios/evaluate` — missing GCV disables cost_per_gj with a warning, doesn't error
- [ ] `POST /scenarios/compare` — ranking metric always shown next to rank
- [ ] `POST /blends/evaluate` — weighted average math correct
- [ ] Build `frontend/src/pages/ScenarioComparator.tsx` (new `/scenarios` route)
- [ ] Build Assumptions drawer
- [ ] UI never shows "USD/GCV" — always "USD/GJ" with conversion factor stated
- [ ] (P1) `POST /scenarios/sensitivity` wired, sensitivity heatmap built after baseline confirmed correct
- [ ] Copy `test_economics.py` into `tests/`, `pytest tests/test_economics.py -v` passes

## Phase 5 — Pillar 2: Static GIS
- [ ] Copy `backend/app/services/map_data.py`
- [ ] Copy `backend/app/api/map.py` (ports/corridors/chokepoints routes only for now), register in `backend/app/main.py`
- [ ] Copy `frontend/src/components/MapCanvas.tsx`, wire to `getPorts()`/`getCorridors()`/`getChokepoints()`
- [ ] Ports, corridors, chokepoints render on the map
- [ ] Layers toggle independently
- [ ] Copy `frontend/src/components/FreshnessBadge.tsx`, every layer shows its truth class
- [ ] Turn off Wi-Fi, confirm static layers still render
- [ ] Copy `test_map.py` into `tests/`, `pytest tests/test_map.py -v` passes

## Phase 6 — Pillar 2: Live IMD adapter (optional / time-permitting)
- [ ] Obtain IMD API credential (if pursuing this)
- [ ] Fill in the real HTTP call in `backend/app/services/imd_adapter.py::fetch()`
- [ ] Confirm normalized response shape matches the mock's shape
- [ ] Confirm hazard status only ever says `LIVE` when the real call succeeded
- [ ] If not pursuing: confirm `IMD_LIVE=0` and hazard UI clearly says MOCKED/DEMO

## Phase 7 — Pillar 5: Command Center
- [ ] Copy `backend/app/api/command_center.py`, register in `backend/app/main.py`
- [ ] `GET /command-center/summary` returns correct decision counts + map freshness
- [ ] Build `frontend/src/pages/CommandCenter.tsx` shell with the seven tabs
- [ ] Executive Overview tab: blocking constraint → recommendation → financial impact → risk → uncertainty → provenance, in that order, above the fold
- [ ] Vessel Eligibility tab reuses Pillar 4's `EligibilityMatrix`
- [ ] Maritime Geospatial tab reuses Pillar 2's `MapCanvas`
- [ ] Audit Log tab reuses Pillar 3's `AuditTimeline`
- [ ] Freight Forecasting tab shows existing model output — map its nested `forecast`/`shap` shape per `08_REPO_INTEGRATION_MAP.md`
- [ ] Chartering Portfolio tab shows existing optimizer output (P1)
- [ ] KPIs support drill-down (value/unit/source/observed_at/confidence)
- [ ] Uncertainty bands visually distinct from point forecasts
- [ ] Stale data visibly flagged, never hidden

## Phase 8 — Integration
- [ ] Existing repo's own tests still pass
- [ ] Full `pytest tests/ -v` (21 reference tests + existing repo tests) passes against merged code
- [ ] Create a decision → Command Center overview count updates
- [ ] Approve a decision → status count moves correctly

## Phase 9 — Demo prep
- [ ] Walk `06_FINAL_DEMO_FLOW.md` end to end at least twice
- [ ] Rehearse the Wi-Fi-off map moment
- [ ] Rehearse the self-approval-blocked moment
- [ ] Rehearse answers in `research/supporting/JURY_JUDGE_QA.md`
