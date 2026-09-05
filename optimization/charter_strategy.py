"""Charter Strategy / Contract Optimizer Module.

Roadmap reference: Phase 35-38 ("Contract optimizer" + "What-if simulator")

WHAT THIS DOES:
Given a dry bulk cargo requirement, decides how to split it across contract types
(Spot / 3-voyage contract / 6-voyage COA / 12-voyage COA) to minimize total procurement cost:

    MINIMIZE: freight_cost + bunker_cost + congestion_cost + idle_cost
              + deadhead_cost + risk_penalty
    SUBJECT TO: cargo demand, vessel capacity, contract voyage caps,
                and diversification cap (no single contract type > max_share of voyages)

Solves using a Linear Program (scipy.optimize.linprog with the HiGHS solver).
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.optimize import linprog

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "charter_strategy"


@lru_cache(maxsize=1)
def _load_tables() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.DataFrame]:
    coords = pd.read_csv(DATA_DIR / "port_coordinates.csv").set_index("port_name")
    route_stats = pd.read_csv(DATA_DIR / "route_freight_lookup.csv").set_index("route_id")
    freight_by_date = pd.read_csv(DATA_DIR / "freight_by_date_route.csv", parse_dates=["date"])
    bunker_by_date = pd.read_csv(DATA_DIR / "bunker_by_date.csv", parse_dates=["date"]).set_index("date")["avg_vlsfo_price"]
    wait_by_port = pd.read_csv(DATA_DIR / "wait_by_port.csv").set_index("port_id")["avg_wait_hours"]
    vessel_specs = pd.read_csv(DATA_DIR / "vessel_specs.csv").set_index("vessel_type")
    return coords, route_stats, freight_by_date, bunker_by_date, wait_by_port, vessel_specs


_VESSEL_CODE = {"Panamax": "PAN", "Capesize": "CAP"}

# Mapping country aliases to default major loading ports
_COUNTRY_TO_PORT = {
    "australia": "Gladstone",
    "indonesia": "Taboneo",
    "usa": "Hampton Roads",
    "united states": "Hampton Roads",
    "mozambique": "Beira",
    "russia": "Vostochny (Far East)",
    "south africa": "Richards Bay",
}


def _haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in nautical miles."""
    r_nm = 3440.065
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return float(r_nm * 2 * np.arcsin(np.sqrt(a)))


def _nearest(series: pd.Series, target_date: pd.Timestamp) -> float:
    """Find nearest observation in a time series."""
    if series.empty:
        return 0.0
    idx = (series.index - target_date).to_series().abs().argmin()
    return float(series.iloc[idx])


def normalize_ports(origin: str, destination: str, coords: pd.DataFrame) -> tuple[str, str, str]:
    """Resolve user-supplied port names or codes to valid origin and destination keys."""
    # Resolve Origin
    origin_clean = origin.strip()
    valid_origins = coords[coords["country"] != "India"].index.tolist()
    valid_origins_map = {p.lower(): p for p in valid_origins}

    resolved_origin = None
    if origin_clean.lower() in valid_origins_map:
        resolved_origin = valid_origins_map[origin_clean.lower()]
    elif origin_clean.lower() in _COUNTRY_TO_PORT:
        candidate = _COUNTRY_TO_PORT[origin_clean.lower()]
        if candidate in valid_origins_map.values():
            resolved_origin = candidate

    if not resolved_origin:
        # Partial match
        for key, orig in valid_origins_map.items():
            if origin_clean.lower() in key:
                resolved_origin = orig
                break

    if not resolved_origin:
        resolved_origin = "Gladstone"  # Standard bulk origin default

    # Resolve Destination
    dest_clean = destination.strip()
    india_ports = coords[coords["country"] == "India"]
    dest_code_map = {row["port_code"].upper(): row["port_code"].upper() for _, row in india_ports.iterrows()}
    dest_name_map = {idx.lower(): row["port_code"].upper() for idx, row in india_ports.iterrows()}

    resolved_dest_code = None
    if dest_clean.upper() in dest_code_map:
        resolved_dest_code = dest_code_map[dest_clean.upper()]
    elif dest_clean.lower() in dest_name_map:
        resolved_dest_code = dest_name_map[dest_clean.lower()]
    else:
        # Partial match
        for key, code in dest_name_map.items():
            if dest_clean.lower() in key:
                resolved_dest_code = code
                break

    if not resolved_dest_code:
        resolved_dest_code = "DHA"  # Default to Dhamra Port

    dest_port_name = india_ports[india_ports["port_code"] == resolved_dest_code].index[0]
    return resolved_origin, resolved_dest_code, dest_port_name


