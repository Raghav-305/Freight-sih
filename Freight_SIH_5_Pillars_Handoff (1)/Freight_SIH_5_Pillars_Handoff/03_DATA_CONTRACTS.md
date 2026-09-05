# 03 — DATA CONTRACTS

Schemas for every dataset the five pillars need. Static reference files
already exist and are provided in `data_templates/` (copy to `data/reference/`
in the real repo per Phase 1 of `00_MASTER_IMPLEMENTATION_ROADMAP.md`) —
treat their current
content as correct and versioned, don't regenerate them. Live/runtime
schemas below define what your backend should accept/emit even where no
sample file exists yet.

---

## 1. `port_constraints.json` (static reference — Pillar 4)

Location in this package: `data_templates/port_constraints.example.json`
(copy verbatim to `data/reference/port_constraints.json` in the real repo —
this is real, sourced data, not a template to overwrite).

Array of objects. One object per berth.

| Field | Type | Required? | Example | Source | Validation rule |
|---|---|---|---|---|---|
| port_id | string | Yes | `"PARADIP"` | Port authority | Uppercase port code |
| berth_id | string | Yes | `"BERTH_03"` | Port authority | Unique within port_id |
| berth_name | string | Yes | `"New Coal Import Berth"` | Port authority publication | Non-empty |
| commodity | string | Yes | `"Coking Coal"` | Port authority | Non-empty |
| max_loa_m | number | Yes | `300` | Port authority | > 0 |
| max_beam_m | number | Yes | `46` | Port authority | > 0 |
| base_max_draft_m | number | Yes | `14.5` | Port authority | > 0 |
| conditional_draft_m | number \| null | No | `16.0` | Port authority (tide condition) | If set, must be ≥ base_max_draft_m |
| condition_type | string \| null | No | `"HIGH_TIDE"` | Port authority | Required if conditional_draft_m set |
| source_url | string | Yes | `"https://paradipport.gov.in/berth-specifications/"` | — | Must be a real, working URL |
| verified_reference | string (date) | Yes | `"2026-02-23"` | — | ISO date you personally verified the source |

**Rule:** only add a record after pulling it from the port authority's own
published berth specification page. Never edit an existing verified record
without also updating `verified_reference`. A missing port/berth should
resolve to `UNKNOWN` in the eligibility API — never invent a record to avoid
that.

---

## 2. GeoJSON static layers (Pillar 2)

Files: `data_templates/geojson/ports.geojson`,
`corridors.geojson`, `chokepoints.geojson` (copy to `data/reference/` in
the real repo). Standard GeoJSON
`FeatureCollection`. Each file uses its own discriminator property (they are
not identical schemas — this matches what's actually shipped, not a
generic template):

**`ports.geojson`** — geometry `Point`. Properties:

| Field | Type | Required? | Example |
|---|---|---|---|
| name | string | Yes | `"Paradip"` |
| country | string | Yes | `"IN"` / `"AU"` |
| role | string | Yes | `"destination"` / `"coastal_leg"` / `"origin_import"` |

**`corridors.geojson`** — geometry `LineString`. Properties:

| Field | Type | Required? | Example |
|---|---|---|---|
| name | string | Yes | `"Gladstone -> Torres Strait -> Lombok -> Bay of Bengal -> Paradip"` |
| type | string | Yes | `"IMPORT_REFERENCE_ROUTE"` / `"COASTAL_REFERENCE_ROUTE"` |
| commodity | string | Yes | `"Coking Coal"` |

**`chokepoints.geojson`** — geometry `Point` or `Polygon` (the cyclone belt
entry is a `Polygon`). Properties:

| Field | Type | Required? | Example |
|---|---|---|---|
| name | string | Yes | `"Strait of Malacca"` |
| category | string | Yes | `"SHIPPING_LANE_CHOKEPOINT"` / `"SEASONAL_HAZARD_ZONE_STATIC"` |

