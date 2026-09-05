# QUALITY AUDIT

Self-audit of this reorganized handoff package, performed as if I were
Raghav opening it cold.

## The test: "Can I open 00_MASTER_IMPLEMENTATION_ROADMAP.md and know exactly
what to do tomorrow morning?"
Yes. It states what exists (a working, tested reference implementation for
4 of 5 pillars plus the command-center endpoint), what order to integrate it
in, which files to copy, which endpoints to register, and what "done" looks
like for each phase, with a validation checklist per phase.

## What was fixed from the original package
- **Single entry point.** The original dossier spread implementation
  guidance across `08_RAGHAV_HANDOFF/INTEGRATION_ORDER.md`,
  `11_REFERENCE_IMPLEMENTATION/README.md`, and five separate
  `IMPLEMENTATION_SPEC.md` files, with no single document tying them into
  a sequenced, file-level plan. `00_MASTER_IMPLEMENTATION_ROADMAP.md` now
  does that, with exact files to copy/create per phase.
- **Flat, numbered top-level structure** (`00_`–`07_` plus `research/`,
  `scripts/`, `data_templates/`, `reference_implementation/`) replacing the
  original's 12 top-level numbered folders, several of which existed only
  to hold one file.
- **Data contract mismatch caught and corrected.** While building the
  schema-validation script, I found the original `06_READY_DATA/README.md`
  didn't specify a field-level schema at all, and my first draft of
  `03_DATA_CONTRACTS.md` assumed a generic `type`/`truth_class` shape that
  didn't match the actual shipped GeoJSON (which uses `role` for ports,
  `type` for corridors, `category` for chokepoints, and carries no
  `truth_class` property in the raw file). Both the contract doc and
  `scripts/verify_data_schema.py` were corrected to match the real files
  rather than forcing invented fields onto them. `verify_data_schema.py`
  now passes cleanly against the shipped data.
- **Actually useful scripts added**, tested against the real shipped data
  (`verify_data_schema.py`, `validate_port_data.py`,
  `generate_sample_data.py`, `calculate_demurrage.py`,
  `check_source_urls.py`) — none are placeholders; all were executed during
  this pass and their output is shown in `scripts/README.md`.
- **A demo-data auto-downloader was deliberately not built** — see
  "Reasoning" in `scripts/README.md`. Building a scraper against
  ministry/port-authority HTML would be a fake convenience that breaks the
  first time a page's layout changes; manual verification with a dated
  `verified_reference` field is the honest approach and is what the
  original research already used for the one real dataset (Paradip berths).

## What remains implementation-dependent
- Where exactly to mount the new routers/services inside Raghav's actual
  existing FastAPI app structure — I don't have that repo's current file
  layout, so `00_MASTER_IMPLEMENTATION_ROADMAP.md` describes what to add and
  where it goes *relative to the reference implementation's own structure*,
  and flags that `main.py` registration and `DATA_PATH` constants need
  adjusting to match the real repo.
- Whether the existing forecasting/optimization model already outputs
  P10/P50/P90 quantiles and/or SHAP values in a form that can be passed
  directly into `forecast_quantiles`/`explanation_reference` — if not, that
  wiring is separate work not covered by this package (the report generator
  is already built to degrade gracefully to "Not computed" either way).
