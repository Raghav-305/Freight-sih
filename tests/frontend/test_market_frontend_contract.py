import json
from pathlib import Path


def test_frontend_market_contract_matches_backend_response_shape():
    app_src = Path('frontend/src/main.tsx').read_text(encoding='utf-8')
    assert 'MarketIntelligence' in app_src
    assert 'loadMarketIntelligence' in app_src
    assert '/market?' in app_src
    assert 'origin' in app_src
    assert 'destination' in app_src
    assert 'vessel_class' in app_src

    schema_file = Path('backend/app/schemas/market.py')
    schema_text = schema_file.read_text(encoding='utf-8')
    assert 'class MarketIntelligenceResponse' in schema_text
    assert 'market_regime' in schema_text
    assert 'probabilities' in schema_text

    registry_file = Path('ml/registry/model_registry.json')
    registry = json.loads(registry_file.read_text(encoding='utf-8'))
    assert 'active_market_intelligence_model' in registry
    assert any(model['model_version'] == 'market_intelligence_v1' for model in registry['models'])
