"""
Tests for the Time Charter Equivalent (TCE) and IMO CII Carbon Emissions API.
"""
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_tce_calculation_endpoint_returns_valid_metrics():
    payload = {
        "freight_rate_usd_mt": 28.5,
        "cargo_quantity_mt": 75000,
        "sea_distance_nm": 4200,
        "vessel_speed_knots": 12.5,
        "sea_fuel_consumption_mt_day": 28.0,
        "port_fuel_consumption_mt_day": 3.5,
        "bunker_price_usd_mt": 620.0,
        "port_costs_usd": 45000.0,
        "canal_tolls_usd": 0.0,
        "loading_days": 2.5,
        "discharge_days": 3.0,
        "waiting_days": 2.0,
        "ballast_ratio": 0.8,
    }

    res = client.post("/api/scenarios/tce", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["gross_freight_revenue_usd"] == 28.5 * 75000
    assert data["total_voyage_days"] > 0
    assert data["tce_usd_day"] > 0
    assert data["total_co2_emissions_mt"] > 0
    assert data["cii_grams_co2_per_mt_nm"] > 0
    assert data["model_version"] == "tce-cii-v1"


def test_tce_calculation_rejects_negative_or_zero_values():
    # Negative freight rate
    bad_payload = {
        "freight_rate_usd_mt": -10.0,
        "cargo_quantity_mt": 75000,
        "sea_distance_nm": 4200,
    }
    res = client.post("/api/scenarios/tce", json=bad_payload)
    assert res.status_code == 422
