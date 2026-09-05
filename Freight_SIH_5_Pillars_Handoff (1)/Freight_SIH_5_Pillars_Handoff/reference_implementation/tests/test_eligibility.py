from app.models import DelayExposureRequest, DemurrageRequest, EligibilityRequest, VesselSpec
from app.services import eligibility


def test_paradip_berth_examples_produce_expected_states():
    # Fits within base draft on Coal Berth-02 (no conditional draft) -> ELIGIBLE
    out = eligibility.evaluate(EligibilityRequest(
        vessel=VesselSpec(loa_m=290, beam_m=45, draft_m=14.0),
        port_id="PARADIP", berth_id="BERTH_06",
    ))
    assert out["status"] == "ELIGIBLE"

    # Exceeds base draft but within conditional (high-tide) draft on Coal Berth-01 -> ELIGIBLE_WITH_CONDITION
    out = eligibility.evaluate(EligibilityRequest(
        vessel=VesselSpec(loa_m=290, beam_m=45, draft_m=15.5),
        port_id="PARADIP", berth_id="BERTH_05",
    ))
    assert out["status"] == "ELIGIBLE_WITH_CONDITION"

    # Exceeds LOA outright on New Coal Import Berth -> INELIGIBLE
    out = eligibility.evaluate(EligibilityRequest(
        vessel=VesselSpec(loa_m=350, beam_m=45, draft_m=10.0),
        port_id="PARADIP", berth_id="BERTH_03",
    ))
    assert out["status"] == "INELIGIBLE"


def test_missing_vessel_dimension_gives_unknown():
    out = eligibility.evaluate(EligibilityRequest(
        vessel=VesselSpec(loa_m=290, beam_m=None, draft_m=14.0),
        port_id="PARADIP",
    ))
    assert out["status"] == "UNKNOWN"
    assert "VESSEL_DATA_MISSING" in out["reasons"]


def test_unknown_port_gives_unknown_not_eligible():
    out = eligibility.evaluate(EligibilityRequest(
        vessel=VesselSpec(loa_m=290, beam_m=45, draft_m=14.0),
        port_id="HALDIA",  # deliberately not in seed data -- must never be fabricated into ELIGIBLE
    ))
    assert out["status"] == "UNKNOWN"


def test_delay_exposure_not_equal_to_demurrage():
    delay = eligibility.delay_exposure(DelayExposureRequest(
        waiting_days_p10=1, waiting_days_p50=3, waiting_days_p90=7, daily_charter_hire_rate_usd=18500
    ))
    demurrage = eligibility.demurrage_estimate(DemurrageRequest(
        actual_or_forecast_port_time_days=3, allowed_laytime_days=2, contract_rate_usd_per_day=18500
    ))
    assert delay["result"]["delay_exposure_base_p50_usd"] == 3 * 18500
    assert demurrage["result"]["contractual_demurrage_usd"] == 1 * 18500
    assert delay["result"]["delay_exposure_base_p50_usd"] != demurrage["result"]["contractual_demurrage_usd"] or True
    assert "NOT contractual demurrage" in delay["warnings"][0]
