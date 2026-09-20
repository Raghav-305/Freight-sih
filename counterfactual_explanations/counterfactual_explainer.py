"""
Counterfactual Explainer
===========================
Fills the "Why This? Explainability" slot in the team's architecture (Layer 6).

WHAT THIS DOES:
Instead of just showing a prediction/recommendation, it answers:
"What is the smallest realistic change that would flip this decision?"

This is NOT a trained ML model -- it's a systematic perturbation search on top
of the existing Risk Engine and Charter Optimizer: nudge one input at a time,
re-run the real model, and report the smallest nudge that changes the outcome.

TWO FUNCTIONS, matching the two models this explains:

    from counterfactual_explainer import explain_risk, explain_charter

    explain_risk(route_id, origin_country, destination_port, date)
    explain_charter(origin_port, destination_port, vessel_class, cargo_quantity_mt, delivery_date)

Both return a dict with the baseline result plus a list of counterfactuals,
each showing what changed, by how much, and what the new outcome would be.
"""

try:
    from counterfactual_explanations import predict_risk as risk
    from counterfactual_explanations import optimize_charter as charter
except ImportError:
    try:
        from . import predict_risk as risk
        from . import optimize_charter as charter
    except ImportError:
        import predict_risk as risk
        import optimize_charter as charter


# ============================== RISK COUNTERFACTUALS ==============================

# Each sub-score is tested against a "best case" value (10 = baseline-low, matching
# the Risk Engine's own no-active-event floor) to see how much Overall would move.
_RISK_LEVERS = ["market", "port", "weather", "geopolitical", "supply", "contract"]


def explain_risk(route_id: str, origin_country: str, destination_port: str, date: str) -> dict:
    """
    Returns the baseline risk score plus, for each of the 6 sub-scores, what the
    Overall score would become if that one factor were resolved to a low-risk level
    -- ranked so the single biggest lever appears first.
    """
    baseline = risk.get_risk_score(route_id, origin_country, destination_port, date)

    counterfactuals = []
    for lever in _RISK_LEVERS:
        override_kwargs = {f"override_{lever}": 10.0}   # hypothetical: this factor resolves to low risk
        hypothetical = risk.get_risk_score(route_id, origin_country, destination_port, date, **override_kwargs)
        delta = baseline["overall"] - hypothetical["overall"]
        counterfactuals.append({
            "factor": lever,
            "current_score": baseline[lever],
            "if_resolved_overall_becomes": hypothetical["overall"],
            "overall_drops_by": round(delta, 1),
        })

    counterfactuals.sort(key=lambda c: c["overall_drops_by"], reverse=True)

    return {
        "baseline": baseline,
        "biggest_lever": counterfactuals[0]["factor"],
        "counterfactuals": counterfactuals,
    }


# ============================== CHARTER COUNTERFACTUALS ==============================

# Perturbation sizes to test, smallest first, for each lever -- the engine reports
# the SMALLEST one that actually changes the recommended mix.
_BUNKER_PCT_STEPS = [0.02, 0.05, 0.08, 0.12, 0.20]      # -2%, -5%, -8%, -12%, -20%
_CONGESTION_DAY_STEPS = [0.5, 1.0, 1.5, 2.0, 3.0]        # fewer days of waiting
_SPOT_RATE_PCT_STEPS = [0.02, 0.05, 0.08, 0.12, 0.20]    # spot rate moving down


def _mix_changed(mix_a: dict, mix_b: dict, threshold_pp: float = 5.0) -> bool:
    """True if any contract type's share moved by more than threshold_pp percentage points."""
    for key in mix_a:
        if abs(mix_a[key] - mix_b[key]) > threshold_pp:
            return True
    return False


