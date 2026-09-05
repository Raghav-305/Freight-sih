# 07 — RESEARCH SOURCES

Source register for every claim used in the five pillars. Full per-pillar
research reasoning is in `research/pillar_*/DEEP_RESEARCH.md`. This file is
the flat index. Every claim in the product should be traceable to one of
these rows or explicitly marked as an engineering inference / demo data (see
labelling standard below).

## Labelling standard (used throughout this package)
- **SOURCE FACT** — directly supported by an official source.
- **ENGINEERING INFERENCE** — a design consequence derived from a source
  fact, not itself published anywhere.
- **PROJECT DEMO DATA** — safe simulated/static data that must never be
  represented as live.
- **VERIFY BEFORE OPS** — must be refreshed against the current
  authoritative source before any real (non-demo) use.

## Source register

| ID | Pillar | Publisher | Title | URL | Why it matters |
|---|---|---|---|---|---|
| S01 | 1 | PIB / National Logistics Policy | National Logistics Policy | https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1595915&lang=2&reg=3 | Historical policy framing and logistics-cost discussion |
| S02 | 1 | PIB | India marks one year of launch of National Logistics Policy | https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1957407&lang=2&reg=48 | Clarifies official logistics-cost estimates vary; Coal Logistics Plan context |
| S03 | 1 | MoPSW | Annual Report 2024-25 | https://shipmin.gov.in/sites/default/files/Annual%20Report%202024-25%20-%20English.pdf | Sagarmala objective and maritime context |
| S04 | 1 | MoPSW | Sagarmala Funding Guidelines | https://shipmin.gov.in/sites/default/files/Revised%20SM%20Guidelines-%205.4.2023.pdf | Objectives include coastal shipping and inland waterways |
| S05 | 1 | Ministry of Coal | Coal Statistics / Coal Directory 2024-25 | https://www.coal.gov.in/major-statistics/coal-statistics | Official coal statistical source |
| S06 | 2 | IMD | IMD API reference | https://api.imd.gov.in/public/api_reference.html | Official marine/cyclone/warning data integration route |
| S07 | 2 | UNCTAD | Review of Maritime Transport 2024 | https://unctad.org/publication/review-maritime-transport-2024 | Maritime disruption context |
| S08 | 2 | MapLibre | MapLibre GL JS Docs | https://maplibre.org/maplibre-gl-js/docs/ | Free open-source interactive map stack |
| S09 | 2 | MapLibre | PMTiles source example | https://maplibre.org/maplibre-gl-js/docs/examples/pmtiles/ | Offline/packageable map architecture |
| S10 | 3 | Department of Expenditure | GFR 2017 updated up to 31 Jan 2026 | https://doe.gov.in/bi-annual-compilationupdation-general-financial-rules-2017-upto-31012026general-financial-rules | Current GFR reference |
| S11 | 3 | Department of Expenditure | GFR text / procurement governance | https://doe.gov.in/files/circulars_document/Compilation_of_amendments_in_GFR_2017_English_upto_31_12_2023_Final.pdf | Baseline governance applicability |
| S12 | 4 | Paradip Port Authority | Berth Specifications | https://paradipport.gov.in/berth-specifications/ | Official berth-level LOA/beam/draft and high-tide constraints |
| S13 | 4 | Visakhapatnam Port Authority | Berths | https://vpt.shipping.gov.in/Template/navigateTemplate/gnt/QmVydGhz | Official berth context |
| S14 | 4 | Visakhapatnam Port Authority | Periodical Draft Restrictions | https://vpt.shipping.gov.in/admin_assets/uploads/1730867960_peroidcal_draftNVO2024.pdf | Versioned draft-restriction concept |
| S15 | 5 | MoPSW | Port/Shipping Guidelines | https://shipmin.gov.in/orders/guideline | Operational governance and port-sector context |

## Key evidence synthesis (condensed — full text in `research/*/DEEP_RESEARCH.md`)

**Pillar 1.** Do not hard-code "India's logistics cost is 13–14% of GDP vs.
global 8%" as fact — PIB material historically described 13–14% as a
*private* estimate and explicitly said no official estimate existed at that
time; later material cites a range from prior studies while official
estimation work continues (S01, S02). The strongest policy-aligned feature
is a comparable scenario engine (import vs. coastal), not a decorative
policy badge (S03, S04). Coal statistics (S05) are reference/historical
data, not a live commercial feed.

**Pillar 2.** IMD publishes official hazard/cyclone API documentation (S06)
— hazard layers should be adapter-based with visible source timestamps.
MapLibre GL JS is free/open-source with PMTiles support for offline
packaging (S08, S09) — static reference layers should work with zero
network dependency; live layers degrade visibly, never silently.

**Pillar 3.** Department of Expenditure maintains a current, regularly
updated GFR compilation (S10, S11) — the product must not claim
"GFR-compliant" from a banner alone; it must provide traceability,
authority-controlled workflow, frozen evidence, and reproducible
justification instead.

**Pillar 4.** Paradip Port Authority publishes berth-specific LOA/beam/draft
limits including high-tide conditional drafts (S12) — eligibility must be
berth-level and conditional, never a single port-wide "max draft" constant.
Visakhapatnam publishes similarly structured, versioned constraints (S13,
S14) — any additional port added later needs the same
effective-date/version metadata, sourced the same way.

**Pillar 5.** MoPSW's operational governance material (S15) supports
framing the command center as a decision surface tied to real procurement
governance, not a standalone AI dashboard — this is an engineering
inference built on S10–S15 together, not a single cited claim.

## Rule for adding new sources
Only add a row here after confirming the source is an official government,
regulatory, port-authority, or equivalently authoritative publication (see
preference order in the original research brief: MoPSW, PIB, Ministry of
Coal, CVC, GFR/DoE, DG Shipping, Indian port authorities, IMD, IMO). Do not
add blog or aggregator sources when an official source exists. Every new row
needs a working URL and a one-line "why it matters" — no source without a
stated purpose in the product.
