#!/usr/bin/env python3
"""
generate_sample_data.py

Generates two CSV files for demo/rehearsal use, matching the schemas in
03_DATA_CONTRACTS.md sections 3 and 4:

  - market_data.csv       (Pillar 1 demo cost inputs)
  - port_waiting_data.csv (Pillar 4 demo waiting-time quantiles)

IMPORTANT: this data is PROJECT DEMO DATA, not a real market feed or a
real waiting-time forecast. Every row's `source`/label makes that explicit.
Do not present numbers from these files as live in front of a jury -- use
them only to rehearse the UI flow before your real forecasting model or a
real market reference is wired in.

Usage:
    python3 generate_sample_data.py [--out-dir PATH] [--days N] [--seed N]

    --out-dir defaults to ./sample_output next to this script
    --days     number of daily rows to generate (default 14)
    --seed     random seed, for reproducible demo data (default 42)

Dependencies: none beyond the Python 3 standard library.
"""
from __future__ import annotations

import argparse
import csv
import random
from datetime import date, timedelta
from pathlib import Path


def generate_market_data(days: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    rows = []
    base_rate = 18.50  # USD/tonne, arbitrary demo starting point
    today = date.today()
    for i in range(days):
        d = today - timedelta(days=days - i)
        # small random walk so the sensitivity/trend UI has something to show
        base_rate += rng.uniform(-0.4, 0.4)
        rows.append({
            "date": d.isoformat(),
            "freight_rate": round(base_rate, 2),
            "unit": "USD/tonne",
            "source": "demo",
            "confidence": "low",
        })
    return rows


def generate_port_waiting_data(days: int, seed: int) -> list[dict]:
    rng = random.Random(seed + 1)
    rows = []
    today = date.today()
    port_id = "PARADIP"
    for i in range(days):
        d = today - timedelta(days=days - i)
        p50 = round(rng.uniform(1.5, 3.5), 2)
        p10 = round(p50 * rng.uniform(0.3, 0.6), 2)
        p90 = round(p50 * rng.uniform(1.6, 2.4), 2)
        rows.append({
            "port_id": port_id,
            "timestamp": f"{d.isoformat()}T06:00:00Z",
            "waiting_vessels": rng.randint(2, 12),
            "average_wait_hours": round(p50 * 24, 1),
            "waiting_days_p10": p10,
            "waiting_days_p50": p50,
            "waiting_days_p90": p90,
        })
    return rows


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} row(s) to {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", type=Path,
                         default=Path(__file__).resolve().parent / "sample_output")
    parser.add_argument("--days", type=int, default=14)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    market_rows = generate_market_data(args.days, args.seed)
    waiting_rows = generate_port_waiting_data(args.days, args.seed)

    write_csv(args.out_dir / "market_data.csv", market_rows)
    write_csv(args.out_dir / "port_waiting_data.csv", waiting_rows)

    print(
        "\nReminder: this is PROJECT DEMO DATA (see 03_DATA_CONTRACTS.md). "
        "Label it as such anywhere it appears in the UI, and swap it for "
        "your real forecasting model's output or a real market reference "
        "before treating any number here as an actual claim."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
