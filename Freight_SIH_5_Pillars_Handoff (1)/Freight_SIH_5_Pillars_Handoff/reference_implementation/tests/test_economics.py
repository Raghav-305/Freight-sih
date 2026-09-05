import pytest
from pydantic import ValidationError

from app.models import CostBreakdown, ScenarioMetadata, ScenarioRequest, SensitivityRequest
from app.services import economics


def _req(gcv=None, freight=10, port=5):
    return ScenarioRequest(
        scenario_type="IMPORT",
        label="Test",
        costs=CostBreakdown(commodity=100, freight=freight, insurance=1, port=port, handling=2, inland=3, other=0),
        gcv_kcal_per_kg=gcv,
        metadata=ScenarioMetadata(currency="USD", observed_at="2026-01-01T00:00:00Z"),
    )


def test_zero_or_negative_gcv_rejected():
    with pytest.raises(ValidationError):
        _req(gcv=0)
    with pytest.raises(ValidationError):
        _req(gcv=-5)


def test_missing_gcv_gives_landed_cost_but_no_energy_cost():
    out = economics.evaluate_scenario(_req(gcv=None))
    assert "landed_cost_per_tonne" in out["result"]
    assert "cost_per_gj" not in out["result"]
    assert any("GCV" in w for w in out["warnings"])


def test_present_gcv_computes_cost_per_gj():
    out = economics.evaluate_scenario(_req(gcv=5000))
    assert out["result"]["cost_per_gj"] == round(out["result"]["landed_cost_per_tonne"] / (5000 * 0.004184), 4)


def test_sensitivity_changes_result():
    base_req = _req(gcv=5000, freight=10, port=5)
    out = economics.sensitivity_grid(SensitivityRequest(
        scenario=base_req, waiting_days_p50=2, waiting_days_p90=5, daily_charter_hire_rate=18500
    ))
    freight_rows = [r for r in out["result"]["cost_rows"] if r["factor"] == "FREIGHT"]
    assert len(freight_rows) == 2
    assert all(r["delta_vs_base"] != 0 for r in freight_rows)
    waiting_rows = out["result"]["waiting_day_rows"]
    assert any(r["scenario"] == "P90" for r in waiting_rows)


def test_compare_does_not_rank_by_cost_per_gj_if_any_scenario_missing_gcv():
    with_gcv = _req(gcv=5000)
    without_gcv = _req(gcv=None)
    out = economics.compare_scenarios([with_gcv, without_gcv])
    assert out["assumptions"]["ranking_metric"] == "landed_cost_per_tonne"
    assert len(out["warnings"]) == 1


def test_blend_weighted_average():
    from app.models import BlendRequest
    out = economics.evaluate_blend(BlendRequest(
        domestic=_req(gcv=4000), imported=_req(gcv=6000),
        domestic_gcv_kcal_per_kg=4000, imported_gcv_kcal_per_kg=6000,
        import_fraction=0.5,
    ))
    assert out["result"]["blend_gcv_kcal_per_kg"] == 5000
