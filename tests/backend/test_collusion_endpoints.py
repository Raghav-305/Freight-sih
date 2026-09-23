from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_list_tenders_endpoint():
    response = client.get("/api/collusion/tenders?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total_tenders" in data
    assert "flagged_tenders" in data
    assert "tenders" in data
    assert len(data["tenders"]) > 0
    first = data["tenders"][0]
    assert "tender_id" in first
    assert "predicted_fair_value" in first


def test_get_tender_details():
    # Fetch list first to get an existing tender
    list_res = client.get("/api/collusion/tenders?limit=5")
    assert list_res.status_code == 200
    tenders = list_res.json()["tenders"]
    assert len(tenders) > 0
    tender_id = tenders[0]["tender_id"]

    response = client.get(f"/api/collusion/tenders/{tender_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["tender_id"] == tender_id
    assert "bids" in data
    assert len(data["bids"]) > 0
    bid = data["bids"][0]
    assert "anomaly_probability" in bid
    assert "quoted_freight_usd_mt" in bid


def test_score_bid_endpoint():
    # Construct a realistic bid payload
    payload = {
        "bid": {
            "tender_id": "TEST-01",
            "broker_id": "BRK-TEST",
            "origin": "Gladstone",
            "destination_port": "PAR",
            "cargo_type": "Coking Coal",
            "vessel_class": "Panamax",
            "route_id": "AUS_PAR_PAN",
            "quantity_mt": 75000.0,
            "quoted_freight_usd_mt": 32.5,
            "bid_rank": 3,
            "winner": 0,
            "contract_duration_days": 25,
            "market_freight_usd_mt": 18.5,
            "predicted_fair_value_usd_mt": 18.2,
            "fair_value_lower_usd_mt": 16.74,
            "fair_value_upper_usd_mt": 19.65,
            "bid_deviation_pct": 78.5,
            "bunker_price_usd_mt": 620.0,
            "congestion_index": 0.45,
            "predicted_waiting_hours": 48.0,
            "broker_historical_bid_count": 35,
            "broker_historical_premium_pct": 8.5,
            "vessel_historical_bid_count": 14,
            "broker_vessel_historical_frequency": 6,
            "bid_spread_pct": 80.0,
            "fair_value_band_breach": 1,
            "high_positive_deviation_flag": 1,
        },
        "threshold": 0.5,
    }
    response = client.post("/api/collusion/score-bid", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "anomaly_probability" in data
    assert "flagged" in data
    assert data["flagged"] is True  # Severe breach should be flagged


def test_explain_bid_endpoint():
    list_res = client.get("/api/collusion/tenders?limit=5")
    tenders = list_res.json()["tenders"]
    tender_id = tenders[0]["tender_id"]

    detail_res = client.get(f"/api/collusion/tenders/{tender_id}")
    broker_id = detail_res.json()["bids"][0]["broker_id"]

    payload = {
        "tender_id": tender_id,
        "broker_id": broker_id,
        "top_n": 5,
    }
    response = client.post("/api/collusion/explain-bid", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["tender_id"] == tender_id
    assert data["broker_id"] == broker_id
    assert "probability" in data
    assert "narrative" in data
    assert "toward_suspicious" in data
    assert "toward_normal" in data


def test_simulate_bid_endpoint():
    payload = {
        "tender_id": "SIM-01",
        "broker_id": "BRK-SIM",
        "origin": "Gladstone",
        "destination_port": "PAR",
        "cargo_type": "Coking Coal",
        "vessel_class": "Panamax",
        "route_id": "AUS_PAR_PAN",
        "quantity_mt": 75000.0,
        "quoted_freight_usd_mt": 29.0,
        "market_freight_usd_mt": 18.5,
        "predicted_fair_value_usd_mt": 18.2,
        "bunker_price_usd_mt": 620.0,
        "congestion_index": 0.45,
        "predicted_waiting_hours": 48.0,
        "broker_historical_bid_count": 25,
        "broker_historical_premium_pct": 5.0,
        "vessel_historical_bid_count": 12,
        "broker_vessel_historical_frequency": 4,
        "contract_duration_days": 25,
        "threshold": 0.5,
    }
    response = client.post("/api/collusion/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "anomaly_probability" in data
    assert "flagged" in data
    assert "narrative" in data
    assert "top_suspicious_features" in data


def test_get_performance_endpoint():
    response = client.get("/api/collusion/performance")
    assert response.status_code == 200
    data = response.json()
    assert data["model_version"] == "bid_anomaly_detection_v1"
    assert "test_metrics" in data
    assert "precision" in data["test_metrics"]
    assert "recall" in data["test_metrics"]
    assert "naive_baseline" in data
