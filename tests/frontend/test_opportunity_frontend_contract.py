from pathlib import Path


def test_frontend_wires_freight_opportunity_score_component():
    source = Path('frontend/src/main.tsx').read_text(encoding='utf-8')

    assert 'OpportunityScore' in source
    assert 'assessOpportunity' in source
    assert '"/freight-opportunity"' in source
    assert 'Freight Opportunity Score' in source
    assert 'Calculate Opportunity Score' in source
    assert 'expected_return_pct' in source
    assert 'opportunityResult.components' in source
