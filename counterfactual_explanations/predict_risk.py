"""
Risk & Alert Engine
=====================
Roadmap reference: Phase 39 (page 29, "Risk engine") + Phase 40 (page 29-30, "Event-driven risk")

NOT a trained ML model -- there's no historical "true risk score" to learn from.
This is a rule-based SCORING ENGINE: 6 independent 0-100 sub-scores, combined into
one Overall Risk score, matching your roadmap's own example:
    Market 72, Port 61, Weather 31, Geopolitical 54, Supply 67 -> Overall 61

INTEGRATION POINT (this is what the UI/backend calls):
    from predict_risk import get_risk_score
    result = get_risk_score(route_id, origin_country, destination_port, date)

REAL USER INPUTS (what a person actually picks on a form):
    - route_id           : e.g. "AUS_PAR_PAN"  (origin_destination_vesselclass, matches freight_rates.csv)
    - origin_country      : "Australia" / "Indonesia" / "Mozambique" / "Russia" / "USA"
    - destination_port    : "DHA" / "GAN" / "GOP" / "HAL" / "PAR" / "VIZ"
    - date                : "YYYY-MM-DD"

EVERYTHING ELSE IS LOOKED UP AUTOMATICALLY -- the user never sees or provides:
    - Market risk        : recent freight/bunker/coal price volatility
    - Port risk          : 60% historical congestion + 40% structural (berth count, draft limit)
    - Weather risk        : historical storm/cyclone frequency + wind/wave severity at that port
    - Geopolitical risk    : checks events.csv for any active event covering that route+date
    - Supply risk         : recent coal import volume volatility for that origin country
    - Contract risk       : spot-exposure share for that origin-destination pair (from fixtures.csv)

OUTPUT:
    dict with market, port, weather, geopolitical, supply, contract (each 0-100),
    overall (weighted average), plus the inputs echoed back for convenience.
"""

import pandas as pd
import os

_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_DIR, ".."))
_CANONICAL_DIR = os.path.join(_PROJECT_ROOT, "ml", "artifacts", "risk_model")

def _get_path(filename: str) -> str:
    canonical = os.path.join(_CANONICAL_DIR, filename)
    if os.path.exists(canonical):
        return canonical
    return os.path.join(_DIR, filename)

_market_risk = pd.read_csv(_get_path("market_risk_by_date.csv"), parse_dates=['date']).set_index('date')['market_risk']
_port_risk = pd.read_csv(_get_path("port_risk_by_port.csv")).set_index('port_id')['port_risk']
_weather_risk = pd.read_csv(_get_path("weather_risk_by_port.csv")).set_index('port_id')['weather_risk']
_supply_risk = pd.read_csv(_get_path("supply_risk_by_country.csv")).set_index('origin_country')['supply_risk']
_contract_risk = pd.read_csv(_get_path("contract_risk_by_route.csv")).set_index('route_key')['contract_risk']
_events = pd.read_csv(_get_path("events_lookup.csv"), parse_dates=['start', 'end'])
_port_names = pd.read_csv(_get_path("port_names.csv")).set_index('port_id')['name']

_SEVERITY_MAP = {'Low': 25, 'Medium': 55, 'High': 85}

# Default equal weights -- your roadmap's example isn't a strict formula, adjust freely.
_WEIGHTS = {
    "market": 1 / 6, "port": 1 / 6, "weather": 1 / 6,
    "geopolitical": 1 / 6, "supply": 1 / 6, "contract": 1 / 6,
}

_PORT_TO_NAME = {"DHA": "Dhamra", "GAN": "Gangavaram", "GOP": "Gopalpur",
                  "HAL": "Haldia", "PAR": "Paradip", "VIZ": "Vizag"}

_NAME_TO_PORT = {v.lower(): k for k, v in _PORT_TO_NAME.items()}

VALID_PORTS = list(_PORT_TO_NAME.keys())
VALID_COUNTRIES = ["Australia", "Indonesia", "Mozambique", "Russia", "USA"]


