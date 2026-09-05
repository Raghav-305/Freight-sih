# 00 — MASTER IMPLEMENTATION ROADMAP

**Read this file first. It is self-contained.** Everything else in this package
is backup detail — research evidence, raw contracts, working code — that this
roadmap points to when you need it. You should not have to open ten documents
to know what to do next.

Owner: Raghav. Codebase: `github.com/Raghav-305/Freight-sih` (React+TS+Vite
frontend, FastAPI backend, PostgreSQL/MySQL via SQLAlchemy, existing
forecasting/optimization modules). This roadmap adds five feature pillars
on top of that repo for SIH 2026 (PS 26006 — Ministry of Steel/SAIL,
freight forecasting and vessel chartering for coal to India's East Coast).

**Every path below is a real path in that repo**, not a placeholder —
`backend/app/api/...`, `backend/app/services/...`, `backend/app/schemas/...`,
`data/reference/...`, matching the canonical layout your own repo's
`README_TO_FILL.md` already documents. See
`08_REPO_INTEGRATION_MAP.md` for the full reference-implementation-path →
real-repo-path table and two things worth resolving early: a folder-naming
ambiguity in your repo root, and one field-naming mismatch between this
package's decision snapshot and your existing forecast response shape.

---

## SECTION 1 — PROJECT CONTEXT

**What Freight-SIH currently does.** The existing repo forecasts freight
rates and optimizes vessel chartering/bulk cargo procurement decisions. It
does not yet expose *why* a recommendation is safe to act on: whether the
vessel physically fits the berth, whether the economics are normalized in a
way a coal buyer would trust, whether the decision is auditable, or whether
the map data being shown is live, static, or simulated.

**Strategic objective of the five pillars.** Each pillar closes one specific
credibility gap a government hackathon jury will probe:

1. **Policy & Economics** — ties the product's cost comparisons to actual
   published NLP/Sagarmala/coal-policy objectives, and fixes the ambiguous
   "cost per GCV" framing with a physically normalized cost-per-energy metric.
2. **Maritime GIS** — shows chokepoints, corridors, and hazards without ever
   claiming simulated or static data is live traffic.
3. **Governance (CVC/GFR)** — turns "decision support system" from a banner
   into an enforced workflow: draft → approve, with a tamper-evident audit
   trail and a real evidence report.
4. **Port Operations** — makes vessel-berth eligibility berth-level and
   conditional (tide-dependent), not a single fictional "port max draft."
5. **Command Center** — the surface that ties all four together into one
   coherent judge-facing story instead of four disconnected screens.

**Why this improves the project for a national-level jury.** SIH judges for
a Ministry of Steel/SAIL problem statement will specifically probe: (a) does
the tool respect procurement rules (CVC/GFR) instead of auto-deciding, (b) is
underlying data real or fabricated, (c) does the economics hold up
technically (energy-normalized coal costing is a real technical detail that
signals domain understanding), (d) is the recommendation physically
realistic (can this vessel even berth). These five pillars answer all four
directly, and the honesty discipline below (SOURCE FACT vs ENGINEERING
INFERENCE vs PROJECT DEMO DATA) is itself a defensible design position under
questioning — see `research/pillar_*/DEEP_RESEARCH.md` and the jury Q&A
material at `research/supporting/JURY_JUDGE_QA.md`.

**How the five pillars fit the existing product.** They are additive
services and UI modules, not a rewrite:
- Pillar 1 (economics) sits **beside** the existing forecasting model — it
  does not replace it. It adds a scenario/comparison layer that consumes
  cost inputs, independent of how the freight-rate forecast is produced.
- Pillar 4 (eligibility) is a **precondition check** the optimizer/UI should
  call before presenting a vessel/route as viable.
- Pillar 3 (governance) **wraps** whatever the model/optimizer outputs into
  an immutable, approvable decision record — it does not change the model.
- Pillar 2 (GIS) is a **new visualization module** with its own static data
  and an optional live hazard adapter.
- Pillar 5 (command center) is the **integration shell** — a UI surface that
  aggregates 1–4 through one server-side summary endpoint.

**Non-negotiable rule carried through this whole package** (see
`research/*/DEEP_RESEARCH.md` for the source reasoning): never blur official
live data, static reference data, model output, user input, and demo
simulation. Every pillar's UI must show which of these five "truth classes"
a number belongs to. This is a design constraint, not decoration — judges
will ask "is that live?" and the honest answer must be visible on screen, not
just known internally.

---

## SECTION 2 — FINAL PRODUCT ARCHITECTURE

```
Frontend (existing React+TS+Vite app)
   |
   |-- Command Center shell           [Pillar 5]  — new top-level view
   |     |-- Executive Overview & KPIs
   |     |-- Freight Forecasting & Explanation   (existing model, displayed here)
   |     |-- Chartering Portfolio: Spot vs COA   (existing optimizer, displayed here)
   |     |-- Vessel Eligibility & Port Constraints  [Pillar 4]
   |     |-- Maritime Geospatial Visualizer         [Pillar 2]
   |     |-- Data Quality & Pipeline Lineage
   |     |-- Audit Log & Approval Workflow          [Pillar 3]
   |
   |-- Scenario Comparator module     [Pillar 1]  — new, standalone tab +
   |                                                 embedded in Command Center
   |-- GIS Module (MapCanvas, LayerControl,
   |    FreshnessBadge, RiskLegend)   [Pillar 2]
   |-- Eligibility Matrix module      [Pillar 4]
   |-- Governance module (DecisionActionRequest
        forms, AuditTimeline, ApprovalPanel)  [Pillar 3]

Backend (existing FastAPI app — backend/app/)
   |
   |-- backend/app/api/           (existing routers, forecasting/optimization — UNCHANGED)
   |-- backend/app/api/scenarios.py       -- POST /scenarios/*, /blends/*   [Pillar 1]
   |-- backend/app/api/map.py             -- GET  /map/*                    [Pillar 2]
   |-- backend/app/api/eligibility.py     -- POST /ports/eligibility,
   |                                         /delay/exposure,
   |                                         /demurrage/estimate            [Pillar 4]
   |-- backend/app/api/decisions.py       -- /decisions/*                   [Pillar 3]
   |-- backend/app/api/command_center.py  -- GET  /command-center/summary   [Pillar 5,
   |                                         aggregates 1-4 server-side]
   |-- backend/app/services/: economics.py, eligibility.py,
        decisions.py, audit.py, reports.py, map_data.py, imd_adapter.py

(No `/api` prefix on any of the above — matches your existing `/forecast`,
`/what-if` convention. Full path mapping in `08_REPO_INTEGRATION_MAP.md`.)

Data Layer
   |
   |-- Existing datasets (freight rates, whatever the forecasting model uses — UNCHANGED)
   |-- Static reference datasets: ports.geojson, corridors.geojson,
   |     chokepoints.geojson, port_constraints.json    [Pillar 2 + 4]
   |-- SQLite/Postgres `decisions` table + audit event table  [Pillar 3]
   |-- Public/official feeds: IMD hazard API (adapter-based, optional)  [Pillar 2]

ML Layer
   |
   |-- Existing forecasting model (UNCHANGED — Pillar 1/5 only consume its
   |     output as forecast_quantiles, they do not modify it)
   |-- New: pure-formula economics calculations (no ML) — landed cost,
   |     energy normalization, blend cost, sensitivity grid    [Pillar 1]
   |-- Explainability: pass-through only. If the existing model produces
        SHAP values, `explanation_reference` carries them into the decision
        snapshot and report. If it doesn't yet, the report correctly prints
        "Not computed for this decision" — never fabricate driver values.
```

**Where every new feature connects:** the Command Center (Pillar 5) is the
only place a judge needs to look. It calls `/command-center/summary` for
system-wide status, and drills into the pillar-specific endpoints
(`/scenarios/*`, `/map/*`, `/ports/eligibility`, `/decisions/*`) for detail.
The existing forecasting/optimization APIs are consumed as data *inputs*
into Pillar 1 and Pillar 3 (as part of the frozen decision snapshot) — they
are not re-implemented. **Note:** your existing forecast endpoint returns a
nested `{"forecast": {"7d": {...}, "30d": {...}}, "shap": [...]}` shape, not
a flat `{p10,p50,p90}` — see `08_REPO_INTEGRATION_MAP.md` for exactly how to
map one horizon of that into Pillar 3's `ForecastQuantiles` field.

---

## SECTION 3 — IMPLEMENTATION ORDER

This order is deliberate and comes from the original research's own
integration-order notes (preserved at
`research/supporting/ORIGINAL_INTEGRATION_ORDER.md`) and from the constraint
that a working
reference implementation already exists for Steps 1–4 and 6 below (see
`reference_implementation/`, mocked/static data, all 21 tests passing). You
are not building from zero — you are integrating tested code into the real
repo and wiring the one deliberately-open gap (live IMD data) if time
permits.

### PHASE 0 — Verify existing repository
**Objective:** confirm the current Freight-sih repo runs before touching it,
and resolve one structural ambiguity before any new file gets added.
**Tasks:**
- `git clone` / pull latest, confirm frontend (`npm install && npm run dev`)
  and backend (existing FastAPI app) both start cleanly.
- Confirm existing forecasting/optimization endpoints respond
  (`POST /forecast`, `POST /what-if` per the repo's own README).
- Confirm DB connection (PostgreSQL/MySQL via SQLAlchemy) works.
- **Resolve the folder ambiguity:** the repo root has both a top-level
  `api/` folder and a `backend/` folder, and both a top-level `migrations/`
  folder and a `database/migrations/` subfolder. Open `backend/app/main.py`
  (or wherever `/forecast` is actually registered) and confirm whether the
  live routers live under `backend/app/api/` or the root-level `api/`.
  Every path in this roadmap and in `08_REPO_INTEGRATION_MAP.md` assumes
  `backend/app/api/` and `database/migrations/` — if your repo turns out to
  route through the root-level `api/`/`migrations/` folders instead,
  substitute those in every phase below; nothing else changes.
**Validation checklist:**
- [ ] Frontend dev server starts, existing pages load
- [ ] Backend `/docs` (Swagger) loads and shows existing routes
- [ ] Existing `/forecast` and `/what-if` endpoints return real responses
- [ ] Confirmed which of `api/` vs `backend/app/api/` (and `migrations/` vs
      `database/migrations/`) is the real, live one
**Do not proceed to Phase 1 until this is green.**

### PHASE 1 — Build the required data layer
**Objective:** get the static reference data used by Pillars 2 and 4 into
the repo, verified against schema.
**Files to add** (copy from `data_templates/`, already provided and
verified) — your repo already has a `data/` folder with `raw/clean/
processed/features`; add a sibling `reference/` subfolder for this static,
non-pipeline data:
- `data/reference/ports.geojson`
- `data/reference/corridors.geojson`
- `data/reference/chokepoints.geojson`
- `data/reference/port_constraints.json`
**Tasks:**
- Copy the four files above from this package's `data_templates/` into
  `data/reference/` in the real repo.
- Point `DATA_PATH` in `backend/app/services/eligibility.py` and
  `backend/app/services/map_data.py` at this `data/reference/` folder once
  those files are created in Phase 2/5 — use a path relative to the repo
  root (e.g. resolved from an existing settings/config module if one
  exists in `backend/app/`) rather than a hard-coded absolute path.
- Run `scripts/verify_data_schema.py --data-dir data/reference` (see
  `scripts/README.md`) to confirm they match `03_DATA_CONTRACTS.md` before
  writing any code against them.
**Validation checklist:**
- [ ] All four files present under `data/reference/` and pass
      `verify_data_schema.py`
- [ ] `port_constraints.json` contains only PARADIP records — do not add
      Haldia/Dhamra/Vizag numbers you have not personally sourced and dated
**Expected output:** a `data/reference/` folder your backend can read from
disk, with no network dependency.

### PHASE 2 — Pillar 4: Port Operations & Demurrage Engine
**Objective:** physical eligibility must exist before anything else
recommends a vessel/route, so the optimizer never proposes something
physically impossible.
**Why first:** per `research/pillar_4_port_operations` — this is the
credibility floor. Everything downstream (economics comparisons, governance
snapshots, the command center) is more convincing once "can this vessel
actually berth here" is answered honestly, including with `UNKNOWN` when
data is missing.
**Backend tasks:**
- Add `backend/app/schemas/eligibility.py`: `VesselSpec`,
  `EligibilityRequest`, `DelayExposureRequest`, `DemurrageRequest` (copy
  directly from `reference_implementation/app/models.py` — field names are
  already spec-matched).
- Add `backend/app/services/eligibility.py` (copy from
  `reference_implementation/app/services/eligibility.py`) — implements
  `evaluate()`, `delay_exposure()`, `demurrage_estimate()`. Update
  `DATA_PATH` to point at `data/reference/` from Phase 1.
- Add `backend/app/api/eligibility.py` (copy from
  `reference_implementation/app/routers/eligibility.py`) and register it in
  `backend/app/main.py` alongside your existing routers. No `/api` prefix —
  match your existing `/forecast` convention.
**Endpoints added:**
  - `POST /ports/eligibility`
  - `POST /delay/exposure`
  - `POST /demurrage/estimate`
  (full request/response shapes in `04_API_IMPLEMENTATION_SPEC.md`)
**Frontend tasks:**
- Add `frontend/src/components/EligibilityMatrix.tsx` (copy from
  `reference_implementation/frontend_stubs/src/components/EligibilityMatrix.tsx`,
  wire to `checkEligibility()` merged into your existing
  `frontend/src/api.ts`).
- Surface eligibility status prominently — `INELIGIBLE` and
  `ELIGIBLE_WITH_CONDITION` must never be visually indistinguishable from
  `ELIGIBLE`. Do not rely on color alone (per Pillar 5 UI rule) — always show
  the status word.
**Data required:** `port_constraints.json` (Phase 1). Real data exists only
for **Paradip** (3 berths: New Coal Import Berth, Coal Berth-01, Coal
Berth-02 — sourced from paradipport.gov.in, verified 2026-02-23). Any other
port/berth returns `UNKNOWN`, which is correct — do not fabricate limits for
Haldia, Dhamra, or Vizag.
**Mock vs real:** eligibility logic is real and mandatory (P0). Delay
exposure and demurrage formulas are real and mandatory (P0) — they are pure
arithmetic on inputs your existing forecasting model or the user already
supplies.
**Testing:** copy `reference_implementation/tests/test_eligibility.py` into
your repo's existing `tests/` folder and run it (pytest) against your
merged code — 5 assertions already written: Paradip
berth examples produce expected states, missing vessel dimension → UNKNOWN,
delay exposure ≠ contractual demurrage, LOA over limit → INELIGIBLE, draft
within conditional limit → ELIGIBLE_WITH_CONDITION.
**Demo scenario:** feed a vessel with `draft_m: 15.5` against Paradip
Coal Berth-01 (`base_max_draft_m: 14.5`, `conditional_draft_m: 16.0`) → show
it return `ELIGIBLE_WITH_CONDITION` with reason `DRAFT_EXCEEDS_BASE_LIMIT_WITHIN_CONDITIONAL_LIMIT`.
Then feed a vessel with `draft_m: 17` → show `INELIGIBLE`. Then feed a vessel
against a port with no data → show `UNKNOWN`, not a guessed pass.

### PHASE 3 — Pillar 3: Governance & Audit Trail
**Objective:** every decision the product produces from here on must be
capturable as an immutable, approvable, auditable record — build this
scaffolding before Pillar 1's economics results need somewhere trustworthy
to land.
**Backend tasks:**
- Add `backend/app/schemas/decisions.py`: `DecisionCreateRequest`,
  `DecisionActionRequest`, `ForecastQuantiles` (copy from reference). Note
  the `ForecastQuantiles` field-mapping caveat in
  `08_REPO_INTEGRATION_MAP.md` — your existing forecast response is a
  nested `{"forecast": {"7d": {...}}}` shape, not this flat one.
- Add `backend/app/database/decisions.py` — decisions table
  (`decision_id`, `analysis_version`, `status`, `input_hash`,
  `payload_json`, timestamps, `created_by`) and an audit events table. Copy
  the schema from `reference_implementation/app/db.py`, but wire it through
  your existing SQLAlchemy session setup in `backend/app/database/` instead
  of a standalone sqlite3 connection, and add the table creation as a
  migration under `database/migrations/` rather than an ad hoc `CREATE
  TABLE` at import time.
- Add `backend/app/services/decisions.py` — state machine:
  `DRAFT → ANALYSED → SUBMITTED_FOR_REVIEW → APPROVED | RETURNED | REJECTED`.
  Enforces: frozen snapshot after submission, reason required on
  return/reject, self-approval blocked (`actor == created_by` check).
- Add `backend/app/services/audit.py` — SHA-256 hash chain
  (`event.current_hash = SHA256(previous_hash + canonical_event_payload)`),
  with a working `verify_chain()`.
- Add `backend/app/services/reports.py` — PDF (reportlab) and XLSX
  (openpyxl) generation from a frozen decision snapshot, 10 required
  sections (listed in `research/pillar_3_governance/DEEP_RESEARCH.md`).
  Section 5 (explanation/SHAP) must print "Not computed for this decision"
  if no real explainability output is wired in — never fabricate driver
  values.
- Add `backend/app/api/decisions.py` (copy from
  `reference_implementation/app/routers/decisions.py`) — 8 endpoints, no
  `/api` prefix, listed in `04_API_IMPLEMENTATION_SPEC.md`.
**Frontend tasks:**
- Add governance action forms (submit/approve/return/reject), each
  requiring `actor`/`role`/optional `reason`.
- Add `frontend/src/components/AuditTimeline.tsx` (copy from reference
  frontend stub).
- Add a persistent banner: *"Decision-Support System Only. Final chartering
  or procurement action requires review and approval by an authorized
  officer under the applicable delegation and procurement framework."*
  This exact wording — do not paraphrase it into a claim of compliance.
**Mandatory for MVP:** the full DRAFT→APPROVED workflow, the audit hash
chain, and PDF report generation. Auth/RBAC is explicitly **not** required
for the hackathon — `actor`/`role` stay free-text strings, flagged as a known
gap (see `reference_implementation/README.md` gap #4). Do not attempt to
build real authentication in the time available.
**Testing:** copy `reference_implementation/tests/test_decisions.py`,
`test_audit.py`, `test_reports.py` into your repo's `tests/` folder and run
them — covers illegal transitions rejected,
self-approval blocked, submitted snapshot immutable, audit chain tamering
detected, report reproduces the frozen snapshot.
**Demo scenario:** create a decision → submit → attempt self-approval (show
it blocked) → have a second "actor" approve → download the PDF report and
show its section 5 correctly says "Not computed" unless you've wired a real
SHAP output → open the audit trail and show the hash chain.

### PHASE 4 — Pillar 1: Policy Alignment & Economics
**Objective:** add the scenario/comparison economics layer beside — not
inside — the existing forecasting model.
**Backend tasks:**
- Add `backend/app/schemas/scenarios.py`: `CostBreakdown`,
  `ScenarioRequest`, `ScenarioCompareRequest`, `SensitivityRequest`,
  `BlendRequest` (copy from reference — field names match the spec
  exactly).
- Add `backend/app/services/economics.py` — implements the four formulas:
  - `LandedCostPerTonne = commodity+freight+insurance+port+handling+inland+other`
  - `EnergyGJPerTonne = GCV_kcal_per_kg × 0.004184`
  - `CostPerGJ = LandedCostPerTonne / EnergyGJPerTonne` (disabled with a
    warning if GCV is missing — never silently divide by zero or omit units)
  - `BlendCost/GCV/Ash = x·Imported + (1-x)·Domestic`
  - Sensitivity grid: Freight ±10%, FX ±5% (proxy), Port ±20%, GCV ±5%,
    Waiting days 0/P50/P90 — implemented as independent single-factor shocks
    (not a full cross-product), which keeps the output a readable table.
- Add `backend/app/api/scenarios.py` (copy from
  `reference_implementation/app/routers/scenarios.py`) — 4 endpoints, no
  `/api` prefix: `POST /scenarios/evaluate`, `/scenarios/compare`,
  `/scenarios/sensitivity`, `/blends/evaluate`.
**Critical correction to carry into UI copy:** never label anything
"USD/GCV" — it's an ambiguous unit. Use **USD/GJ**, always shown with the
energy conversion factor stated (`1 kcal/kg = 0.004184 GJ/tonne`).
**Frontend tasks:**
- Add `frontend/src/pages/ScenarioComparator.tsx` — a new route (`/scenarios`)
  alongside your existing `/market`, `/forecast`, `/vessels` pages: side-by-side IMPORT vs COASTAL
  scenarios, cost breakdown, cost-per-GJ, and an "Assumptions" drawer
  showing exactly which inputs were used and which were missing.
- Add a sensitivity heatmap/table — build this only after the baseline
  formulas pass tests (do not build the visual before the numbers are
  right).
- Never label any scenario "best" without showing the ranking metric next
  to it (`ranked_by` field is already in the API response for this reason).
**Data required:** user-entered cost inputs (commodity, freight, insurance,
port, handling, inland, other), GCV in kcal/kg, optional ash/moisture. No
external data source is required for the core calculator — it is
arithmetic on user/optimizer-supplied numbers. If you want to pre-fill
realistic defaults, Ministry of Coal's Coal Directory 2024–25
(coal.gov.in/major-statistics/coal-statistics) is the reference source for
historical coal statistics — use it only as background/reference values, not
as a live feed.
**Mandatory for MVP:** `evaluate`, `compare`, `blend`. Sensitivity grid is
P1 (strongly recommended, not blocking).
**Testing:** copy `reference_implementation/tests/test_economics.py` into
`tests/` and run it — zero/
negative GCV rejected, missing GCV disables cost-per-GJ with a warning
(not silently omitted), sensitivity shocks change the result correctly,
blend math is a correct weighted average.
**Demo scenario:** run one IMPORT and one COASTAL scenario with the same
cargo, show the ranked comparison, open the Assumptions drawer, then toggle
the sensitivity grid to show how a −10% freight shock changes the ranking.

### PHASE 5 — Pillar 2: Maritime GIS, static layers first
**Objective:** get the offline-safe map working before attempting any live
hazard integration.
**Backend tasks:**
- Add `backend/app/services/map_data.py` — serves the four static
  GeoJSON/JSON layers from `data/reference/` on disk
  (`get_layer("ports"|"corridors"|"chokepoints")`) plus a
  `freshness_summary()` helper.
- Add `backend/app/api/map.py` (copy from
  `reference_implementation/app/routers/map.py`) — `GET /map/ports`,
  `/map/corridors`, `/map/chokepoints` (static, must work with no network
  call), plus `/map/hazards` and `/map/freshness` (see Phase 6). No `/api`
  prefix.
**Frontend tasks:**
- Add `frontend/src/components/MapCanvas.tsx` using **MapLibre GL JS**
  (open-source, no API key). Copy from
  `reference_implementation/frontend_stubs/src/components/MapCanvas.tsx`.
- Render ports, reference corridors, chokepoints as three toggleable layers.
- Add `frontend/src/components/FreshnessBadge.tsx` — every dynamic layer
  must show its truth class (`STATIC_REFERENCE`, `OFFICIAL_PERIODIC`,
  `MODEL_OUTPUT`, `USER_INPUT`, `DEMO_SIMULATION`) and last-updated
  timestamp.
**Data required:** `ports.geojson`, `corridors.geojson`,
`chokepoints.geojson` (copied to `data/reference/` in Phase 1, `STATIC_
REFERENCE` truth class — coordinates are approximate anchors for rendering,
not navigational data).
**Mandatory for MVP:** static layers rendering, offline. This alone is
enough for a strong demo — do not treat live hazard data as blocking.
**Testing:** copy `reference_implementation/tests/test_map.py` into
`tests/` and run it — confirms
static layers return valid GeoJSON structure and the freshness summary
shape is correct.
**Acceptance criteria (per original spec):**
- [ ] Route/corridor layer renders
- [ ] Chokepoints render
- [ ] Layers can be toggled independently
- [ ] Application still works with Wi-Fi off (static layers only)

### PHASE 6 — Pillar 2: live hazard adapter (optional, time-permitting)
**Objective:** wire IMD's official hazard/cyclone API if time and credentials
allow. This is the one deliberately incomplete piece of the reference
implementation — do this last and treat it as stretch.
**Backend tasks:**
- Add `backend/app/services/imd_adapter.py` (copy from
  `reference_implementation/app/adapters/imd_adapter.py` — your repo's
  canonical layout has no separate `adapters/` package, so `services/` is
  the closest fit unless you deliberately introduce one). It already
  implements the full pipeline — `fetch() → normalize() →
  validate_timestamp() → cache() → return_with_freshness()` — against a
  mock. The only `TODO(Raghav)` is the real HTTP call inside `fetch()`.
- If you obtain IMD API access (api.imd.gov.in/public/api_reference.html),
  fill in the real request, keeping the response normalized to the same
  shape the mock already returns — everything downstream (caching,
  freshness labelling, the `/map/hazards` and `/map/freshness` endpoints)
  works unchanged.
- If you do **not** get IMD access before the deadline: leave `IMD_LIVE=0`.
  The mock output must display as `MOCKED`/`DEMO_SIMULATION`, never as
  `LIVE` — this is enforced by the truth-class labelling rule, not optional
  polish, and matters independently of whatever `VITE_API_MODE` the
  frontend is running in (see `08_REPO_INTEGRATION_MAP.md`).
**Mandatory for MVP:** No. This is P2 (nice-to-have). The static layers from
Phase 5 already satisfy the GIS pillar's demo requirement.
**Testing:** confirm a failed/absent live request never gets silently
relabelled as LIVE — this is the one test that matters here.

### PHASE 7 — Pillar 5: Command Center integration
**Objective:** build the single judge-facing surface last, once Pillars
1–4's APIs are stable — this is explicitly the correct order (per
`research/pillar_5_command_center`) because an attractive dashboard built
before the underlying checks exist risks showing a UI that looks complete
but recommends physically or procedurally impossible actions.
**Backend tasks:**
- Add `backend/app/api/command_center.py` (copy from
  `reference_implementation/app/routers/command_center.py`) — a single
  `GET /command-center/summary` endpoint (no `/api` prefix) that aggregates:
  decision case counts by status (from Pillar 3's DB), pending-review
  count, map freshness (from Pillar 2's hazard adapter status). This
  endpoint must stay cheap/read-only — it reports counts and freshness, not
  full payloads; the frontend drills into pillar-specific endpoints for
  detail. Do not let the frontend orchestrate multiple unrelated calls
  itself.
**Frontend tasks:**
- Build `frontend/src/pages/CommandCenter.tsx` — the shell with the seven
  tabs listed in Section 2, composing the components already added in
  Phases 2, 3, and 5.
- Enforce the above-the-fold order from `research/pillar_5_command_center`:
  1) blocking constraint → 2) recommended action/scenario rank →
  3) financial impact → 4) risk → 5) uncertainty →
  6) provenance/freshness. Charts and KPIs come after this, not before.
