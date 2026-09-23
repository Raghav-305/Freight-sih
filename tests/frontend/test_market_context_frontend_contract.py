from pathlib import Path


def test_frontend_renders_market_context_datasets():
    main_src = Path('frontend/src/main.tsx').read_text(encoding='utf-8')
    overview_src = Path('frontend/src/components/pages/ExecutiveOverviewPage.tsx').read_text(encoding='utf-8')
    source = main_src + "\n" + overview_src

    assert '/market/context?' in source
    assert 'MarketContext' in source
    assert 'FFA Curve' in source
    assert 'Coal Imports' in source
    assert 'Market Events' in source
    assert 'Fixture History' in source
