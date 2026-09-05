# 08 — REPO INTEGRATION MAP

This document exists so Raghav never has to guess where a file goes in the
real `Freight-sih` repo. Every path referenced elsewhere in this package
(`00_MASTER_IMPLEMENTATION_ROADMAP.md`, `04_API_IMPLEMENTATION_SPEC.md`,
`05_RAGHAV_EXECUTION_CHECKLIST.md`) has already been rewritten to the real
paths below — this file is the reference table those paths come from, and
the place to look if something doesn't match once you're inside the repo.

## What this is based on
The real repo (`github.com/Raghav-305/Freight-sih`) root contains:
`api/`, `backend/`, `data/`, `database/`, `docs/`, `frontend/`, `lib/`,
`migrations/`, `ml/`, `optimization/`, `public/`, `tests/`,
`.env.example`, `docker-compose.yml`, `seed.sql`, `README.md`,
`README_TO_FILL.md`. `README_TO_FILL.md` documents a canonical target
layout for the backend (`backend/app/{main.py, api/, schemas/, services/,
database/, dependencies/}`), an ML layer (`ml/models/`, `ml/inference/`,
`ml/registry/`), an `optimization/` package
(`vessel_selection.py`, `contract_optimizer.py`, `positioning.py`,
`scenario_engine.py`), and a `data/{raw,clean,processed,features}` layout.
The paths below target that canonical layout.

## ⚠️ One thing to confirm before you start (I could not verify this myself)
The repo root has **both** a top-level `api/` folder **and** a `backend/`
folder, and **both** a top-level `migrations/` folder **and** a
`database/migrations/` subfolder. `README_TO_FILL.md`'s canonical structure
only describes `backend/app/api/...` and `database/migrations/` — it
doesn't explain what the root-level `api/` and `migrations/` folders are
for (possibly earlier scaffolding, possibly something else in progress).
GitHub's automated-access rules blocked me from browsing file contents
inside these folders to check, so **Phase 0 of the master roadmap now
includes a step to resolve this before anything else**: open the repo
locally, check which of `api/` vs `backend/app/api/` (and `migrations/` vs
`database/migrations/`) is the one your existing `/forecast` and
`/what-if` endpoints actually live in, and treat that as the real target.
Every path below assumes `backend/app/...` and `database/migrations/` are
correct, per `README_TO_FILL.md` — if your repo turns out to route through
the root-level `api/` folder instead, substitute `api/` for `backend/app/api/`
everywhere below; nothing else in this package changes.

