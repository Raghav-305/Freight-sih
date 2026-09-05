# 11_REFERENCE_IMPLEMENTATION

This is a **working, tested** implementation of the API contracts described
in `01_.._05_PILLAR_*/IMPLEMENTATION_SPEC.md`. It is not a finished product —
it is the scaffold Raghav builds the real command center on top of, so the
5 pillars stop being a Word-doc description and start being code he can run,
test, and extend today.

Nothing here goes beyond the 5 pillars. `app/main.py` wires exactly 5 router
groups; there is no 6th feature area (see `10_FINAL_QA/QUALITY_GATE.md`).

## What's real vs. what's a placeholder

| Area | Status |
|---|---|
| Pillar 1 economics (landed cost, GJ normalization, blend, sensitivity) | Real, fully implemented, unit-tested |
| Pillar 2 static GIS layers (ports/corridors/chokepoints) | Real GeoJSON, served offline-safe |
| Pillar 2 IMD hazard adapter | **Mocked** (`IMD_LIVE=0` by default) — fetch()/normalize()/validate()/cache() pipeline is real, the live HTTP call is a `TODO(Raghav)` because there's no IMD credential in this sandbox |
| Pillar 3 governance workflow + audit hash chain | Real, fully implemented, unit-tested |
| Pillar 3 PDF/XLSX tender report | Real, generates actual files from the frozen decision snapshot |
| Pillar 4 berth eligibility | Real, uses the actual Paradip berth data from `06_READY_DATA/port_constraints.json` — **no other port has real data**, adding one is an UNKNOWN, never a fabricated ELIGIBLE |
| Pillar 4 delay exposure / demurrage | Real formulas, kept as two distinct endpoints on purpose |
| Pillar 5 command-center summary | Real, aggregates server-side from the SQLite decision table + map freshness |
| Frontend (`frontend_stubs/`) | Real, working React/TypeScript components wired to every endpoint below — not a full app, drop into Raghav's existing shell |

## Quickstart

```bash
cd 11_REFERENCE_IMPLEMENTATION
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt

# run the test suite (21 tests, mapped to 08_RAGHAV_HANDOFF/TEST_PLAN.md)
python3 -m pytest tests/ -v

# run the API
uvicorn app.main:app --reload
# -> docs at http://localhost:8000/docs
# -> health check at http://localhost:8000/health
```

Frontend stubs are plain `.tsx` files with one dependency list
(`frontend_stubs/package.json`). Copy the ones you need into the real
frontend project; they all import from `../api` which is `src/api.ts` in
the same folder — a single typed fetch client covering every endpoint.

## Endpoint map (matches IMPLEMENTATION_SPEC.md files exactly)

**Pillar 1 — `app/routers/scenarios.py`**
- `POST /api/scenarios/evaluate`
- `POST /api/scenarios/compare`
- `POST /api/scenarios/sensitivity`
- `POST /api/blends/evaluate`

**Pillar 2 — `app/routers/map.py`**
- `GET /api/map/ports` / `/corridors` / `/chokepoints` (static, offline-safe)
- `GET /api/map/hazards` (adapter-backed, mocked)
- `GET /api/map/freshness`

**Pillar 3 — `app/routers/decisions.py`**
- `POST /api/decisions`
- `POST /api/decisions/{id}/analyse|submit|approve|return|reject`
- `GET /api/decisions/{id}` / `/audit` / `/report?format=pdf|xlsx`

**Pillar 4 — `app/routers/eligibility.py`**
- `POST /api/ports/eligibility`
- `POST /api/delay/exposure`
- `POST /api/demurrage/estimate`

**Pillar 5 — `app/routers/command_center.py`**
- `GET /api/command-center/summary`

## Known gaps for Raghav to close (deliberately left open, not hidden)

1. **IMD live wiring** — `app/adapters/imd_adapter.py`, function `fetch()`, has
   a marked `TODO`. Everything downstream (normalize/validate/cache/freshness)
   already works against the mock and will work unchanged against a real
   response, provided the real response is normalized to the same shape.
2. **Only Paradip has real berth data.** Do not invent Haldia/Dhamra/Vizag
   numbers to make the demo look more complete — that's explicitly the
   mistake `06_READY_DATA/README.md` warns against. Add real records only
   after pulling them from the port authority's published berth
   specifications (see `SOURCE_REGISTER.csv`).
3. **SHAP explainability** — the report generator has a real section 5, but
   it will correctly print "Not computed for this decision" until an actual
   forecasting model with SHAP output is wired in and its `explanation_reference`
   is passed into `DecisionCreateRequest`. Don't fake this field.
4. **Auth/roles** — `actor`/`role` on every governance action are currently
   free-text strings supplied by the caller. Before this goes anywhere near
   real approvals, wire it to real authenticated users so `self-approval
   blocked` actually means something.
5. **Postgres migration** — `app/db.py` is intentionally plain sqlite3 so the
   schema is easy to read; swap the connection layer, not the schema, when
   moving to Postgres.
