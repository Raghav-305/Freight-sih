from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_explain_endpoint_returns_model_explanations():
    payload = {
        "origin": "Australia",
        "destination": "Dhamra",
        "vessel_type": "Panamax",
        "cargo_type": "Coal",
        "cargo_quantity": 80000,
        "horizon": 30,
    }

    response = client.post('/forecast/explain', json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert 'narrative' in body
    assert body['horizon'] == '30d'
    assert 'positive_drivers' in body


def test_what_if_endpoint_returns_scenario_deltas():
    payload = {
        "origin": "Australia",
        "destination": "Dhamra",
        "vessel_type": "Panamax",
        "cargo_type": "Coal",
        "cargo_quantity": 80000,
        "freight_change_pct": 8,
        "bunker_change_pct": 5,
    }

    response = client.post('/forecast/what-if', json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['scenario_inputs']['freight_change_pct'] == 8
    assert 'horizons' in body
    assert len(body['horizons']) >= 1


def test_models_performance_endpoint_returns_summary():
    response = client.get('/models/performance')
    assert response.status_code == 200, response.text
    body = response.json()
    assert 'rows' in body
    assert isinstance(body['rows'], list)
    assert len(body['rows']) >= 1
