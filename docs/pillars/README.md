# Freight-SIH — 5 Pillars Implementation Handoff

## START HERE

1. Open **`00_MASTER_IMPLEMENTATION_ROADMAP.md`**. Read it top to bottom.
   It is the single document you need — everything else here is backup
   detail it points to. Every file/endpoint path in it is a real path in
   `github.com/Raghav-305/Freight-sih`, not a placeholder.
2. Skim **`08_REPO_INTEGRATION_MAP.md`** once — it has the full
   reference-implementation-path → real-repo-path table, plus two things
   worth resolving on day one: a folder-naming ambiguity in your repo root
   (both `api/` and `backend/` exist at top level) and a field-naming
   mismatch between this package's decision snapshot and your existing
   forecast response shape.
3. Skim **`02_FEATURE_PRIORITY_MATRIX.md`** so you know what's P0 vs
   P1/P2 before you start cutting scope under time pressure.
4. Work through **`05_RAGHAV_EXECUTION_CHECKLIST.md`** phase by phase as
   you build.
5. Rehearse **`06_FINAL_DEMO_FLOW.md`** before presenting.

---

## 1. What is inside this package?
A reorganized, developer-ready handoff for five feature pillars (Policy &
Economics, Maritime GIS, CVC/GFR Governance, Port Operations, Command
Center) to add to the existing Freight-sih repo — plus a **working, tested
reference implementation** (FastAPI backend + React/TS frontend components,
21 passing tests) you integrate rather than build from zero.

## 2. What should I read first?
`00_MASTER_IMPLEMENTATION_ROADMAP.md`. It's self-contained: project context,
final architecture, and a 10-phase sequential build plan with exact files
to copy, endpoints to register, and validation checklists.

## 3. What should Raghav implement first?
Phase 1 (data layer) then Phase 2 (Pillar 4 — port/vessel eligibility).
Physical feasibility comes before economics or governance because nothing
downstream should recommend a vessel that can't actually berth. Full
reasoning and file-level steps are in the master roadmap's Phase 2 section.

## 4. Which files contain the actual roadmap?
- `00_MASTER_IMPLEMENTATION_ROADMAP.md` — the roadmap itself
- `01_EXECUTIVE_SUMMARY.md` — one-page version
- `02_FEATURE_PRIORITY_MATRIX.md` — what's mandatory vs optional, per feature
- `03_DATA_CONTRACTS.md` — every dataset's schema
- `04_API_IMPLEMENTATION_SPEC.md` — every endpoint's request/response shape
- `05_RAGHAV_EXECUTION_CHECKLIST.md` — checkbox version of the roadmap
- `06_FINAL_DEMO_FLOW.md` — click-by-click jury demo script
- `07_RESEARCH_SOURCES.md` — every official source cited, flat index
- `08_REPO_INTEGRATION_MAP.md` — reference-implementation-path → real-repo-path table
- `QUALITY_AUDIT.md` — what was fixed, what's still open, top risks

## 5. Which files contain scripts?
`scripts/` — five real, tested scripts (schema validation, port-data sanity
checks, demo-data generation, a demurrage calculator CLI, and a source-URL
reachability checker). See `scripts/README.md` for what each one does and
how to run it. None are placeholders — all were executed against the data
in this package before packaging.

## 6. Which features are mandatory?
Every row marked **P0** in `02_FEATURE_PRIORITY_MATRIX.md`. In short: berth
eligibility with honest UNKNOWN states, the full governance workflow with
self-approval blocking and a PDF report, energy-normalized (USD/GJ)
scenario comparison, the static offline-safe GIS layers, and a Command
Center overview tying them together.

## 7. Which features can be skipped if time is limited?
Everything marked **P1**/**P2**: live IMD hazard data, the sensitivity
heatmap visualization (build the math first, the chart is optional
polish), port coverage beyond Paradip, and full drill-down on every KPI.
See `02_FEATURE_PRIORITY_MATRIX.md` for the complete list with reasoning.

---

## Package layout
```
00-07_*.md                    ← the 8 master documents, read in order
research/pillar_1_policy/     ← original deep research + spec, Pillar 1
research/pillar_2_maritime_gis/
research/pillar_3_governance/
research/pillar_4_port_operations/
research/pillar_5_command_center/
research/00_source_evidence/  ← evidence synthesis + full source register
research/supporting/          ← jury Q&A, 3-minute script, quality gate,
                                  original test plan/integration order
scripts/                      ← 5 real, tested scripts + README
data_templates/                ← real static reference data (Paradip berths,
                                  ports/corridors/chokepoints GeoJSON) —
                                  copy into data/reference/ in the real repo
reference_implementation/     ← working, tested FastAPI backend +
                                  React/TS frontend components
08_REPO_INTEGRATION_MAP.md    ← exact file path mapping into the real repo
QUALITY_AUDIT.md              ← self-audit: what was fixed, what's open, risks
```

## The one rule that governs everything in this package
Never blur official/live data, static reference data, model output, user
input, and demo simulation. Every number the product shows must be
traceable to one of those five truth classes. This is not a UI nicety — it
is the core credibility argument for a CVC/GFR-aware, government-hackathon
jury, and it is enforced in the reference implementation's code, not just
described in the docs.
