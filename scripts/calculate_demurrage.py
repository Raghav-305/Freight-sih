#!/usr/bin/env python3
"""
calculate_demurrage.py

Standalone CLI for the two Pillar 4 financial formulas, so you can sanity
check numbers or prep demo talking points without booting the FastAPI
server. Implements exactly the formulas from
reference_implementation/app/services/eligibility.py -- keep these two
files in sync if you change one.

  delay-exposure   = waiting_days * daily_charter_hire_rate_usd
                      (three numbers: P10, P50, P90 -- a forecast range)

  demurrage        = max(0, port_time_days - allowed_laytime_days)
                      * contract_rate_usd_per_day
                      (a single number -- a contractual calculation)

These are deliberately two different calculations, not one. See
research/pillar_4_port_operations/DEEP_RESEARCH.md: "Estimated delay
exposure is not contractual demurrage."

Usage:
    python3 calculate_demurrage.py delay-exposure \\
        --p10 1.2 --p50 2.5 --p90 5.0 --daily-rate 15000

    python3 calculate_demurrage.py demurrage \\
        --port-time 6.5 --allowed-laytime 4.0 --contract-rate 15000

Dependencies: none beyond the Python 3 standard library.
"""
from __future__ import annotations

import argparse
import sys


def delay_exposure(p10: float, p50: float, p90: float, daily_rate: float) -> dict:
    return {
        "delay_exposure_low_p10_usd": round(p10 * daily_rate, 2),
        "delay_exposure_base_p50_usd": round(p50 * daily_rate, 2),
        "delay_exposure_high_p90_usd": round(p90 * daily_rate, 2),
        "warning": ("This is a modelled delay-cost estimate, NOT contractual "
                    "demurrage. Use the 'demurrage' command for that."),
    }


def demurrage(port_time_days: float, allowed_laytime_days: float,
               contract_rate_usd_per_day: float) -> dict:
    excess_days = max(0.0, port_time_days - allowed_laytime_days)
    amount = excess_days * contract_rate_usd_per_day
    result = {
        "excess_days": round(excess_days, 3),
        "contractual_demurrage_usd": round(amount, 2),
    }
    if not allowed_laytime_days or not contract_rate_usd_per_day:
        result["warning"] = (
            "allowed_laytime_days or contract_rate_usd_per_day is zero -- "
            "confirm these are real contract terms, not placeholders."
        )
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    de = sub.add_parser("delay-exposure", help="P10/P50/P90 delay-cost estimate")
    de.add_argument("--p10", type=float, required=True, help="waiting_days_p10")
    de.add_argument("--p50", type=float, required=True, help="waiting_days_p50")
    de.add_argument("--p90", type=float, required=True, help="waiting_days_p90")
    de.add_argument("--daily-rate", type=float, required=True,
                     help="daily_charter_hire_rate_usd (must be > 0)")

    dm = sub.add_parser("demurrage", help="contractual demurrage calculation")
    dm.add_argument("--port-time", type=float, required=True,
                     help="actual_or_forecast_port_time_days")
    dm.add_argument("--allowed-laytime", type=float, required=True,
                     help="allowed_laytime_days")
    dm.add_argument("--contract-rate", type=float, required=True,
                     help="contract_rate_usd_per_day")

    args = parser.parse_args()

    if args.command == "delay-exposure":
        if args.daily_rate <= 0:
            print("ERROR: --daily-rate must be > 0")
            return 1
        result = delay_exposure(args.p10, args.p50, args.p90, args.daily_rate)
    else:
        if args.port_time < 0 or args.allowed_laytime < 0 or args.contract_rate < 0:
            print("ERROR: all inputs must be >= 0")
            return 1
        result = demurrage(args.port_time, args.allowed_laytime, args.contract_rate)

    for k, v in result.items():
        print(f"{k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
