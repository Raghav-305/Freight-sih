from pathlib import Path


def test_frontend_wires_risk_intelligence_component():
    source = Path('frontend/src/main.tsx').read_text(encoding='utf-8')

    assert 'RiskAssessment' in source
    assert 'assessRisk' in source
    assert '"/risk"' in source
    assert 'Risk Intelligence' in source
    assert 'Assess Route Risk' in source
    assert 'overall_risk' in source
    assert 'riskResult.scores' in source
