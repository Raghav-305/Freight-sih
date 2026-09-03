from fastapi.testclient import TestClient

from backend.app.main import app


def test_vessel_recommendation_endpoint_returns_ranked_candidates():
    response = TestClient(app).post(
        '/vessels/recommend',
        json={
            'destination': 'Dhamra',
            'vessel_class': 'Panamax',
            'cargo_quantity': 70000,
            'limit': 3,
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body['candidate_count'] >= body['feasible_count'] >= 0
    assert len(body['candidates']) == 3
    assert body['target'] == 'avg_waiting_hours'
    assert all('predicted_waiting_hours' in candidate for candidate in body['candidates'])
    assert all('failed_constraints' in candidate for candidate in body['candidates'])


def test_model_registry_exposes_vessel_intelligence_model():
    response = TestClient(app).get('/models')

    assert response.status_code == 200, response.text
    models = response.json()['models']
    assert any(model['family'] == 'vessel_intelligence' for model in models)
