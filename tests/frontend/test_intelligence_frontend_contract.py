from pathlib import Path


def test_frontend_wires_market_and_vessel_intelligence_components():
    main_src = Path('frontend/src/main.tsx').read_text(encoding='utf-8')
    vessel_src = Path('frontend/src/components/pages/VesselIntelligencePage.tsx').read_text(encoding='utf-8')
    source = main_src + "\n" + vessel_src

    assert 'loadMarketIntelligence' in source
    assert 'recommendVessels' in source
    assert '/market?' in source
    assert '/vessels/recommend' in source
    assert 'Vessel Intelligence' in source
    assert 'Find Suitable Vessels' in source
    assert 'predicted_waiting_hours' in source
