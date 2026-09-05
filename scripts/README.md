# scripts/

Real, runnable scripts. Every one of them has been executed against the
data shipped in this package and works. None are placeholders.

All scripts are dependency-free (Python 3 standard library only) except
where noted, so they run without touching `reference_implementation/`'s
virtualenv.

---

## `verify_data_schema.py`
**What it does:** validates `port_constraints.json` and the three static
GeoJSON layers against the schemas in `03_DATA_CONTRACTS.md`.
**Input files:** `data_templates/port_constraints.example.json`,
`data_templates/geojson/*.geojson` (or `--data-dir` pointing at your repo's
real copy after Phase 1).
**Output:** pass/fail report to stdout.
**How to run:**
```bash
python3 verify_data_schema.py
python3 verify_data_schema.py --data-dir /path/to/your/repo/data/reference
```
**Dependencies:** none.
**Expected output:** `RESULT: ALL CHECKS PASSED` (exit 0) against the files
shipped in this package.

---

## `validate_port_data.py`
**What it does:** domain-specific sanity checks on top of the generic
schema check above — catches things like a conditional draft that's lower
than the base draft (should never happen), an implausible LOA/beam ratio
(usually a data-entry swap), and flags any port beyond Paradip so you
double-check it was actually sourced from that port authority.
**Input files:** `port_constraints.json` (path as first argument, defaults
to the shipped example).
**Output:** pass/fail report to stdout.
**How to run:**
```bash
python3 validate_port_data.py
python3 validate_port_data.py /path/to/your/port_constraints.json
```
**Dependencies:** none.
**Expected output:** `RESULT: PASSED` against the shipped Paradip data.

---

## `generate_sample_data.py`
**What it does:** generates `market_data.csv` and `port_waiting_data.csv`
matching the schemas in `03_DATA_CONTRACTS.md` sections 3–4, for rehearsing
the Pillar 1/4 UI before your real forecasting model or a real market
reference is wired in. Every row is explicitly labelled `source: demo` /
`confidence: low` — this is not real market or operational data.
**Input files:** none (synthetic, seeded for reproducibility).
**Output files:** `<out-dir>/market_data.csv`, `<out-dir>/port_waiting_data.csv`.
**How to run:**
```bash
python3 generate_sample_data.py --days 14 --seed 42
python3 generate_sample_data.py --out-dir ./demo_data --days 30
```
**Dependencies:** none.
**Expected output:** two CSVs, plus a printed reminder not to present this
data as live.

---

## `calculate_demurrage.py`
**What it does:** standalone CLI for the delay-exposure and contractual-
demurrage formulas from Pillar 4, so you can check numbers or prep demo
talking points without booting the FastAPI server. Mirrors
`reference_implementation/app/services/eligibility.py` exactly — if you
change one, change both.
**Input files:** none (CLI arguments).
**Output:** calculation result to stdout.
**How to run:**
```bash
python3 calculate_demurrage.py delay-exposure --p10 1.2 --p50 2.5 --p90 5.0 --daily-rate 15000
python3 calculate_demurrage.py demurrage --port-time 6.5 --allowed-laytime 4.0 --contract-rate 15000
```
**Dependencies:** none.
**Expected output:** the three delay-exposure quantiles (with a warning
that this is not contractual demurrage), or the excess-days/demurrage
amount, respectively.

---

## `check_source_urls.py`
**What it does:** checks that every URL in `research/00_source_evidence/SOURCE_REGISTER.csv`
still resolves. Government/ministry pages move without warning — this
catches a dead source link before a judge clicks it during Q&A.
**What it deliberately does NOT do:** auto-download or scrape the
underlying policy/port data. Government sources here are PDFs/HTML pages
with no stable public API, so a reliable auto-downloader isn't realistic —
if a source has moved, open it yourself, re-verify the figure, and update
`07_RESEARCH_SOURCES.md` and the relevant `research/pillar_*/DEEP_RESEARCH.md`
by hand.
**Input files:** `research/00_source_evidence/SOURCE_REGISTER.csv` (found
automatically, or pass `--csv`).
**Output:** pass/fail per URL to stdout.
**How to run:**
```bash
python3 check_source_urls.py
```
**Dependencies:** none. **Requires real network access** — it will report
every URL as unreachable in a sandboxed/offline environment (this is
expected, not a bug; run it from your normal dev machine).

---

## Why there's no `download_reference_data.py`
The original brief asked for one. It isn't included because it would be a
fake script: none of the 15 sources in `07_RESEARCH_SOURCES.md` expose a
stable, scriptable download endpoint — they're PDFs and HTML pages on
ministry/port-authority sites. Writing a scraper against a page's current
HTML structure would break the first time that page changes layout, and
would encourage treating scraped output as more reliable than it is. Update
data manually: open the URL in `07_RESEARCH_SOURCES.md`, read the current
figure, and update the relevant `research/pillar_*/DEEP_RESEARCH.md` and
(for port data) `data_templates/port_constraints.example.json`'s
`verified_reference` date by hand.
