"""
Charter Strategy / Contract Optimizer
========================================
Roadmap reference: Phase 35-38 (pages 27-28, "Contract optimizer" + "What-if simulator")

WHAT THIS DOES:
Given a cargo requirement, decides how to split it across contract types
(Spot / 3-voyage contract / 6-voyage COA / 12-voyage COA) to minimize total cost:

    MINIMIZE: freight_cost + bunker_cost + congestion_cost + idle_cost
              + deadhead_cost + risk_penalty
    SUBJECT TO: cargo demand, vessel capacity, contract voyage caps,
                a diversification cap (no single contract type > max_share of voyages)

NOT a trained ML model -- this is a Linear Program (scipy.optimize.linprog) built on
top of your other models' outputs (freight rates, bunker prices, congestion).

INTEGRATION POINT:
    from optimize_charter import get_charter_recommendation
    result = get_charter_recommendation(origin_port, destination_port, vessel_class,
                                          cargo_quantity_mt, delivery_date)

REAL USER INPUTS (matches Phase 38's own spec: "cargo quantity, origin, destination,
delivery date" -- vessel_class added since it's needed to select the right vessel specs
and route lookup):
    - origin_port         : one of VALID_ORIGIN_PORTS (e.g. "Gladstone")
    - destination_port    : one of VALID_DEST_PORTS ("DHA"/"GAN"/"GOP"/"HAL"/"PAR"/"VIZ")
    - vessel_class        : "Panamax" or "Capesize"
    - cargo_quantity_mt   : total cargo requirement, e.g. 480000
    - delivery_date       : "YYYY-MM-DD" -- used to pick the nearest real freight/bunker price

EVERYTHING ELSE LOOKED UP AUTOMATICALLY:
    - Distance (great-circle, from port_coordinates.csv)
    - Freight rate for that route near that date (freight_by_date_route.csv)
    - Bunker price near that date (bunker_by_date.csv)
    - Average congestion wait at the destination (wait_by_port.csv)
    - Vessel physical specs for that class (vessel_specs.csv)

OUTPUT:
    dict with the recommended voyage split across contract types, current-plan
    (100% spot) cost, optimized cost, and expected saving.
"""

import pandas as pd
import numpy as np
from scipy.optimize import linprog
import os

_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_DIR, ".."))
_CANONICAL_DIR = os.path.join(_PROJECT_ROOT, "data", "charter_strategy")

def _get_path(filename: str) -> str:
    canonical = os.path.join(_CANONICAL_DIR, filename)
    if os.path.exists(canonical):
        return canonical
    return os.path.join(_DIR, filename)

_coords = pd.read_csv(_get_path("port_coordinates.csv")).set_index("port_name")
_route_stats = pd.read_csv(_get_path("route_freight_lookup.csv")).set_index("route_id")
_freight_by_date = pd.read_csv(_get_path("freight_by_date_route.csv"), parse_dates=["date"])
_bunker_by_date = pd.read_csv(_get_path("bunker_by_date.csv"), parse_dates=["date"]).set_index("date")["avg_vlsfo_price"]
_wait_by_port = pd.read_csv(_get_path("wait_by_port.csv")).set_index("port_id")["avg_wait_hours"]
_vessel_specs = pd.read_csv(_get_path("vessel_specs.csv")).set_index("vessel_type")

VALID_ORIGIN_PORTS = _coords[_coords["country"] != "India"].index.tolist()
VALID_DEST_PORTS = _coords[_coords["country"] == "India"]["port_code"].tolist()
VALID_VESSEL_CLASSES = ["Panamax", "Capesize"]

_VESSEL_CODE = {"Panamax": "PAN", "Capesize": "CAP"}


def _haversine_nm(lat1, lon1, lat2, lon2):
    R = 3440.065
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return R * 2 * np.arcsin(np.sqrt(a))


