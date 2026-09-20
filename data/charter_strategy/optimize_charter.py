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

_coords = pd.read_csv(os.path.join(_DIR, "port_coordinates.csv")).set_index("port_name")
_route_stats = pd.read_csv(os.path.join(_DIR, "route_freight_lookup.csv")).set_index("route_id")
_freight_by_date = pd.read_csv(os.path.join(_DIR, "freight_by_date_route.csv"), parse_dates=["date"])
_bunker_by_date = pd.read_csv(os.path.join(_DIR, "bunker_by_date.csv"), parse_dates=["date"]).set_index("date")["avg_vlsfo_price"]
_wait_by_port = pd.read_csv(os.path.join(_DIR, "wait_by_port.csv")).set_index("port_id")["avg_wait_hours"]
_vessel_specs = pd.read_csv(os.path.join(_DIR, "vessel_specs.csv")).set_index("vessel_type")

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


def get_charter_recommendation(origin_port: str, destination_port: str, vessel_class: str,
                                 cargo_quantity_mt: float, delivery_date: str,
                                 max_share: float = 0.5) -> dict:
    """
    Compute the recommended contract-type mix + expected cost/saving for a given
    cargo requirement, matching Phase 35-38's Contract Optimizer / What-if simulator.
    """
    if origin_port not in VALID_ORIGIN_PORTS:
        raise ValueError(f"Unknown origin_port '{origin_port}'. Valid: {VALID_ORIGIN_PORTS}")
    destination_port = destination_port.upper().strip()
    if destination_port not in VALID_DEST_PORTS:
        raise ValueError(f"Unknown destination_port '{destination_port}'. Valid: {VALID_DEST_PORTS}")
    if vessel_class not in VALID_VESSEL_CLASSES:
        raise ValueError(f"Unknown vessel_class '{vessel_class}'. Valid: {VALID_VESSEL_CLASSES}")

    date_ts = pd.Timestamp(delivery_date)
    origin_code = _coords.loc[origin_port, "port_code"]
    dest_port_name = _coords[_coords["port_code"] == destination_port].index[0]
    route_id = f"{origin_code}_{destination_port}_{_VESSEL_CODE[vessel_class]}"

    v = _vessel_specs.loc[vessel_class]
    cargo_per_voyage = v["dwt"] * 0.92

    distance_nm = _haversine_nm(_coords.loc[origin_port, "latitude"], _coords.loc[origin_port, "longitude"],
                                  _coords.loc[dest_port_name, "latitude"], _coords.loc[dest_port_name, "longitude"])
    laden_days = distance_nm / (v["speed_laden"] * 24)
    ballast_days = distance_nm / (v["speed_ballast"] * 24)
    voyage_days = laden_days + ballast_days

    # date-aware freight rate: nearest real observation for this exact route, falling back to the route's overall average
    route_hist = _freight_by_date[_freight_by_date["route_id"] == route_id].set_index("date")["freight_usd_mt"]
    if len(route_hist) > 0:
        avg_spot_rate = _nearest(route_hist, date_ts)
    else:
        avg_spot_rate = _route_stats["avg_freight_usd_mt"].mean()

    avg_bunker_price = _nearest(_bunker_by_date, date_ts)
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
