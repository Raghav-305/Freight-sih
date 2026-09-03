from pathlib import Path


def test_frontend_wires_market_and_vessel_intelligence_components():
    source = Path('frontend/src/main.tsx').read_text(encoding='utf-8')

    assert 'loadMarketIntelligence' in source
    assert 'recommendVessels' in source
    assert '/market?' in source
    assert '/vessels/recommend' in source
    assert 'Vessel Intelligence' in source
    assert 'Find Suitable Vessels' in source
    assert 'predicted_waiting_hours' in source