def _nearest(series: pd.Series, target_date: pd.Timestamp):
    idx = (series.index - target_date).to_series().abs().argmin()
    return series.iloc[idx]


_COUNTRY_TO_PORT = {
    "australia": "Gladstone",
    "indonesia": "Taboneo",
    "usa": "Hampton Roads",
    "united states": "Hampton Roads",
    "mozambique": "Beira",
    "russia": "Vostochny (Far East)",
    "south africa": "Richards Bay",
}


def _normalize_ports(origin: str, destination: str) -> tuple[str, str, str]:
    origin_clean = origin.strip()
    valid_origins_map = {p.lower(): p for p in VALID_ORIGIN_PORTS}
    resolved_origin = None
    if origin_clean.lower() in valid_origins_map:
        resolved_origin = valid_origins_map[origin_clean.lower()]
    elif origin_clean.lower() in _COUNTRY_TO_PORT:
        resolved_origin = _COUNTRY_TO_PORT[origin_clean.lower()]
    else:
        for key, orig in valid_origins_map.items():
            if origin_clean.lower() in key:
                resolved_origin = orig
                break
    if not resolved_origin:
        resolved_origin = "Gladstone"

    dest_clean = destination.strip()
    india_ports = _coords[_coords["country"] == "India"]
    dest_code_map = {row["port_code"].upper(): row["port_code"].upper() for _, row in india_ports.iterrows()}
    dest_name_map = {idx.lower(): row["port_code"].upper() for idx, row in india_ports.iterrows()}

    resolved_dest_code = None
    if dest_clean.upper() in dest_code_map:
        resolved_dest_code = dest_code_map[dest_clean.upper()]
    elif dest_clean.lower() in dest_name_map:
        resolved_dest_code = dest_name_map[dest_clean.lower()]
    else:
        for key, code in dest_name_map.items():
            if dest_clean.lower() in key:
                resolved_dest_code = code
                break
    if not resolved_dest_code:
        resolved_dest_code = "PAR"

    dest_port_name = india_ports[india_ports["port_code"] == resolved_dest_code].index[0]
    return resolved_origin, resolved_dest_code, dest_port_name


