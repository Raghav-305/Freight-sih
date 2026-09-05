"""Automated tests for Linear Programming charter strategy optimizer."""

import pytest
from optimization.charter_strategy import get_charter_recommendation, normalize_ports, _load_tables


def test_charter_strategy_lp_optimal_solution():
    """Verify that the HiGHS linear programming solver produces a feasible, optimal recommendation."""
    result = get_charter_recommendation(
        origin_port="Gladstone",
        destination_port="Dhamra",
        vessel_class="Panamax",
        cargo_quantity_mt=480_000,
        delivery_date="2026-10-15",
        max_share=0.5,
    )

    assert result["origin_port"] == "Gladstone"
    assert result["destination_port"] == "DHA"
    assert result["destination_port_name"] == "Dhamra"
    assert result["vessel_class"] == "Panamax"
    assert result["voyages_needed"] == 7
    assert result["distance_nm"] > 4000
    assert result["voyage_duration_days"] > 20.0

    # Economic assertions
    assert result["current_plan_cost_usd"] > 0
    assert result["optimized_cost_usd"] > 0
    assert result["optimized_cost_usd"] <= result["current_plan_cost_usd"]
    assert result["expected_saving_usd"] >= 0
    assert result["expected_saving_pct"] >= 0.0

    # Allocation assertions
    mix = result["recommended_mix"]
    assert "Spot" in mix
    assert "3-voyage contract" in mix
    assert "6-voyage COA" in mix
    assert "12-voyage COA" in mix

    total_voyages = sum(mix.values())
    assert total_voyages >= result["voyages_needed"] - 0.01

    # Diversification cap check: no structure should exceed max_share * voyages_needed (with rounding tolerance)
    for name, v in mix.items():
        assert v <= (result["voyages_needed"] * 0.5) + 0.1

    # Cost breakdown checks
    cb = result["cost_breakdown_per_voyage"]
    assert cb["freight_base_usd"] > 0
    assert cb["bunker_cost_usd"] > 0
    assert cb["congestion_cost_usd"] >= 0
    assert cb["idle_cost_usd"] > 0
    assert cb["deadhead_cost_usd"] > 0
    assert cb["risk_penalty_usd"] > 0


def test_charter_strategy_capesize_and_different_ports():
    """Test with Capesize bulker and alternative origin/destination."""
    result = get_charter_recommendation(
        origin_port="Newcastle",
        destination_port="PAR",  # Using code directly
        vessel_class="Capesize",
        cargo_quantity_mt=500_000,
        delivery_date="2026-11-01",
        max_share=0.6,
    )

    assert result["origin_port"] == "Newcastle"
    assert result["destination_port"] == "PAR"
    assert result["destination_port_name"] == "Paradip"
    assert result["vessel_class"] == "Capesize"
    assert result["voyages_needed"] > 0
    assert result["optimized_cost_usd"] <= result["current_plan_cost_usd"]


def test_charter_strategy_normalization_and_aliases():
    """Verify origin country aliases and case-insensitive port names resolve correctly."""
    coords, _, _, _, _, _ = _load_tables()

    orig, dest_code, dest_name = normalize_ports("Australia", "dhamra", coords)
    assert orig == "Gladstone"
    assert dest_code == "DHA"
    assert dest_name == "Dhamra"

    orig2, dest_code2, dest_name2 = normalize_ports("Taboneo", "HAL", coords)
    assert orig2 == "Taboneo"
    assert dest_code2 == "HAL"
    assert dest_name2 == "Haldia"
