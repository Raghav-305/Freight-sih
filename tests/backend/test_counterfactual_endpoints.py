from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_risk_counterfactual_endpoint():
    payload = {
        "route_id": "RUS_PAR_PAN",
        "origin_country": "Russia",
        "destination_port": "PAR",
        "date": "2022-06-19",
    }
    response = client.post("/api/counterfactual/risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "biggest_lever" in data
    assert "counterfactuals" in data
    assert len(data["counterfactuals"]) == 6
    assert data["biggest_lever"] == "geopolitical"
    assert "summary_insight" in data
    # Check sorting: highest drop first
    drops = [c["overall_drops_by"] for c in data["counterfactuals"]]
    assert drops == sorted(drops, reverse=True)


def test_risk_counterfactual_with_full_port_name():
    payload = {
        "route_id": "AUS_PAR_PAN",
        "origin_country": "Australia",
        "destination_port": "Paradip",
        "date": "2024-06-15",
    }
    response = client.post("/api/counterfactual/risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["baseline"]["destination_port"] == "PAR"
    assert len(data["counterfactuals"]) == 6


def test_charter_counterfactual_endpoint():
    payload = {
        "origin_port": "Gladstone",
        "destination_port": "PAR",
        "vessel_class": "Panamax",
        "cargo_quantity_mt": 480000,
        "delivery_date": "2024-06-15",
    }
    response = client.post("/api/counterfactual/charter", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "biggest_lever" in data
    assert "cost_sensitivity" in data
    assert len(data["cost_sensitivity"]) == 15  # 5 bunker + 5 congestion + 5 spot rate
    assert "note" in data
    assert "summary_insight" in data
    # Check that savings are calculated
    for item in data["cost_sensitivity"]:
        assert "saving_usd" in item
        assert "new_cost_usd" in item
        assert "mix_changed" in item


def test_charter_counterfactual_with_full_names_and_country():
    payload = {
        "origin_port": "Australia",
        "destination_port": "Dhamra",
        "vessel_class": "panamax",
        "cargo_quantity_mt": 480000,
        "delivery_date": "2024-06-15",
    }
    response = client.post("/api/counterfactual/charter", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["baseline"]["destination_port"] in ["DHA", "PAR", "GAN", "GOP", "HAL", "VIZ"]


def test_risk_simulation_endpoint():
    payload = {
        "route_id": "RUS_PAR_PAN",
        "origin_country": "Russia",
        "destination_port": "PAR",
        "date": "2022-06-19",
        "overrides": {"geopolitical": 10.0, "weather": 15.0},
    }
    response = client.post("/api/counterfactual/risk/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "simulated" in data
    assert data["overall_delta"] > 0
    assert data["impact_direction"] == "REDUCED"


def test_charter_simulation_endpoint():
    payload = {
        "origin_port": "Gladstone",
        "destination_port": "PAR",
        "vessel_class": "Panamax",
        "cargo_quantity_mt": 480000,
        "delivery_date": "2024-06-15",
        "bunker_pct_change": -10.0,
        "congestion_days_delta": -1.0,
        "spot_rate_pct_change": -5.0,
    }
    response = client.post("/api/counterfactual/charter/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "simulated" in data
    assert data["saving_usd"] > 0


def test_invalid_risk_input_fails_cleanly():
    payload = {
        "route_id": "XYZ",
        "origin_country": "Atlantis",
        "destination_port": "UNKNOWN",
        "date": "2024-06-15",
    }
    response = client.post("/api/counterfactual/risk", json=payload)
    assert response.status_code == 400
