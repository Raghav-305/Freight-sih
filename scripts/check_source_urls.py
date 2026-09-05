#!/usr/bin/env python3
"""
check_source_urls.py

Checks that every URL in 07_RESEARCH_SOURCES.md's source register is still
reachable. Government/ministry URLs move or go down more often than you'd
expect -- this catches that before a judge clicks a dead link during Q&A.

This does NOT scrape or download data automatically. Government port and
policy data here is published as PDFs/HTML on individual ministry and port
authority sites with no stable public API, so auto-downloading it reliably
is not realistic. This script only checks that the source page still
resolves; if you need updated figures, open the URL yourself and re-verify
manually, then update the relevant DEEP_RESEARCH.md and
verified_reference date by hand.

Usage:
    python3 check_source_urls.py [--csv path/to/SOURCE_REGISTER.csv]

    Reads URLs out of the CSV shipped in this package by default
    (research/*/SOURCE_REGISTER.csv, or pass --csv explicitly).

Requires network access. If this sandbox/CI environment has none, that's
expected -- run it locally or in your normal dev environment instead.

Dependencies: none beyond the Python 3 standard library.
"""
from __future__ import annotations

import argparse
import csv
import sys
import urllib.request
import urllib.error
from pathlib import Path

TIMEOUT_SECONDS = 10


def check_url(url: str) -> tuple[bool, str]:
    req = urllib.request.Request(url, method="HEAD",
                                  headers={"User-Agent": "Mozilla/5.0 (source-check-script)"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            return True, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        # Some gov sites reject HEAD but allow GET -- retry once with GET
        if e.code in (403, 405):
            try:
                get_req = urllib.request.Request(
                    url, headers={"User-Agent": "Mozilla/5.0 (source-check-script)"})
                with urllib.request.urlopen(get_req, timeout=TIMEOUT_SECONDS) as resp:
                    return True, f"HTTP {resp.status} (GET fallback)"
            except Exception as e2:
                return False, f"HEAD {e.code}, GET fallback also failed: {e2}"
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", type=Path, default=None,
                         help="Path to a SOURCE_REGISTER.csv-style file "
                              "(columns must include source_id and url). "
                              "If omitted, searches research/ for one.")
    args = parser.parse_args()

    csv_path = args.csv
    if csv_path is None:
        root = Path(__file__).resolve().parent.parent
        candidates = list(root.glob("**/SOURCE_REGISTER.csv"))
        if not candidates:
            print("No SOURCE_REGISTER.csv found under research/. "
                  "Pass --csv explicitly.")
            return 1
        csv_path = candidates[0]

    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found")
        return 1

    with csv_path.open(newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Checking {len(rows)} source URL(s) from {csv_path}\n")
    failures = []
    for row in rows:
        sid = row.get("source_id", "?")
        url = row.get("url", "")
        if not url:
            continue
        ok, detail = check_url(url)
        status = "OK" if ok else "FAIL"
        print(f"[{status}] {sid}  {url}  ({detail})")
        if not ok:
            failures.append((sid, url, detail))

    print()
    if failures:
        print(f"{len(failures)} source(s) unreachable -- verify manually and "
              f"update 07_RESEARCH_SOURCES.md / the relevant DEEP_RESEARCH.md "
              f"if the page has moved:")
        for sid, url, detail in failures:
            print(f"  {sid}: {url} ({detail})")
        return 1

    print("All sources reachable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
