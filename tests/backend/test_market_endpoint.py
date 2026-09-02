from fastapi.testclient import TestClient

from backend.app.main import app


def test_market_endpoint_returns_valid_market_payload():
    client = TestClient(app)

    response = client.get('/market?origin=Australia&destination=Dhamra&vessel_class=Panamax')

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload['mode'] in {'live', 'precomputed'}
    assert payload['market_regime']
    assert payload['market_score'] >= 0
    assert payload['market_score'] <= 100
    assert payload['probabilities']['bearish'] >= 0
    assert payload['probabilities']['neutral'] >= 0
    assert payload['probabilities']['bullish'] >= 0
    assert payload['route']['destination']
