from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_charter_optimize_endpoint():
    payload = {
        "cargo_quantity": 480000,
        "origin": "Australia",
        "destination": "Dhamra",
        "period_start": "2026-10-01",
        "period_end": "2027-03-31",
        "contract_options": ["spot", "short_term", "multi_voyage", "coa"],
        "market_regime": "BULLISH",
    }
    response = client.post("/charter/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "strategy" in data
    assert "allocation" in data
    assert sum(data["allocation"].values()) == 100.0
    assert data["expected_saving"] >= 0


def test_charter_strategy_lp_endpoint():
    payload = {
        "origin_port": "Gladstone",
        "destination_port": "Dhamra",
        "vessel_class": "Panamax",
        "cargo_quantity_mt": 480000,
        "delivery_date": "2026-10-15",
        "max_share": 0.5,
    }
    response = client.post("/charter/strategy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["origin_port"] == "Gladstone"
    assert data["destination_port"] == "DHA"
    assert data["destination_port_name"] == "Dhamra"
    assert data["vessel_class"] == "Panamax"
    assert data["voyages_needed"] == 7
    assert data["distance_nm"] > 4000
    assert data["optimized_cost_usd"] <= data["current_plan_cost_usd"]
    assert "recommended_mix" in data
    assert "cost_breakdown_per_voyage" in data


def test_data_quality_endpoint():
    response = client.get("/data-quality")
    assert response.status_code == 200
    data = response.json()
    assert "overall_status" in data
    assert "datasets" in data
    assert len(data["datasets"]) > 0


def test_audit_logs_and_review_endpoint():
    review_payload = {
        "reviewer_name": "Tender Committee Chair",
        "decision": "APPROVED",
        "comment": "Approved under Delegation of Financial Powers (DoFP) for coal import program.",
        "tender_reference": "SIH-2026-TENDER-01",
    }
    response = client.post("/audit/review", json=review_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["decision"] == "APPROVED"

    # Verify log retrieval
    log_res = client.get("/audit/logs")
    assert log_res.status_code == 200
    log_data = log_res.json()
    assert "audit_trail" in log_data
    assert len(log_data["audit_trail"]) > 0


def test_port_physical_constraints():
    # Capesize has 17.8m draft, Haldia max draft is 12.5m -> draft constraint MUST fail!
    payload = {
        "port": "Haldia",
        "vessel_type": "Capesize",
        "cargo_quantity": 150000,
    }
    response = client.post("/port/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["constraints"]["draft"] is False
    assert data["feasible"] is False