def get_charter_recommendation(
    origin_port: str = "Gladstone",
    destination_port: str = "Dhamra",
    vessel_class: str = "Panamax",
    cargo_quantity_mt: float = 480_000.0,
    delivery_date: str = "2026-10-15",
    max_share: float = 0.5,
) -> dict[str, Any]:
    """Compute the recommended contract-type mix and expected costs/savings via HiGHS Linear Programming.

    Args:
        origin_port: Load port name or country (e.g. 'Gladstone', 'Newcastle', 'Australia')
        destination_port: Discharge port code or name (e.g. 'Dhamra', 'DHA', 'Paradip', 'PAR')
        vessel_class: Bulker vessel class ('Panamax' or 'Capesize')
        cargo_quantity_mt: Total cargo commitment in Metric Tons (e.g. 480,000)
        delivery_date: Target delivery/laycan date 'YYYY-MM-DD'
        max_share: Diversification cap; no single contract type can exceed this share of voyages (default 0.5)

    Returns:
        Dictionary containing voyage counts, contract mix, baseline vs optimal costs,
        net savings, nautical distance, and voyage cost breakdown.
    """
    coords, route_stats, freight_by_date, bunker_by_date, wait_by_port, vessel_specs = _load_tables()

    # Normalize inputs
    origin_resolved, dest_code_resolved, dest_name_resolved = normalize_ports(origin_port, destination_port, coords)

    vessel_class_clean = vessel_class.strip().capitalize()
    if vessel_class_clean not in ["Panamax", "Capesize"]:
        vessel_class_clean = "Panamax"

    date_ts = pd.Timestamp(delivery_date) if delivery_date else pd.Timestamp.now()
    origin_code = coords.loc[origin_resolved, "port_code"]
    route_id = f"{origin_code}_{dest_code_resolved}_{_VESSEL_CODE[vessel_class_clean]}"

    v = vessel_specs.loc[vessel_class_clean]
    cargo_per_voyage = float(v["dwt"]) * 0.92

    distance_nm = _haversine_nm(
        float(coords.loc[origin_resolved, "latitude"]),
        float(coords.loc[origin_resolved, "longitude"]),
        float(coords.loc[dest_name_resolved, "latitude"]),
        float(coords.loc[dest_name_resolved, "longitude"]),
    )
    laden_days = distance_nm / (float(v["speed_laden"]) * 24.0)
    ballast_days = distance_nm / (float(v["speed_ballast"]) * 24.0)
    voyage_days = laden_days + ballast_days

    # Date-aware freight rate: nearest real observation for this route, falling back to route average
    route_hist = freight_by_date[freight_by_date["route_id"] == route_id].set_index("date")["freight_usd_mt"]
    if len(route_hist) > 0:
        avg_spot_rate = _nearest(route_hist, date_ts)
    else:
        avg_spot_rate = float(route_stats["avg_freight_usd_mt"].mean())

    avg_bunker_price = _nearest(bunker_by_date, date_ts)
    if avg_bunker_price <= 0:
        avg_bunker_price = float(bunker_by_date.mean())

    avg_wait_hours = float(wait_by_port.get(dest_code_resolved, wait_by_port.mean()))
    congestion_days = avg_wait_hours / 24.0

    n_voyages_needed = int(np.ceil(cargo_quantity_mt / cargo_per_voyage))
    if n_voyages_needed < 1:
        n_voyages_needed = 1

    # Component costs per voyage
    bunker_tons = float(v["fuel_consumption_laden"]) * laden_days + float(v["fuel_consumption_ballast"]) * ballast_days
    bunker_cost_per_voyage = bunker_tons * avg_bunker_price
    congestion_cost_per_voyage = congestion_days * (avg_spot_rate * cargo_per_voyage / voyage_days)
    idle_cost_per_voyage = 1.5 * (avg_spot_rate * cargo_per_voyage / voyage_days)
    deadhead_cost_per_voyage = float(v["fuel_consumption_ballast"]) * ballast_days * avg_bunker_price
    risk_penalty_per_voyage = 0.02 * avg_spot_rate * cargo_per_voyage

    fixed_cost_per_voyage = (
        bunker_cost_per_voyage
        + congestion_cost_per_voyage
        + idle_cost_per_voyage
        + deadhead_cost_per_voyage
        + risk_penalty_per_voyage
    )

    contract_types = {
        "Spot": {"discount": 0.00, "max_voyages": n_voyages_needed},
        "3-voyage contract": {"discount": 0.03, "max_voyages": 3},
        "6-voyage COA": {"discount": 0.06, "max_voyages": 6},
        "12-voyage COA": {"discount": 0.09, "max_voyages": 12},
    }
    names = list(contract_types.keys())
    total_cost_per_voyage = {
        name: avg_spot_rate * (1.0 - c["discount"]) * cargo_per_voyage + fixed_cost_per_voyage
        for name, c in contract_types.items()
    }

    c_coef = [total_cost_per_voyage[name] for name in names]
    A_ub = [[-1.0] * len(names)]
    b_ub = [-float(n_voyages_needed)]
    bounds = [
        (0.0, float(min(contract_types[name]["max_voyages"], max(1.0, n_voyages_needed * max_share))))
        for name in names
    ]

    res = linprog(c_coef, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")

    current_plan_cost = total_cost_per_voyage["Spot"] * n_voyages_needed
    optimal_cost = float(res.fun) if res.success else current_plan_cost
    voyage_solution = res.x if res.success else [float(n_voyages_needed), 0.0, 0.0, 0.0]

    # Calculate percentages
    recommended_mix = {name: round(float(v_), 1) for name, v_ in zip(names, voyage_solution)}
    total_alloc_voyages = sum(recommended_mix.values()) or float(n_voyages_needed)
    recommended_mix_pct = {
        name: round((float(v_) / total_alloc_voyages) * 100.0, 1) for name, v_ in zip(names, voyage_solution)
    }

    expected_saving = max(0.0, current_plan_cost - optimal_cost)
    expected_saving_pct = round((expected_saving / current_plan_cost) * 100.0, 2) if current_plan_cost > 0 else 0.0

    return {
        "origin_port": origin_resolved,
        "destination_port": dest_code_resolved,
        "destination_port_name": dest_name_resolved,
        "vessel_class": vessel_class_clean,
        "cargo_quantity_mt": cargo_quantity_mt,
        "delivery_date": str(date_ts.date()),
        "distance_nm": round(distance_nm),
        "voyage_duration_days": round(voyage_days, 1),
        "cargo_per_voyage_mt": round(cargo_per_voyage),
        "voyages_needed": n_voyages_needed,
        "avg_spot_rate_usd_mt": round(float(avg_spot_rate), 2),
        "avg_bunker_price_usd_mt": round(float(avg_bunker_price), 2),
        "recommended_mix": recommended_mix,
        "recommended_mix_pct": recommended_mix_pct,
        "current_plan_cost_usd": round(current_plan_cost),
        "optimized_cost_usd": round(optimal_cost),
        "expected_saving_usd": round(expected_saving),
        "expected_saving_pct": expected_saving_pct,
        "cost_breakdown_per_voyage": {
            "freight_base_usd": round(avg_spot_rate * cargo_per_voyage),
            "bunker_cost_usd": round(bunker_cost_per_voyage),
            "congestion_cost_usd": round(congestion_cost_per_voyage),
            "idle_cost_usd": round(idle_cost_per_voyage),
            "deadhead_cost_usd": round(deadhead_cost_per_voyage),
            "risk_penalty_usd": round(risk_penalty_per_voyage),
            "fixed_operating_usd": round(fixed_cost_per_voyage),
        },
        "linear_programming_status": "OPTIMAL" if res.success else "FALLBACK",
        "solver": "scipy.optimize.linprog:highs",
    }