## Endpoint prefix — matched to your existing convention
Your existing endpoints are `POST /forecast` and `POST /what-if` — **no**
`/api` prefix. The reference implementation in this package used an
`/api/...` prefix throughout its own testing. Every endpoint path in this
package has been rewritten below to drop that prefix and match your
existing convention. Register each new router with no prefix (or with
whatever single shared prefix your `backend/app/main.py` already applies
to `/forecast`, if it applies one you can't see from the README alone).

## Field-naming note — reconcile before wiring the Command Center
Your existing forecast response contract (documented in `README_TO_FILL.md`)
returns:
```json
{ "forecast": { "7d": {"p10":..,"p50":..,"p90":..}, "30d": {...}, ... },
  "model_version": "...", "dataset_version": "...", "feature_version": "...",
  "shap": [] }
```
The reference implementation's `ForecastQuantiles` schema (used inside
Pillar 3's decision snapshot) instead expects a flat
`{p10, p50, p90, unit}`. When you wire a real decision snapshot from your
existing forecast endpoint, map one horizon's quantiles (pick whichever
horizon matches the charter decision's timeframe, e.g. `30d`) into that
flat shape rather than passing the whole nested `forecast` object through.
Do the same for `explanation_reference` — your existing `shap` array is
the input, `explanation_reference` is where it lands in the decision
snapshot.

---

## File-by-file mapping

### Pillar 4 — Port Operations (Phase 2)
| Reference implementation path | Real repo path |
|---|---|
| `app/models.py` (VesselSpec, EligibilityRequest, DelayExposureRequest, DemurrageRequest) | `backend/app/schemas/eligibility.py` |
| `app/services/eligibility.py` | `backend/app/services/eligibility.py` |
| `app/routers/eligibility.py` | `backend/app/api/eligibility.py` |
| Register router in | `backend/app/main.py` |
| `frontend_stubs/src/components/EligibilityMatrix.tsx` | `frontend/src/components/EligibilityMatrix.tsx` |
| `frontend_stubs/src/api.ts` additions | merge into `frontend/src/api.ts` (or your existing API client module) |
| `tests/test_eligibility.py` | `tests/test_eligibility.py` (repo already has a top-level `tests/`) |

Endpoints (no `/api` prefix): `POST /ports/eligibility`, `POST
/delay/exposure`, `POST /demurrage/estimate`.

### Pillar 3 — Governance (Phase 3)
| Reference implementation path | Real repo path |
|---|---|
| `app/models.py` (DecisionCreateRequest, DecisionActionRequest, ForecastQuantiles) | `backend/app/schemas/decisions.py` |
| `app/db.py` (decisions + audit tables) | `backend/app/database/decisions.py` — adapt to your existing DB session setup in `backend/app/database/` rather than a standalone sqlite3 connection; add the table creation as a migration under `database/migrations/` instead of an ad hoc `CREATE TABLE` at import time |
| `app/services/decisions.py` | `backend/app/services/decisions.py` |
| `app/services/audit.py` | `backend/app/services/audit.py` |
| `app/services/reports.py` | `backend/app/services/reports.py` |
| `app/routers/decisions.py` | `backend/app/api/decisions.py` |
| Register router in | `backend/app/main.py` |
| `frontend_stubs/src/components/AuditTimeline.tsx` | `frontend/src/components/AuditTimeline.tsx` |
| `tests/test_decisions.py`, `test_audit.py`, `test_reports.py` | `tests/` |

Endpoints (no `/api` prefix): `POST /decisions`, `POST
/decisions/{id}/analyse|submit|approve|return|reject`, `GET
/decisions/{id}`, `GET /decisions/{id}/audit`, `GET
/decisions/{id}/report`.

### Pillar 1 — Economics (Phase 4)
| Reference implementation path | Real repo path |
|---|---|
| `app/models.py` (CostBreakdown, ScenarioRequest, ScenarioCompareRequest, SensitivityRequest, BlendRequest) | `backend/app/schemas/scenarios.py` |
| `app/services/economics.py` | `backend/app/services/economics.py` |
| `app/routers/scenarios.py` | `backend/app/api/scenarios.py` |
| Register router in | `backend/app/main.py` |
| New frontend tab | `frontend/src/pages/ScenarioComparator.tsx` (matches the existing route-per-page convention implied by `/market`, `/forecast`, `/vessels` etc. in `README_TO_FILL.md`'s frontend test list — add `/scenarios` alongside them) |

Endpoints (no `/api` prefix): `POST /scenarios/evaluate`, `POST
/scenarios/compare`, `POST /scenarios/sensitivity`, `POST /blends/evaluate`.

### Pillar 2 — Maritime GIS (Phase 5, 6)
| Reference implementation path | Real repo path |
|---|---|
| Static reference files (`ports.geojson`, `corridors.geojson`, `chokepoints.geojson`, `port_constraints.json`) | `data/reference/` (new subfolder — your repo's `data/` already has `raw/clean/processed/features`; `reference/` sits alongside those for static, non-pipeline data) |
| `app/services/map_data.py` | `backend/app/services/map_data.py` |
| `app/routers/map.py` | `backend/app/api/map.py` |
| `app/adapters/imd_adapter.py` | `backend/app/services/imd_adapter.py` (your canonical layout has no `adapters/` folder — `services/` is the closest fit; rename only if you introduce an `adapters/` package deliberately) |
| Register router in | `backend/app/main.py` |
| `frontend_stubs/src/components/MapCanvas.tsx`, `FreshnessBadge.tsx` | `frontend/src/components/MapCanvas.tsx`, `frontend/src/components/FreshnessBadge.tsx` |
| `tests/test_map.py` | `tests/` |

Endpoints (no `/api` prefix): `GET /map/ports`, `/map/corridors`,
`/map/chokepoints`, `/map/hazards`, `/map/freshness`.

### Pillar 5 — Command Center (Phase 7)
| Reference implementation path | Real repo path |
|---|---|
| `app/routers/command_center.py` | `backend/app/api/command_center.py` |
| Register router in | `backend/app/main.py` |
| New frontend shell | `frontend/src/pages/CommandCenter.tsx`, composing the components already placed above |

Endpoint (no `/api` prefix): `GET /command-center/summary`.

### Shared / cross-cutting
| Reference implementation path | Real repo path |
|---|---|
| `requirements.txt` additions (reportlab, openpyxl) | merge into `backend/requirements.txt` |
| `data_templates/*` (this package's copies) | copy into `data/reference/` (see Pillar 2 row above) |
| `scripts/*.py` (this package's scripts) | can stay at repo root as `scripts/`, or wherever your repo keeps dev tooling — they're standalone and don't need to live inside `backend/` |

---

## Environment / mode note
Your repo already defines three modes (`mock` / `local live` /
`internal production`) via `VITE_API_MODE` and `VITE_API_BASE_URL`. None of
the five pillars need a new mode — they're new endpoints under the same
FastAPI app your existing `local live` mode already talks to. The one
place this matters: Pillar 2's mocked IMD hazard layer should report itself
consistently regardless of `VITE_API_MODE` — mock frontend mode and a
mocked backend hazard adapter are two independent things; don't let a
`live` frontend mode make the map's freshness badge imply the hazard
data is live when the backend adapter is still mocked.