def get_charter_recommendation(origin_port: str, destination_port: str, vessel_class: str,
                                 cargo_quantity_mt: float, delivery_date: str,
                                 max_share: float = 0.5,
                                 override_bunker_price: float = None,
                                 override_congestion_days: float = None,
                                 override_spot_rate: float = None) -> dict:
    """
    Compute the recommended contract-type mix + expected cost/saving for a given
    cargo requirement, matching Phase 35-38's Contract Optimizer / What-if simulator.

    The override_* parameters let a caller substitute a hypothetical bunker price,
    congestion level, or spot rate (used by the counterfactual explainer to ask
    "what if bunker price dropped 8%?" without needing a fake historical date).
    Leave as None for normal use.
    """
    origin_port, destination_port, dest_port_name = _normalize_ports(origin_port, destination_port)
    vessel_class = vessel_class.strip().capitalize()
    if vessel_class not in VALID_VESSEL_CLASSES:
        vessel_class = "Panamax"

    date_ts = pd.Timestamp(delivery_date) if delivery_date else pd.Timestamp.now()
    origin_code = _coords.loc[origin_port, "port_code"]
    route_id = f"{origin_code}_{destination_port}_{_VESSEL_CODE[vessel_class]}"

    v = _vessel_specs.loc[vessel_class]
    cargo_per_voyage = v["dwt"] * 0.92

    distance_nm = _haversine_nm(_coords.loc[origin_port, "latitude"], _coords.loc[origin_port, "longitude"],
                                  _coords.loc[dest_port_name, "latitude"], _coords.loc[dest_port_name, "longitude"])
    laden_days = distance_nm / (v["speed_laden"] * 24)
    ballast_days = distance_nm / (v["speed_ballast"] * 24)
    voyage_days = laden_days + ballast_days

    if override_spot_rate is not None:
        avg_spot_rate = override_spot_rate
    else:
        route_hist = _freight_by_date[_freight_by_date["route_id"] == route_id].set_index("date")["freight_usd_mt"]
        if len(route_hist) > 0:
            avg_spot_rate = _nearest(route_hist, date_ts)
        else:
            avg_spot_rate = _route_stats["avg_freight_usd_mt"].mean()

    avg_bunker_price = _nearest(_bunker_by_date, date_ts) if override_bunker_price is None else override_bunker_price
    if override_congestion_days is not None:
        congestion_days = override_congestion_days
    else:
        avg_wait_hours = _wait_by_port.get(destination_port, _wait_by_port.mean())
        congestion_days = avg_wait_hours / 24

    n_voyages_needed = int(np.ceil(cargo_quantity_mt / cargo_per_voyage))

    bunker_tons = v["fuel_consumption_laden"] * laden_days + v["fuel_consumption_ballast"] * ballast_days
    bunker_cost_per_voyage = bunker_tons * avg_bunker_price
    congestion_cost_per_voyage = congestion_days * (avg_spot_rate * cargo_per_voyage / voyage_days)
    idle_cost_per_voyage = 1.5 * (avg_spot_rate * cargo_per_voyage / voyage_days)
    deadhead_cost_per_voyage = v["fuel_consumption_ballast"] * ballast_days * avg_bunker_price
    risk_penalty_per_voyage = 0.02 * avg_spot_rate * cargo_per_voyage

    fixed_cost_per_voyage = (bunker_cost_per_voyage + congestion_cost_per_voyage +
                              idle_cost_per_voyage + deadhead_cost_per_voyage + risk_penalty_per_voyage)

    contract_types = {
        "Spot": {"discount": 0.00, "max_voyages": n_voyages_needed},
        "3-voyage contract": {"discount": 0.03, "max_voyages": 3},
        "6-voyage COA": {"discount": 0.06, "max_voyages": 6},
        "12-voyage COA": {"discount": 0.09, "max_voyages": 12},
    }
    names = list(contract_types.keys())
    total_cost_per_voyage = {
        name: avg_spot_rate * (1 - c["discount"]) * cargo_per_voyage + fixed_cost_per_voyage
        for name, c in contract_types.items()
    }

    c_coef = [total_cost_per_voyage[name] for name in names]
    A_ub = [[-1] * len(names)]
    b_ub = [-n_voyages_needed]
    bounds = [(0, min(contract_types[name]["max_voyages"], n_voyages_needed * max_share)) for name in names]

    res = linprog(c_coef, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")

    current_plan_cost = total_cost_per_voyage["Spot"] * n_voyages_needed
    optimal_cost = float(res.fun)

    return {
        "origin_port": origin_port,
        "destination_port": destination_port,
        "destination_port_name": dest_port_name,
        "vessel_class": vessel_class,
        "cargo_quantity_mt": cargo_quantity_mt,
        "delivery_date": delivery_date,
        "distance_nm": round(distance_nm),
        "voyages_needed": n_voyages_needed,
        "avg_spot_rate_usd_mt": round(float(avg_spot_rate), 2),
        "recommended_mix": {name: round(float(v_), 1) for name, v_ in zip(names, res.x)},
        "recommended_mix_pct": {name: round(float(v_) / n_voyages_needed * 100, 1) for name, v_ in zip(names, res.x)},
        "current_plan_cost_usd": round(current_plan_cost),
        "optimized_cost_usd": round(optimal_cost),
        "expected_saving_usd": round(current_plan_cost - optimal_cost),
    }


if __name__ == "__main__":
    # Quick manual test -- run `python optimize_charter.py` to sanity-check the package works
    result = get_charter_recommendation("Gladstone", "PAR", "Panamax", 480_000, "2024-06-15")
    for k, v in result.items():
        print(f"{k}: {v}")
