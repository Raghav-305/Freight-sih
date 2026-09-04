from fastapi.testclient import TestClient

from backend.app.main import app


def test_risk_endpoint_returns_six_factor_assessment():
    response = TestClient(app).post(
        '/risk',
        json={
            'route_id': 'RUS_PAR_PAN',
            'origin_country': 'Russia',
            'destination_port': 'PAR',
            'date': '2022-06-19',
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body['mode'] == 'rule_based'
    assert body['destination_port_name'] == 'Paradip'
    assert set(body['scores']) == {'market', 'port', 'weather', 'geopolitical', 'supply', 'contract'}
    assert 0 <= body['overall_risk'] <= 100
    assert body['overall'] == body['overall_risk']


def test_risk_endpoint_rejects_unknown_port():
    response = TestClient(app).post(
        '/risk',
        json={
            'route_id': 'AUS_DHA_PAN',
            'origin_country': 'Australia',
            'destination_port': 'XXX',
            'date': '2025-10-31',
        },
    )

    assert response.status_code == 400