def _geopolitical_risk(route_id: str, date: pd.Timestamp) -> float:
    active = _events[
        (_events['start'] <= date) & (_events['end'] >= date) &
        _events['affected_routes'].apply(lambda s: route_id in str(s).split(';'))
    ]
    if len(active) == 0:
        return 10.0  # baseline low risk when nothing active
    return float(active['severity'].map(_SEVERITY_MAP).max())


def get_risk_score(route_id: str, origin_country: str, destination_port: str, date: str,
                    override_market: float = None, override_port: float = None,
                    override_weather: float = None, override_geopolitical: float = None,
                    override_supply: float = None, override_contract: float = None) -> dict:
    """
    Compute the full 6-part risk breakdown + overall score for a route on a given date.
    Raises ValueError on an unrecognized port or country so bad input fails loudly, not silently.

    The override_* parameters let a caller substitute a hypothetical value for any single
    sub-score (used by the counterfactual explainer to ask "what if weather risk were lower?"
    without needing to fabricate a fake historical date). Leave as None for normal use.
    """
    dest_clean = destination_port.strip()
    if dest_clean.upper() in VALID_PORTS:
        destination_port = dest_clean.upper()
    elif dest_clean.lower() in _NAME_TO_PORT:
        destination_port = _NAME_TO_PORT[dest_clean.lower()]
    else:
        # Check partial match
        matched = False
        for name_lower, code in _NAME_TO_PORT.items():
            if dest_clean.lower() in name_lower:
                destination_port = code
                matched = True
                break
        if not matched:
            raise ValueError(f"Unknown destination_port '{destination_port}'. Valid: {VALID_PORTS} or {list(_PORT_TO_NAME.values())}")

    origin_clean = origin_country.strip()
    country_map = {c.lower(): c for c in VALID_COUNTRIES}
    if origin_clean.lower() in country_map:
        origin_country = country_map[origin_clean.lower()]
    else:
        raise ValueError(f"Unknown origin_country '{origin_country}'. Valid: {VALID_COUNTRIES}")

    date_ts = pd.Timestamp(date)

    nearest_date = _market_risk.index[(_market_risk.index - date_ts).to_series().abs().argmin()] \
        if len(_market_risk) else date_ts
    market = float(_market_risk.get(nearest_date, _market_risk.mean())) if override_market is None else override_market

    port = float(_port_risk.get(destination_port, _port_risk.mean())) if override_port is None else override_port
    weather = float(_weather_risk.get(destination_port, _weather_risk.mean())) if override_weather is None else override_weather
    geopolitical = _geopolitical_risk(route_id, date_ts) if override_geopolitical is None else override_geopolitical
    supply = float(_supply_risk.get(origin_country, _supply_risk.mean())) if override_supply is None else override_supply

    route_key = f"{origin_country}-{_PORT_TO_NAME.get(destination_port, destination_port)}"
    contract = float(_contract_risk.get(route_key, _contract_risk.mean())) if override_contract is None else override_contract

    scores = {"market": market, "port": port, "weather": weather,
              "geopolitical": geopolitical, "supply": supply, "contract": contract}
    overall = sum(scores[k] * _WEIGHTS[k] for k in scores)

    return {
        "route_id": route_id,
        "origin_country": origin_country,
        "destination_port": destination_port,
        "destination_port_name": _port_names.get(destination_port, destination_port),
        "date": date,
        **{k: round(v, 1) for k, v in scores.items()},
        "overall": round(overall, 1),
    }


if __name__ == "__main__":
    # Quick manual test -- run `python predict_risk.py` to sanity-check the package works
    print(get_risk_score("RUS_PAR_PAN", "Russia", "PAR", "2022-06-19"))
    print(get_risk_score("AUS_DHA_CAP", "Australia", "DHA", "2020-01-01"))
    print(get_risk_score("USA_HAL_PAN", "USA", "HAL", "2023-07-15"))
