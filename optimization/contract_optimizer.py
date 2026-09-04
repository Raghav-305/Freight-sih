"""Contract Optimizer Module.

Solves the maritime chartering portfolio allocation problem:
Distributes total cargo commitment across Spot, Short-term / Time Charter,
Multi-Voyage Charter (MVC), and Contract of Affreightment (COA) to minimize
total procurement cost and manage freight volatility risk.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any


def optimize_contract(payload: dict[str, Any]) -> dict[str, Any]:
    """Calculate the optimal charter contract mix and expected financial savings.

    Args:
        payload: Dictionary with cargo_quantity, origin, destination,
                 period_start, period_end, contract_options, etc.

    Returns:
        Dictionary containing recommended strategy, allocations, expected cost,
        baseline cost, savings, risk score, and fixing window.
    """
    cargo_quantity = float(payload.get("cargo_quantity") or 480000)
    origin = str(payload.get("origin") or "Australia").title()
    destination = str(payload.get("destination") or "Dhamra").title()
    contract_options = payload.get("contract_options") or ["spot", "short_term", "multi_voyage", "coa"]
    options_set = {str(opt).lower().strip().replace("-", "_") for opt in contract_options}

    # Reference or predicted baseline spot rate ($/MT)
    current_freight = float(payload.get("current_freight") or 19.40)
    market_regime = str(payload.get("market_regime") or "BULLISH").upper()
    risk_score = float(payload.get("risk_score") or 55.0)

    # Calculate contract rate models ($/MT equivalent)
    # COA offers 5-7% discount due to guaranteed volume commitment
    coa_rate = round(current_freight * 0.935, 2)
    # Multi-voyage offers 3-4% discount
    mvc_rate = round(current_freight * 0.965, 2)
    # Short term / period charter rate
    short_term_rate = round(current_freight * 0.950, 2)
    # Spot rate
    spot_rate = round(current_freight, 2)

    # Dynamic Allocation based on market signals and available contract options
    raw_allocation: dict[str, float] = {}
    if "bullish" in market_regime.lower():
        # Rates expected to rise -> Lock in long-term fixed COA & Multi-voyage hedge
        strategy = "COA-HEAVY FORWARD HEDGE"
        raw_allocation = {
            "coa": 45.0,
            "multi_voyage": 25.0,
            "short_term": 15.0,
            "spot": 15.0,
        }
        risk_level = "MODERATE-LOW (HEDGED)"
        fixing_advice = "Fix COA tranches within next 10-14 days before forward FFA curves appreciate further."
    elif "bearish" in market_regime.lower():
        # Rates expected to fall -> Keep high spot exposure to capture lower rates
        strategy = "DYNAMIC SPOT-DOMINANT FLOAT"
        raw_allocation = {
            "spot": 50.0,
            "short_term": 25.0,
            "multi_voyage": 15.0,
            "coa": 10.0,
        }
        risk_level = "MODERATE (MARKET EXPOSURE)"
        fixing_advice = "Delay forward commitments; float on prompt spot fixing to capture falling market freight."
    else:
        # Neutral / High Volatility -> Balanced multi-tier diversification
        strategy = "BALANCED MULTI-TIER PORTFOLIO"
        raw_allocation = {
            "coa": 35.0,
            "multi_voyage": 25.0,
            "short_term": 20.0,
            "spot": 20.0,
        }
        risk_level = "LOW-DIVERSIFIED"
        fixing_advice = "Evenly tranche procurement: 60% committed under COA/MVC, 40% reserved for spot flexibility."

    # Filter to requested contract options and normalize to 100%
    active_allocation = {k: v for k, v in raw_allocation.items() if k in options_set or not options_set}
    if not active_allocation:
        active_allocation = {"spot": 100.0}
    total_pct = sum(active_allocation.values())
    allocation = {k: round((v / total_pct) * 100, 1) for k, v in active_allocation.items()}
    # Adjust minor rounding difference so sum is exactly 100.0
    diff = round(100.0 - sum(allocation.values()), 1)
    first_key = next(iter(allocation))
    allocation[first_key] = round(allocation[first_key] + diff, 1)

    # Financial Cost Computations
    rate_map = {
        "spot": spot_rate,
        "short_term": short_term_rate,
        "multi_voyage": mvc_rate,
        "coa": coa_rate,
    }

    # Baseline cost assumes 100% unhedged Spot procurement
    baseline_cost = round(cargo_quantity * spot_rate, 2)

    # Expected weighted portfolio cost
    expected_cost = 0.0
    for contract_type, pct in allocation.items():
        volume = (pct / 100.0) * cargo_quantity
        unit_rate = rate_map.get(contract_type, spot_rate)
        expected_cost += volume * unit_rate
    expected_cost = round(expected_cost, 2)

    expected_saving = max(0.0, round(baseline_cost - expected_cost, 2))
    expected_saving_pct = round((expected_saving / baseline_cost) * 100, 2) if baseline_cost > 0 else 0.0

    # Period dates
    period_start = payload.get("period_start") or "2026-10-01"
    period_end = payload.get("period_end") or "2027-03-31"

    return {
        "strategy": strategy,
        "allocation": allocation,
        "rates_usd_mt": {
            "spot": spot_rate,
            "short_term": short_term_rate,
            "multi_voyage": mvc_rate,
            "coa": coa_rate,
        },
        "cargo_quantity": cargo_quantity,
        "route": f"{origin} -> {destination}",
        "period": f"{period_start} to {period_end}",
        "expected_cost": expected_cost,
        "baseline_cost": baseline_cost,
        "expected_saving": expected_saving,
        "expected_saving_pct": expected_saving_pct,
        "risk": risk_level,
        "risk_score": risk_score,
        "fixing_window": fixing_advice,
        "notes": (
            f"Charter optimization based on {market_regime} market regime. "
            f"COA hedge locks in volume at ${coa_rate:.2f}/MT, generating estimated "
            f"${expected_saving:,.2f} in procurement savings compared to pure spot exposure."
        ),
    }


if __name__ == "__main__":
    test_payload = {
        "cargo_quantity": 480000,
        "origin": "Australia",
        "destination": "Dhamra",
        "period_start": "2026-10-01",
        "period_end": "2027-03-31",
        "contract_options": ["spot", "short_term", "multi_voyage", "coa"],
        "market_regime": "BULLISH",
    }
    import json
    print(json.dumps(optimize_contract(test_payload), indent=2))
