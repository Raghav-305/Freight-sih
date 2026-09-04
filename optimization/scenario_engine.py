"""Maritime What-If Scenario Engine.

Simulates macroeconomic and operational shocks (freight rate volatility,
bunker price surges, and port congestion demurrage delays) on bulk procurement costs.
"""

from __future__ import annotations

from typing import Any


def run_scenario(payload: dict[str, Any]) -> dict[str, Any]:
    """Execute what-if sensitivity analysis for bulk chartering.

    Args:
        payload: Scenario configuration containing cargo_quantity, coverage,
                 freight_change_pct, bunker_change_pct, congestion_change_days, etc.

    Returns:
        Structured comparison between baseline and stressed scenario with financial deltas
        and executive decision guidance.
    """
    cargo_quantity = float(payload.get("cargo_quantity") or 400000)
    origin = str(payload.get("origin") or "Australia").title()
    destination = str(payload.get("destination") or "Dhamra").title()
    vessel_type = str(payload.get("vessel_type") or "Panamax").title()
    coverage_pct = float(payload.get("coverage") or 60.0)

    # Shocks
    freight_delta_pct = float(payload.get("freight_change_pct") or 0.0)
    bunker_delta_pct = float(payload.get("bunker_change_pct") or 0.0)
    congestion_delta_days = float(payload.get("congestion_change_days") or 0.0)

    # Base market values
    base_freight_usd = float(payload.get("baseline_freight") or 19.40)
    base_bunker_usd = float(payload.get("baseline_bunker") or 620.00)
    base_congestion_days = float(payload.get("baseline_congestion_days") or 4.2)
    daily_demurrage_usd = float(payload.get("daily_demurrage_usd") or 18500.0)

    # Number of standard shipments (e.g., Panamax ~75,000 MT per voyage)
    avg_parcel_size = 75000.0 if vessel_type.lower() == "panamax" else 55000.0 if vessel_type.lower() == "supramax" else 150000.0
    num_voyages = max(1, round(cargo_quantity / avg_parcel_size))

    # 1. Baseline Calculations
    base_freight_cost = cargo_quantity * base_freight_usd
    base_total_congestion_days = base_congestion_days * num_voyages
    base_demurrage_cost = base_total_congestion_days * daily_demurrage_usd
    # Typical Panamax burns ~28 MT/day at sea; ~15 days one-way steaming ~420 MT bunker per voyage
    bunker_consumption_per_voyage_mt = 420.0
    base_bunker_cost = num_voyages * bunker_consumption_per_voyage_mt * base_bunker_usd
    base_total_landed_cost = round(base_freight_cost + base_demurrage_cost, 2)

    # 2. Scenario Calculations
    shocked_freight_usd = round(base_freight_usd * (1.0 + freight_delta_pct / 100.0), 2)
    shocked_bunker_usd = round(base_bunker_usd * (1.0 + bunker_delta_pct / 100.0), 2)
    shocked_congestion_days = max(0.0, round(base_congestion_days + congestion_delta_days, 2))

    # Freight cost under coverage: hedged volume pays fixed baseline, unhedged spot pays shocked rate
    hedged_volume = (coverage_pct / 100.0) * cargo_quantity
    unhedged_volume = cargo_quantity - hedged_volume
    scenario_freight_cost = (hedged_volume * base_freight_usd) + (unhedged_volume * shocked_freight_usd)

    scenario_total_congestion_days = shocked_congestion_days * num_voyages
    scenario_demurrage_cost = scenario_total_congestion_days * daily_demurrage_usd
    scenario_bunker_cost = num_voyages * bunker_consumption_per_voyage_mt * shocked_bunker_usd
    scenario_total_landed_cost = round(scenario_freight_cost + scenario_demurrage_cost, 2)

    # 3. Deltas & Decision Impact
    cost_delta = round(scenario_total_landed_cost - base_total_landed_cost, 2)
    cost_delta_pct = round((cost_delta / base_total_landed_cost) * 100.0, 2) if base_total_landed_cost > 0 else 0.0

    # Savings from hedging (how much worse it would have been at 0% coverage)
    unhedged_worst_cost = (cargo_quantity * shocked_freight_usd) + scenario_demurrage_cost
    hedging_shield_savings = max(0.0, round(unhedged_worst_cost - scenario_total_landed_cost, 2))

    # Synthesize strategic advice
    advisory_points = []
    if freight_delta_pct > 5.0:
        advisory_points.append(
            f"Freight spike of +{freight_delta_pct:.1f}% increases unhedged exposure by "
            f"${(unhedged_volume * (shocked_freight_usd - base_freight_usd)):,.2f}. "
            f"Existing {coverage_pct:.0f}% coverage shields ${hedging_shield_savings:,.2f}."
        )
    if congestion_delta_days > 1.0:
        demurrage_diff = scenario_demurrage_cost - base_demurrage_cost
        advisory_points.append(
            f"Congestion delay of +{congestion_delta_days:.1f} days/port call adds ${demurrage_diff:,.2f} "
            f"in demurrage across {num_voyages} voyages. Consider diverting parcels to Gangavaram or Gopalpur."
        )
    if bunker_delta_pct > 5.0:
        advisory_points.append(
            f"Bunker fuel appreciation (+{bunker_delta_pct:.1f}%) creates carrier cost pressure. "
            f"Ensure standard BIMCO Bunker Adjustment Factor (BAF) clauses are enforced."
        )
    if not advisory_points:
        decision_impact = "Market conditions remain stable; baseline contract mix operates within expected operational tolerance."
    else:
        decision_impact = " ".join(advisory_points)

    return {
        "route_id": f"{origin} -> {destination}",
        "vessel_type": vessel_type,
        "cargo_quantity": cargo_quantity,
        "estimated_voyages": num_voyages,
        "coverage_pct": coverage_pct,
        "baseline": {
            "freight_rate_usd_mt": base_freight_usd,
            "freight_cost_usd": round(base_freight_cost, 2),
            "bunker_price_usd_mt": base_bunker_usd,
            "port_wait_days": base_congestion_days,
            "demurrage_cost_usd": round(base_demurrage_cost, 2),
            "total_landed_cost_usd": base_total_landed_cost,
        },
        "scenario": {
            "freight_rate_usd_mt": shocked_freight_usd,
            "freight_cost_usd": round(scenario_freight_cost, 2),
            "bunker_price_usd_mt": shocked_bunker_usd,
            "port_wait_days": shocked_congestion_days,
            "demurrage_cost_usd": round(scenario_demurrage_cost, 2),
            "total_landed_cost_usd": scenario_total_landed_cost,
        },
        "financial_deltas": {
            "total_cost_delta_usd": cost_delta,
            "total_cost_delta_pct": cost_delta_pct,
            "freight_delta_usd": round(scenario_freight_cost - base_freight_cost, 2),
            "demurrage_delta_usd": round(scenario_demurrage_cost - base_demurrage_cost, 2),
            "hedging_shield_savings_usd": hedging_shield_savings,
        },
        "decision_impact": decision_impact,
    }


if __name__ == "__main__":
    test_scenario = {
        "cargo_quantity": 400000,
        "origin": "Australia",
        "destination": "Dhamra",
        "vessel_type": "Panamax",
        "coverage": 60,
        "freight_change_pct": 8.0,
        "bunker_change_pct": 5.0,
        "congestion_change_days": 1.5,
    }
    import json
    print(json.dumps(run_scenario(test_scenario), indent=2))
