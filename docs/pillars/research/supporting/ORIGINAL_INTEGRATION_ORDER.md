# Exact build order

## v2 note
`11_REFERENCE_IMPLEMENTATION/` already implements Steps 1–4 and 6 below
against mock/static data, with the IMD live call (Step 5) stubbed as a
marked TODO. The steps below still describe the correct order for wiring
this scaffold into the real product repo — do not skip Step 0.

## Step 0 — Baseline
Get the existing repo running before changing feature code.

## Step 1 — Pillar 4
Create physical eligibility service first.
Reason: economics and optimization must not recommend impossible vessels/routes.

## Step 2 — Pillar 3
Freeze decision snapshots and audit events.
Reason: later model/scenario outputs need traceability from day one.

## Step 3 — Pillar 1
Add scenario and energy-normalized economics.

## Step 4 — Pillar 2 static
MapLibre + local ports/chokepoints/reference routes.
Do not wait for live APIs.

## Step 5 — Pillar 2 live adapters
Add IMD integration, caching, freshness.

## Step 6 — Pillar 5
Build command center over stable APIs.

## Pull-request boundaries
PR1 physical constraints
PR2 governance/audit
PR3 economics
PR4 static GIS
PR5 live hazards
PR6 command center
