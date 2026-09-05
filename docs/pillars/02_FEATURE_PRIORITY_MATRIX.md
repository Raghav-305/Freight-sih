# 02 — FEATURE PRIORITY MATRIX

P0 = must build. P1 = strongly recommended. P2 = nice to have. This mirrors
the phase order in `00_MASTER_IMPLEMENTATION_ROADMAP.md` — build every P0
in every pillar before spending time on any pillar's P1/P2.

## Pillar 1 — Policy & Economics

| Feature | Priority | Jury/demo impact | Dev effort | Dependencies | Mock OK? |
|---|---|---|---|---|---|
| Scenario evaluate (landed cost + cost/GJ) | P0 | High — core economics credibility | Low (reference code exists) | None | No — real formulas, mandatory |
| Scenario compare (ranked) | P0 | High — the actual comparison judges will ask for | Low | Scenario evaluate | No |
| Blend evaluate (domestic/import mix) | P1 | Medium — shows coal-blending sophistication | Low | Scenario evaluate | No |
| Sensitivity grid | P1 | Medium-high — shows the recommendation isn't fragile-looking | Low-Medium | Scenario evaluate | No, but can be built after baseline |
| Assumptions drawer (UI) | P0 | High — this is what prevents "why should I trust this number" | Low | Scenario evaluate | No |
| Pre-filled coal reference defaults | P2 | Low | Medium (data entry) | Ministry of Coal directory | Yes, clearly labelled reference data |

## Pillar 2 — Maritime GIS

| Feature | Priority | Jury/demo impact | Dev effort | Dependencies | Mock OK? |
|---|---|---|---|---|---|
| Static ports/corridors/chokepoints layers | P0 | High — visual, memorable, offline-safe | Low (data + code exist) | Phase 1 data layer | No — real GeoJSON provided |
| Layer toggle UI | P0 | Medium | Low | MapCanvas | No |
| Freshness badge / truth-class label | P0 | High — this is the credibility mechanism itself | Low | All layers | No |
| Offline behavior (Wi-Fi off demo) | P0 | High — strong, rehearsable jury moment | Low (already offline-safe) | Static layers | N/A |
| Live IMD hazard adapter | P2 | Medium (only if it actually works reliably live) | Medium-High (needs API credential) | IMD API access | Yes — must display as MOCKED/DEMO if not live |
| Route-risk overlay (weighted composite) | P1 | Medium | Medium | Market/weather/chokepoint/delay inputs | Yes, as MODEL_OUTPUT, clearly labelled |
| Port queue overlay | P2 | Low-Medium | Low | None | Yes — must carry DEMO_SIMULATION label, never look like AIS |

## Pillar 3 — Governance

| Feature | Priority | Jury/demo impact | Dev effort | Dependencies | Mock OK? |
|---|---|---|---|---|---|
| DRAFT→APPROVED workflow | P0 | Very high — this is the CVC/GFR credibility centerpiece | Low (reference code exists) | Phase 1 baseline | No |
| Self-approval blocking | P0 | High — a specific, rehearsable "gotcha" moment for judges | Low | Workflow | No |
| Audit hash chain + verify_chain() | P0 | High — tamper-evidence is a strong, concrete claim | Low | Workflow | No |
| PDF/XLSX evidence report | P0 | High — a tangible deliverable judges can hold | Low-Medium (reportlab/openpyxl) | Frozen decision snapshot | No |
| Decision-support-only banner | P0 | Medium but mandatory — wrong wording undermines the whole pillar | Trivial | None | N/A |
| Auth/RBAC | Not in scope for hackathon | — | High | — | Free-text actor/role is acceptable and flagged |

## Pillar 4 — Port Operations

| Feature | Priority | Jury/demo impact | Dev effort | Dependencies | Mock OK? |
|---|---|---|---|---|---|
| Berth-level eligibility (Paradip real data) | P0 | Very high — concrete, verifiable, official-sourced | Low (reference code + real data exist) | Phase 1 data layer | No — real data, real logic |
| UNKNOWN state (no fabricated ELIGIBLE) | P0 | High — this is a specific defensible design decision for Q&A | None extra | Eligibility logic | N/A — this IS the honesty mechanism |
| Delay exposure (P10/P50/P90 × daily rate) | P0 | High | Low | Waiting-day forecast (existing model or user input) | Yes, formula is real; inputs can be scenario-driven |
| Contractual demurrage (separate endpoint) | P0 | Medium-high — the P10/P50/P90 vs demurrage distinction is a strong Q&A answer | Low | Laytime/rate inputs | Yes, user-supplied inputs |
| Additional ports beyond Paradip | P2 | Medium (more coverage looks better) but risky if data is fabricated | Medium (needs real sourcing) | Verified official berth data | Never — UNKNOWN is correct until sourced |

## Pillar 5 — Command Center

| Feature | Priority | Jury/demo impact | Dev effort | Dependencies | Mock OK? |
|---|---|---|---|---|---|
| `/command-center/summary` endpoint | P0 | Medium (backend, not visible directly) | Low (reference code exists) | Pillars 3 + 2 status | No |
| Executive Overview tab | P0 | Very high — first thing judges see | Medium | Summary endpoint | No |
| Vessel Eligibility & Port Constraints tab | P0 | High | Low (reuses Pillar 4 component) | Pillar 4 | No |
| Maritime Geospatial Visualizer tab | P0 | High | Low (reuses Pillar 2 component) | Pillar 2 | No |
| Audit Log & Approval Workflow tab | P0 | High | Low (reuses Pillar 3 component) | Pillar 3 | No |
| Freight Forecasting & Explanation tab | P0 | High | Depends on existing model UI | Existing forecasting model | No — reuses existing work |
| Chartering Portfolio: Spot vs COA tab | P1 | Medium-high | Depends on existing optimizer UI | Existing optimizer | No — reuses existing work |
| Data Quality & Pipeline Lineage tab | P1 | Medium | Medium | Freshness data from all pillars | Yes for lineage detail, no for freshness truth-class |
| Above-the-fold ordering rule enforced | P0 | High — directly shapes the demo narrative | Low (layout only) | All tabs | N/A |
| KPI drill-down (value/source/observed_at/confidence) | P1 | Medium-high | Medium | All pillar endpoints | No |

## How to read this if you're short on time
Build every **P0** row across all five pillars first, in the phase order from
the master roadmap. Only after every P0 is demoable should you touch a P1.
Treat P2 rows as things you explicitly decide *not* to do and can say so
confidently if a judge asks — "we scoped that out, here's why" is a stronger
answer than a rushed, half-working feature.