def explain_charter(origin_port: str, destination_port: str, vessel_class: str,
                     cargo_quantity_mt: float, delivery_date: str) -> dict:
    """
    Returns the baseline recommendation plus a cost-sensitivity breakdown showing
    how much the optimized cost would change under realistic shifts in bunker price,
    congestion, and spot rate.

    NOTE (an honest, deliberate design choice): under the current cost model, the
    RECOMMENDED CONTRACT MIX rarely changes with price/congestion shifts alone --
    discounts are fixed percentages and other costs apply equally across contract
    types, so the ranking between contract types stays stable. What price and
    congestion changes DO move is the total cost. So this function reports cost
    sensitivity (a genuinely useful, honest signal) rather than searching for a
    mix "flip" that the model structurally won't produce from these levers.
    """
    baseline = charter.get_charter_recommendation(origin_port, destination_port, vessel_class,
                                                     cargo_quantity_mt, delivery_date)

    import pandas as pd
    base_bunker = charter._nearest(charter._bunker_by_date, pd.Timestamp(delivery_date))
    base_wait_hours = charter._wait_by_port.get(destination_port.upper(), charter._wait_by_port.mean())
    base_congestion_days = base_wait_hours / 24
    base_rate = baseline["avg_spot_rate_usd_mt"]

    sensitivity = []

    for pct in _BUNKER_PCT_STEPS:
        result = charter.get_charter_recommendation(origin_port, destination_port, vessel_class,
                                                       cargo_quantity_mt, delivery_date,
                                                       override_bunker_price=base_bunker * (1 - pct))
        sensitivity.append({
            "lever": "bunker_price", "change": f"-{pct*100:.0f}%",
            "new_cost_usd": result["optimized_cost_usd"],
            "saving_usd": baseline["optimized_cost_usd"] - result["optimized_cost_usd"],
            "mix_changed": _mix_changed(baseline["recommended_mix_pct"], result["recommended_mix_pct"]),
        })

    for days in _CONGESTION_DAY_STEPS:
        result = charter.get_charter_recommendation(origin_port, destination_port, vessel_class,
                                                       cargo_quantity_mt, delivery_date,
                                                       override_congestion_days=max(0.0, base_congestion_days - days))
        sensitivity.append({
            "lever": "congestion", "change": f"-{days:.1f} days",
            "new_cost_usd": result["optimized_cost_usd"],
            "saving_usd": baseline["optimized_cost_usd"] - result["optimized_cost_usd"],
            "mix_changed": _mix_changed(baseline["recommended_mix_pct"], result["recommended_mix_pct"]),
        })

    for pct in _SPOT_RATE_PCT_STEPS:
        result = charter.get_charter_recommendation(origin_port, destination_port, vessel_class,
                                                       cargo_quantity_mt, delivery_date,
                                                       override_spot_rate=base_rate * (1 - pct))
        sensitivity.append({
            "lever": "spot_rate", "change": f"-{pct*100:.0f}%",
            "new_cost_usd": result["optimized_cost_usd"],
            "saving_usd": baseline["optimized_cost_usd"] - result["optimized_cost_usd"],
            "mix_changed": _mix_changed(baseline["recommended_mix_pct"], result["recommended_mix_pct"]),
        })

    # the single most impactful lever, by $ saved at its largest tested step
    biggest = max(sensitivity, key=lambda s: s["saving_usd"])

    return {
        "baseline": baseline,
        "biggest_lever": biggest["lever"],
        "cost_sensitivity": sensitivity,
        "note": ("Contract mix is stable under these levers in the current cost model "
                 "(discounts are fixed %, other costs apply equally across contract types) "
                 "-- these levers move total cost, not which contracts are chosen. "
                 "Cargo volume relative to contract voyage caps is what actually changes the mix."),
    }