- Postgres/MySQL migration for the decisions/audit schema (currently plain
  sqlite3 in `reference_implementation/app/db.py` by design, per
  `reference_implementation/README.md` gap #5) into
  `backend/app/database/decisions.py` + a `database/migrations/` migration
  — schema is portable, the connection layer is not.
- **New in this pass:** now that the real repo structure is known (see
  `08_REPO_INTEGRATION_MAP.md`), every generic path in this package has been
  rewritten to a real repo path, and the endpoint prefix was changed from
  `/api/...` to match the existing `/forecast`, `/what-if` convention (no
  prefix). One genuine unresolved ambiguity remains and is flagged in
  Phase 0 of the roadmap: the repo root has both an `api/` folder and a
  `backend/` folder, and both a `migrations/` folder and a
  `database/migrations/` folder — GitHub's automated-access rules blocked
  browsing file contents to determine which pair is actually live, so
  Raghav needs to confirm this himself as the very first step.

## Assumptions made
- The reference implementation's own claim of "21/21 tests passing" and a
  successful live smoke test (stated in the original package's
  `CHANGELOG_V2.md`) was **not independently re-verified in this pass** —
  this sandbox has no network access to `pip install` FastAPI/pytest/etc.
  I did manually trace the logic in `economics.py`, `eligibility.py`, and
  `decisions.py` line by line and independently reimplemented the two
  Pillar-4 formulas in `scripts/calculate_demurrage.py`, and both traces
  are internally consistent with the documented formulas and test-plan
  items in `08_RAGHAV_HANDOFF`/`TEST_PLAN.md`-equivalent content (now in
  `research/`). Before relying on this for the actual hackathon, run
  `pip install -r reference_implementation/requirements.txt && pytest
  reference_implementation/tests/ -v` yourself and confirm 21/21 locally.
- Only Paradip has verifiably real, sourced berth data in this package —
  treated as fact throughout, per the original research's own explicit
  warning against fabricating Haldia/Dhamra/Vizag numbers.
- All 15 source URLs in the register were treated as correct as originally
  compiled; `scripts/check_source_urls.py` is provided so Raghav can
  re-verify reachability from an environment with real network access
  before the hackathon (this sandbox's network is disabled, so I could not
  confirm reachability here — the script's output above shows the expected
  "unreachable" result in a no-network environment, not a claim that the
  URLs are actually dead).

## Top 10 highest-value implementation tasks
1. Copy and register Pillar 4 (eligibility) — everything downstream depends
   on this existing first.
2. Copy and register Pillar 3 (governance/audit/reports) — gives every
   later result somewhere trustworthy to land.
3. Copy and register Pillar 1 (economics) — the core USD/GJ comparison
   engine.
4. Wire the static Pillar 2 GIS layers (offline-safe map) — high visual
   payoff for low effort.
5. Build the Command Center's Executive Overview tab with the correct
   above-the-fold ordering.
6. Re-run the full reference test suite (21 tests) against merged code —
   do this in your own environment with network access, immediately after
   each phase, not just at the end.
7. Rehearse the self-approval-blocked moment (Phase 3) — it's a concrete,
   specific thing to show a judge, not a claim.
8. Rehearse the Wi-Fi-off map moment (Phase 5) — same reasoning.
9. Run `scripts/check_source_urls.py` from a networked machine before the
   final demo to catch any dead policy/port-authority links.
10. Decide explicitly whether to attempt live IMD wiring (Phase 6) or skip
    it — either is fine, but decide deliberately rather than running out of
    time mid-attempt with the map's live layer half-wired.

## Biggest technical risks
- **Merging the reference implementation's DB schema into an existing
  PostgreSQL/MySQL-backed repo** without breaking existing migrations —
  the reference uses plain sqlite3 for readability; swapping the
  connection layer needs care around transaction handling, not just a
  driver swap.
- **Treating mocked IMD data as live** if the `IMD_LIVE` flag or an
  equivalent isn't checked carefully during the Command Center integration
  — this is the single most damaging thing that could happen in front of a
  jury, given how central the "never blur truth classes" rule is to this
  entire package's credibility argument.
- **Time pressure pushing someone to add fabricated port/berth data**
  for ports beyond Paradip to make the eligibility demo look more complete
  — explicitly warned against twice in the original research and once more
  here; `UNKNOWN` is the correct and more defensible answer.
- **Skipping the self-approval-blocked and reason-required checks** under
  time pressure during Phase 3, since they're easy to stub out — these are
  exactly the checks a CVC/GFR-aware judge is most likely to test live.

## Recommended implementation order
Exactly the Phase 0–9 order in `00_MASTER_IMPLEMENTATION_ROADMAP.md`:
baseline → data layer → Pillar 4 → Pillar 3 → Pillar 1 → Pillar 2 (static)
→ Pillar 2 (live, optional) → Pillar 5 → integration → demo prep. Do not
reorder Pillars 4 and 3 ahead of the others — both exist specifically to
prevent later pillars from presenting something physically impossible or
unauditable as a clean recommendation.
