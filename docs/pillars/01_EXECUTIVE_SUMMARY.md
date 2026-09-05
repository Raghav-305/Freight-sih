# 01 — EXECUTIVE SUMMARY

## What this package is
A developer-ready implementation handoff for five additive feature pillars
on top of the existing Freight-sih repo, for SIH 2026 (PS 26006). It
reorganizes and completes the original deep-research dossier so one document
— `00_MASTER_IMPLEMENTATION_ROADMAP.md` — is enough to start building.

## The five pillars, one line each
1. **Policy & Economics** — energy-normalized (USD/GJ) coastal-vs-import coal
   costing, tied to actual NLP/Sagarmala/coal policy objectives.
2. **Maritime GIS** — offline-safe chokepoint/corridor map with honest
   live/static/demo labelling.
3. **Governance** — DRAFT→APPROVED decision workflow with a tamper-evident
   audit hash chain and a real PDF/XLSX evidence report.
4. **Port Operations** — berth-level, tide-conditional vessel eligibility
   and a delay-exposure vs contractual-demurrage split.
5. **Command Center** — the single UI surface that ties 1–4 into one
   judge-facing decision flow.

## Every path is real, not a placeholder
This package targets the actual `github.com/Raghav-305/Freight-sih` repo
structure — `backend/app/api/`, `backend/app/services/`,
`backend/app/schemas/`, `data/reference/` — and endpoints match the
existing `/forecast`, `/what-if` convention with no `/api` prefix. See
`08_REPO_INTEGRATION_MAP.md` for the full mapping and two things worth
resolving on day one (a root-folder naming ambiguity, and a field-naming
reconciliation for the forecast/decision-snapshot handoff).

## What already exists and is ready to use
`reference_implementation/` (carried over verbatim from the research
package) is a **working, tested** FastAPI backend and React/TypeScript
frontend-component set implementing all five pillars' API contracts against
mock/static data: 21 passing pytest tests, real PDF/XLSX generation, real
SHA-256 audit chain, real berth-eligibility logic against actual Paradip
berth data. This is not a spec to build from scratch — it is code to
integrate into the real repo. See `reference_implementation/README.md` for
its own honest list of what's real vs. mocked.

## What is deliberately left open
- Live IMD hazard data (adapter pipeline is real, the HTTP call is a marked
  TODO — no credential exists yet).
- Port/berth data beyond Paradip (do not fabricate — add only from verified
  official sources).
- Real SHAP/explainability wiring (report correctly prints "Not computed"
  until the existing forecasting model exposes driver values).
- Authentication/RBAC (actor/role are free-text for the hackathon; this is
  flagged, not hidden).

## Build order in one sentence
Port eligibility first (so nothing recommends the physically impossible),
then governance (so every result has somewhere trustworthy to land), then
economics, then static GIS, then the Command Center that ties it together —
full detail and file-level tasks in `00_MASTER_IMPLEMENTATION_ROADMAP.md`.

## What "done" looks like for the hackathon
A judge can: compare an import vs. coastal coal scenario with visible
assumptions → see the recommended vessel fail or pass berth eligibility with
a reason → watch the decision get submitted, self-approval blocked, then
approved by a second actor → download a PDF evidence report → turn off
Wi-Fi and still see the port/corridor/chokepoint map. See
`06_FINAL_DEMO_FLOW.md` for the exact script.
