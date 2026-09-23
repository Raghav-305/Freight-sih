from pathlib import Path


def test_frontend_wires_risk_intelligence_component():
    main_src = Path('frontend/src/main.tsx').read_text(encoding='utf-8')
    risk_src = Path('frontend/src/components/pages/RiskIntelligencePage.tsx').read_text(encoding='utf-8')
    source = main_src + "\n" + risk_src

    assert 'RiskAssessment' in source
    assert 'assessRisk' in source
    assert '"/risk"' in source
    assert 'Risk Intelligence' in source
    assert 'Assess Route Risk' in source
    assert 'overall_risk' in source
    assert 'riskResult' in main_src
    assert 'result.scores' in risk_src