def simulate_risk_what_if(route_id: str, origin_country: str, destination_port: str, date: str,
                          overrides: dict = None) -> dict:
    """
    Run custom what-if hypothetical risk assessment with arbitrary sub-score overrides.
    """
    overrides = overrides or {}
    baseline = risk.get_risk_score(route_id, origin_country, destination_port, date)
    override_kwargs = {f"override_{k}": float(v) for k, v in overrides.items() if k in _RISK_LEVERS}
    simulated = risk.get_risk_score(route_id, origin_country, destination_port, date, **override_kwargs)
    delta = baseline["overall"] - simulated["overall"]
    return {
        "baseline": baseline,
        "simulated": simulated,
        "overrides_applied": overrides,
        "overall_delta": round(delta, 1),
        "impact_direction": "REDUCED" if delta > 0 else "INCREASED" if delta < 0 else "UNCHANGED",
    }


def simulate_charter_what_if(origin_port: str, destination_port: str, vessel_class: str,
                             cargo_quantity_mt: float, delivery_date: str,
                             bunker_pct_change: float = 0.0,
                             congestion_days_delta: float = 0.0,
                             spot_rate_pct_change: float = 0.0) -> dict:
    """
    Run custom what-if charter simulation with user-specified bunker %, congestion days, and spot rate % shifts.
    """
    baseline = charter.get_charter_recommendation(origin_port, destination_port, vessel_class,
                                                   cargo_quantity_mt, delivery_date)
    import pandas as pd
    base_bunker = charter._nearest(charter._bunker_by_date, pd.Timestamp(delivery_date))
    base_wait_hours = charter._wait_by_port.get(destination_port.upper(), charter._wait_by_port.mean())
    base_congestion_days = base_wait_hours / 24
    base_rate = baseline["avg_spot_rate_usd_mt"]

    sim_bunker = base_bunker * (1 + bunker_pct_change / 100.0) if bunker_pct_change != 0 else None
    sim_congestion = max(0.0, base_congestion_days + congestion_days_delta) if congestion_days_delta != 0 else None
    sim_rate = base_rate * (1 + spot_rate_pct_change / 100.0) if spot_rate_pct_change != 0 else None

    simulated = charter.get_charter_recommendation(
        origin_port, destination_port, vessel_class, cargo_quantity_mt, delivery_date,
        override_bunker_price=sim_bunker,
        override_congestion_days=sim_congestion,
        override_spot_rate=sim_rate,
    )

    cost_diff = baseline["optimized_cost_usd"] - simulated["optimized_cost_usd"]
    return {
        "baseline": baseline,
        "simulated": simulated,
        "shifts": {
            "bunker_pct_change": bunker_pct_change,
            "congestion_days_delta": congestion_days_delta,
            "spot_rate_pct_change": spot_rate_pct_change,
        },
        "saving_usd": round(cost_diff),
        "mix_changed": _mix_changed(baseline["recommended_mix_pct"], simulated["recommended_mix_pct"]),
    }


if __name__ == "__main__":
    print("=== RISK COUNTERFACTUAL (Russia route during the war) ===")
    r = explain_risk("RUS_PAR_PAN", "Russia", "PAR", "2022-06-19")
    print("Baseline overall:", r["baseline"]["overall"])
    print("Biggest lever:", r["biggest_lever"])
    for cf in r["counterfactuals"]:
        print(f"  If {cf['factor']} resolved -> overall becomes {cf['if_resolved_overall_becomes']} "
              f"(drops by {cf['overall_drops_by']})")

    print("\n=== CHARTER COST SENSITIVITY (Gladstone -> Paradip) ===")
    c = explain_charter("Gladstone", "PAR", "Panamax", 480_000, "2024-06-15")
    print("Baseline mix:", c["baseline"]["recommended_mix_pct"])
    print("Baseline cost:", c["baseline"]["optimized_cost_usd"])
    print("Biggest lever:", c["biggest_lever"])
    for s in c["cost_sensitivity"]:
        print(f"  {s['lever']} {s['change']}: cost ${s['new_cost_usd']:,} (saves ${s['saving_usd']:,}), "
              f"mix changed: {s['mix_changed']}")
    print("\nNote:", c["note"])
