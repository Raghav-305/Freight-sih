from pathlib import Path


def test_frontend_renders_market_context_datasets():
    source = Path('frontend/src/main.tsx').read_text(encoding='utf-8')

    assert '/market/context?' in source
    assert 'MarketContext' in source
    assert 'FFA Curve' in source
    assert 'Coal Imports' in source
    assert 'Market Events' in source
    assert 'Fixture History' in source
