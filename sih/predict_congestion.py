"""
Congestion Prediction Module
=============================
Roadmap reference: Phase 31 (page 25) -- "Congestion Prediction Model"
Target: expected_waiting_days

HOW TO USE THIS FILE:
This is the piece your teammates plug a user-facing form/UI into. It exposes ONE function:

    predict_congestion(port_id, arrival_date, vessel_dwt, vessel_type)

WHAT THE USER ACTUALLY TYPES IN (the real inputs a person picks on a form):
    - port_id       : which Indian port ("DHA","GAN","GOP","HAL","PAR","VIZ")
    - arrival_date   : planned arrival date, e.g. "2026-03-15"
    - vessel_dwt     : the vessel's deadweight tonnage, e.g. 78000
    - vessel_type    : "Panamax" or "Capesize"

WHAT THE FUNCTION LOOKS UP AUTOMATICALLY (the user never sees or provides these):
    - port constraints (discharge rate, draft limit, tidal restriction, berth count)
    - historical average congestion for that port/month (climatology, since we don't
      have a live AIS feed or weather forecast in this offline model)
This separation matters: in production, a teammate could later swap the "looked up
automatically" block for LIVE data (real-time AIS feed, real weather forecast API)
without changing the function's input/output contract at all.
"""

import pandas as pd
import joblib
import os

_DIR = os.path.dirname(os.path.abspath(__file__))
_model = joblib.load(os.path.join(_DIR, "congestion_model.pkl"))
_port_lookup = pd.read_csv(os.path.join(_DIR, "port_lookup.csv"))
_monthly_lookup = pd.read_csv(os.path.join(_DIR, "monthly_lookup.csv"))

FEATURES = ['month','vessels_at_anchorage','vessels_in_port','queue_length','arrivals_24h','arrivals_7d',
            'departures_24h','departures_7d','average_wait','median_wait',
            'wind_speed','wave_height','precipitation','storm_flag','cyclone_flag',
            'discharge_rate','max_draft','has_tidal_restriction','berth_count',
            'dwt','is_capesize','port_code']


def predict_congestion(port_id: str, arrival_date: str, vessel_dwt: int, vessel_type: str) -> dict:
    """
    Predict expected port waiting time.

    Parameters
    ----------
    port_id : str        one of "DHA","GAN","GOP","HAL","PAR","VIZ"
    arrival_date : str    "YYYY-MM-DD", the vessel's planned arrival date
    vessel_dwt : int      vessel deadweight tonnage, e.g. 78000
    vessel_type : str     "Panamax" or "Capesize"

    Returns
    -------
    dict with:
        expected_wait_hours : float
        expected_wait_days  : float
        port_id, arrival_date, vessel_dwt, vessel_type (echoed back for the caller's convenience)
    """
    port_id = port_id.upper().strip()
    if port_id not in _port_lookup['port_id'].values:
        raise ValueError(f"Unknown port_id '{port_id}'. Valid options: {list(_port_lookup['port_id'].unique())}")

    month = pd.to_datetime(arrival_date).month

    p = _port_lookup[_port_lookup['port_id'] == port_id].iloc[0]
    m = _monthly_lookup[(_monthly_lookup['port_id'] == port_id) & (_monthly_lookup['month'] == month)]
    if len(m) == 0:
        m = _monthly_lookup[_monthly_lookup['port_id'] == port_id].mean(numeric_only=True)
    else:
        m = m.iloc[0]

    row = pd.DataFrame([{
        'month': month,
        'vessels_at_anchorage': m['avg_vessels_at_anchorage'],
        'vessels_in_port': m['avg_vessels_in_port'],
        'queue_length': m['avg_queue_length'],
        'arrivals_24h': m['avg_arrivals_24h'],
        'arrivals_7d': m['avg_arrivals_7d'],
        'departures_24h': m['avg_departures_24h'],
        'departures_7d': m['avg_departures_7d'],
        'average_wait': m['avg_wait_hist'],
        'median_wait': m['med_wait_hist'],
        'wind_speed': m['avg_wind_speed'],
        'wave_height': m['avg_wave_height'],
        'precipitation': m['avg_precip'],
        'storm_flag': m['storm_flag_rate'],
        'cyclone_flag': m['cyclone_flag_rate'],
        'discharge_rate': p['discharge_rate'],
        'max_draft': p['max_draft'],
        'has_tidal_restriction': p['has_tidal_restriction'],
        'berth_count': p['berth_count'],
        'dwt': vessel_dwt,
        'is_capesize': 1 if vessel_type.lower() == 'capesize' else 0,
        'port_code': p['port_code'],
    }])[FEATURES]

    predicted_hours = float(_model.predict(row)[0])

    return {
        "port_id": port_id,
        "arrival_date": arrival_date,
        "vessel_dwt": vessel_dwt,
        "vessel_type": vessel_type,
        "expected_wait_hours": round(predicted_hours, 1),
        "expected_wait_days": round(predicted_hours / 24, 2),
    }


if __name__ == "__main__":
    # Quick manual test -- teammates can run `python predict_congestion.py` to sanity-check
    result = predict_congestion(port_id="PAR", arrival_date="2026-07-15", vessel_dwt=78000, vessel_type="Panamax")
    print(result)