- Every KPI must support drill-down showing: value, unit, source,
  observed_at, transformation, model/version, confidence/uncertainty.
- Uncertainty bands must be visually distinct from point forecasts. Stale
  data must be visibly flagged, never silently hidden. Conditional
  eligibility gets a distinct semantic state, never color-only.
**Mandatory for MVP:** the summary endpoint, the Overview tab, and enough
of the other six tabs to walk the demo flow in `06_FINAL_DEMO_FLOW.md`.
Full polish on all seven tabs is P1, not P0.
**Testing:** manual — the P5 test items are UI-behavioural (stale indicator
visible, blocked eligibility visible above the fold, provenance drill-down
reachable). Cover these once components are integrated into the real shell;
there is no automated test for this phase in the reference implementation.

### PHASE 8 — Integration & regression pass
**Objective:** confirm the five new modules and the existing
forecasting/optimization features work together without either side
breaking the other.
**Tasks:**
- Re-run existing repo's tests (whatever exists today) — confirm nothing in
  Phases 1–7 broke the existing forecasting/optimization endpoints.
- Run the full `reference_implementation/tests/` suite one more time after
  merge (21 tests, `pytest tests/ -v`).
- Confirm the Command Center's `/summary` endpoint reflects real state
  changes end-to-end: create a decision in Pillar 3, watch its count appear
  in the Command Center overview.
