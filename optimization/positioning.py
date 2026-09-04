"""Vessel Ballast Positioning & Laycan ETA Feasibility Module.

Evaluates steaming duration, ballast legs, and arrival timing against charterparty laycan
cancellation dates (BIMCO Cancelling Clause 10). Recommends eco-speed or full-steam settings.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

# Representative nautical mile distances between ballast positioning hubs and major load ports
DISTANCES_NM: dict[tuple[str, str], float] = {
    ("singapore", "gladstone"): 3420.0,
    ("singapore", "newcastle"): 3950.0,
    ("singapore", "hay point"): 3380.0,
    ("colombo", "gladstone"): 4620.0,
    ("colombo", "richards bay"): 3680.0,
    ("dhamra", "gladstone"): 4980.0,
    ("dhamra", "newcastle"): 5420.0,
    ("paradip", "gladstone"): 4950.0,
    ("paradip", "newcastle"): 5390.0,
    ("vizag", "gladstone"): 4890.0,
    ("shanghai", "newcastle"): 4750.0,
    ("shanghai", "gladstone"): 4200.0,
    ("singapore", "tanjung bara"): 650.0,
    ("dhamra", "tanjung bara"): 2350.0,
}


def recommend_positioning(payload: dict[str, Any]) -> dict[str, Any]:
    """Calculate ballast transit time, ETA, and laycan adherence.

    Args:
        payload: Dictionary containing vessel_name, current_port, load_port,
                 laycan_start, laycan_end, speed_knots, etc.

    Returns:
        Structured positioning recommendation with ETA, transit days, fuel advisory,
        and laycan feasibility status.
    """
    vessel_name = str(payload.get("vessel_name") or payload.get("vessel_type") or "Panamax Lead")
    current_port = str(payload.get("current_port") or payload.get("origin") or "Singapore").strip().lower()
    load_port = str(payload.get("load_port") or payload.get("destination") or "Gladstone").strip().lower()
    speed_knots = float(payload.get("speed_knots") or 13.5)

    as_of_str = payload.get("as_of_date")
    as_of_date = datetime.strptime(as_of_str, "%Y-%m-%d") if as_of_str else datetime.now()

    laycan_start_str = payload.get("laycan_start") or (as_of_date + timedelta(days=15)).strftime("%Y-%m-%d")
    laycan_end_str = payload.get("laycan_end") or (as_of_date + timedelta(days=25)).strftime("%Y-%m-%d")

    laycan_start = datetime.strptime(laycan_start_str, "%Y-%m-%d")
    laycan_end = datetime.strptime(laycan_end_str, "%Y-%m-%d")

    # Lookup distance or provide sensible default based on maritime oceanic route
    distance = DISTANCES_NM.get((current_port, load_port)) or DISTANCES_NM.get((load_port, current_port))
    if not distance:
        distance = 3800.0  # standard oceanic ballast leg default

    # Steaming duration + weather allowance (1.0 day buffer for maritime sea margin)
    steaming_hours = distance / speed_knots
    steaming_days = round((steaming_hours / 24.0) + 1.0, 1)

    eta = as_of_date + timedelta(days=steaming_days)
    eta_str = eta.strftime("%Y-%m-%d")

    # Evaluation against laycan window
    if eta < laycan_start:
        early_days = round((laycan_start - eta).total_seconds() / 86400.0, 1)
        status = "EARLY_ARRIVAL"
        recommendation = "REDUCE SPEED (ECO-STEAMING)"
        action_plan = (
            f"Vessel arrives {early_days} days ahead of laycan opening ({laycan_start_str}). "
            f"Slow steam at 11.5 knots to conserve ~18% bunker fuel without risking laycan date."
        )
    elif laycan_start <= eta <= laycan_end:
        status = "ON_SCHEDULE"
        recommendation = "MAINTAIN CURRENT POSITIONING"
        action_plan = (
            f"ETA ({eta_str}) falls directly within laycan window ({laycan_start_str} to {laycan_end_str}). "
            f"Maintain standard cruising speed of {speed_knots} knots. Optimal fix candidate."
        )
    else:
        late_days = round((eta - laycan_end).total_seconds() / 86400.0, 1)
        status = "CANCELLING_RISK"
        recommendation = "INCREASE SPEED / ALTERNATIVE BALLAST"
        action_plan = (
            f"High risk: Vessel projected to arrive {late_days} days AFTER cancelling date ({laycan_end_str}). "
            f"Charterer may trigger BIMCO Clause 10 cancellation. Increase speed to 14.5 knots or nominate alternate vessel."
        )

    return {
        "vessel_name": vessel_name,
        "current_position": current_port.title(),
        "load_port": load_port.title(),
        "distance_nm": distance,
        "speed_knots": speed_knots,
        "steaming_days": steaming_days,
        "departure_date": as_of_date.strftime("%Y-%m-%d"),
        "eta": eta_str,
        "laycan_window": f"{laycan_start_str} to {laycan_end_str}",
        "status": status,
        "recommendation": recommendation,
        "reason": action_plan,
    }


if __name__ == "__main__":
    test_pos = {
        "vessel_name": "MV Odisha Pride",
        "current_port": "Singapore",
        "load_port": "Gladstone",
        "laycan_start": "2026-10-10",
        "laycan_end": "2026-10-20",
        "as_of_date": "2026-09-25",
    }
    import json
    print(json.dumps(recommend_positioning(test_pos), indent=2))
