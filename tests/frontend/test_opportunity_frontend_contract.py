from pathlib import Path


def test_frontend_wires_freight_opportunity_score_component():
    main_src = Path('frontend/src/main.tsx').read_text(encoding='utf-8')
    opp_src = Path('frontend/src/components/pages/FreightOpportunityPage.tsx').read_text(encoding='utf-8')
    source = main_src + "\n" + opp_src

    assert 'OpportunityScore' in source
    assert 'assessOpportunity' in source
    assert '"/freight-opportunity"' in source
    assert 'Freight Opportunity Score' in source
    assert 'Calculate Opportunity Score' in source
    assert 'opportunityResult' in main_src
    assert 'result.components' in opp_src
