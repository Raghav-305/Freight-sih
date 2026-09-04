from fastapi.testclient import TestClient

from backend.app.main import app


def test_opportunity_score_endpoint_returns_components_and_recommendation():
    response = TestClient(app).post(
        '/freight-opportunity',
        json={
            'origin': 'Australia',
            'destination': 'Dhamra',
            'vessel_class': 'Panamax',
            'horizon': 30,
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert 0 <= body['fos'] <= 100
    assert body['recommendation'] in {'AVOID_WAIT', 'WAIT', 'MONITOR', 'GOOD_OPPORTUNITY', 'FIX_NOW'}
    assert set(body['components']) == {
        'forecast',
        'rate_opportunity',
        'market_signal',
        'fleet_supply',
        'port_congestion',
        'weather_risk',
        'voyage_economics',
    }
    assert body['forecast_source']
    assert body['horizon_days'] == 30


def test_opportunity_score_endpoint_rejects_unsupported_horizon():
    response = TestClient(app).post(
        '/freight-opportunity',
        json={'origin': 'Australia', 'destination': 'Dhamra', 'vessel_class': 'Panamax', 'horizon': 90},
    )

    assert response.status_code == 400
