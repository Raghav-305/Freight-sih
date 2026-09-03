from fastapi.testclient import TestClient

from backend.app.main import app


def test_market_context_returns_supporting_dataset_summaries():
    response = TestClient(app).get(
        '/market/context?origin=Australia&destination=Dhamra&vessel_class=Panamax&as_of_date=2025-10-31'
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body['ffa']
    assert {point['period'] for point in body['ffa']} == {'1M', '3M', '6M', '1Y'}
    assert body['import_summary']['origin_country'] == 'Australia'
    assert body['import_summary']['month'] == '2025-10'
    assert isinstance(body['active_events'], list)
    assert body['fixtures']['fixture_count'] > 0
    assert body['fixtures']['average_rate'] is not None