**Validation checklist:**
- [ ] All 21 reference tests pass against merged code
- [ ] Existing forecasting/optimization endpoints still respond correctly
- [ ] Command Center summary updates when a decision is created/approved

### PHASE 9 — Demo preparation
**Objective:** rehearse the exact click-by-click flow before the jury.
See `06_FINAL_DEMO_FLOW.md` for the full script. Practice the "Wi-Fi off"
moment (Phase 5's offline map) and the "self-approval blocked" moment
(Phase 3) — these are the two strongest credibility beats and both need to
be rehearsed, not improvised.

---

## Summary table: phase → pillar → mandatory for MVP?

| Phase | Pillar | Mandatory (P0) | Reference code exists? |
|---|---|---|---|
| 0 | — (baseline) | Yes | — |
| 1 | Data layer (2+4) | Yes | Yes — `data_templates/` |
| 2 | Pillar 4 Port Ops | Yes | Yes — real, tested |
| 3 | Pillar 3 Governance | Yes | Yes — real, tested |
| 4 | Pillar 1 Economics | Yes | Yes — real, tested |
| 5 | Pillar 2 GIS static | Yes | Yes — real, tested |
| 6 | Pillar 2 GIS live IMD | No (P2) | Partial — mocked, TODO marked |
| 7 | Pillar 5 Command Center | Yes (core), P1 (full polish) | Yes — real, endpoint tested |
| 8 | Integration | Yes | — |
| 9 | Demo prep | Yes | — |

See `02_FEATURE_PRIORITY_MATRIX.md` for the feature-level breakdown behind
this table.