**Truth class:** none of the three files carry a `truth_class` property
in the raw GeoJSON. Tag the layer as `STATIC_REFERENCE` when you **serve**
it from `/map/*` (in the response envelope or a wrapping object), not by
editing the GeoJSON itself — keep the raw files as plain, portable GeoJSON
any map library can read directly.

**Validation rule:** coordinates are approximate anchors for map rendering,
not navigational data — do not present them as AIS-accurate.

---

## 3. `market_data.csv` (runtime input — Pillar 1, if you want a demo feed)

Not provided as a real file (no live market feed exists in this package) —
build this only if you want to pre-fill scenario cost inputs for the demo
rather than typing them live.

| Field | Type | Required? | Example | Source | Validation rule |
|---|---|---|---|---|---|
| date | date (ISO) | Yes | `2026-02-20` | Manual entry / your own market reference | Not in the future |
| freight_rate | number | Yes | `18.50` | Manual entry, clearly labelled PROJECT DEMO DATA if not a real quote | > 0 |
| unit | string | Yes | `"USD/tonne"` | — | Must be explicit, never implied |
| source | string | Yes | `"demo"` or a real source name | — | If not real, must literally say demo/reference |
| confidence | string | No | `"low"` / `"medium"` / `"high"` | Your own judgement | One of the three values |

---

## 4. `port_waiting_data.csv` (runtime input — Pillar 4 delay exposure)

Feeds `waiting_days_p10/p50/p90` into `/delay/exposure`. If your
existing forecasting model already outputs waiting-time quantiles, use those
directly instead of this file — this schema is only for a standalone demo
dataset.

| Field | Type | Required? | Example | Source | Validation rule |
|---|---|---|---|---|---|
| port_id | string | Yes | `"PARADIP"` | — | Matches `port_constraints.json` port_id |
| timestamp | datetime (ISO) | Yes | `2026-02-20T06:00:00Z` | — | Not in the future |
| waiting_vessels | integer | No | `7` | — | ≥ 0 |
| average_wait_hours | number | No | `36.5` | — | ≥ 0 |
| waiting_days_p10 | number | Yes (for delay exposure use) | `1.2` | Model output or manual demo value | ≥ 0, ≤ p50 |
| waiting_days_p50 | number | Yes | `2.5` | Model output or manual demo value | ≥ p10, ≤ p90 |
| waiting_days_p90 | number | Yes | `5.0` | Model output or manual demo value | ≥ p50 |

---

## 5. `demurrage_input` (runtime request body — Pillar 4)

This is the request body shape for `POST /demurrage/estimate`, not a
file — listed here because the original spec asked for it as a data
contract.

| Field | Type | Required? | Example | Source | Validation rule |
|---|---|---|---|---|---|
| actual_or_forecast_port_time_days | number | Yes | `6.5` | Model or user input | ≥ 0 |
| allowed_laytime_days | number | Yes | `4.0` | Charter party contract terms (user input) | ≥ 0 |
| contract_rate_usd_per_day | number | Yes | `15000` | Charter party contract terms (user input) | ≥ 0 |

Full request/response wiring for this and every other endpoint is in
`04_API_IMPLEMENTATION_SPEC.md`.

---

## 6. Decision snapshot payload (Pillar 3 — internal, not a CSV)

Stored as `payload_json` in the `decisions` table. This is the frozen
evidence record. See `04_API_IMPLEMENTATION_SPEC.md` for the exact
`DecisionCreateRequest` shape and `research/pillar_3_governance/DEEP_
RESEARCH.md` for the 10 required report sections it must be able to
populate.

## General rules across all datasets
- Every field that could be mistaken for live/official data must carry a
  `source` or `truth_class` marker somewhere in the record or in the
  surrounding API response — never a bare number with no provenance.
- Dates are always ISO-8601.
- A missing optional field should degrade the feature gracefully (e.g. no
  GCV → cost-per-GJ disabled with a warning) rather than block the whole
  response.
- Run `scripts/verify_data_schema.py` against any new or edited file before
  wiring code to it — see `scripts/README.md`.
