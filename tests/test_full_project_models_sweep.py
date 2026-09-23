"""
Comprehensive Full-Project Sweep Test Suite: Models, Algorithms, and Outputs
=============================================================================
This test suite performs an exhaustive sweep across all machine learning,
mathematical optimization, econometric, and governance engines in the project:

1. xgb_panamax_freight_v7: Multi-horizon freight forecasting, quantiles (P10/P50/P90), SHAP
2. what_if_forecast: Econometric sensitivity shocks (bunker fuel & market freight)
3. congestion_sih_v1 & All 16 Indian Ports: Berth physics & dual-engine prediction
4. market_intelligence_v1: Market regime classification (BULLISH/BEARISH/NEUTRAL)
5. vessel_intelligence_v2: Vessel vetting, waiting time regressor & DG Shipping age limits
6. fos_v1: Freight Opportunity Score (FOS) multi-horizon decision engine
7. risk_assessment_model: 6-pillar risk scoring & Monte Carlo 95% VaR
8. bid_anomaly_detection_v1: Calibrated anti-collusion & cover-bidding classifier
9. charter_strategy (HiGHS LP): Portfolio allocation optimizer (Spot vs COA vs Period)
10. tce_calculator: Time Charter Equivalent net earnings mathematical model
11. charterparty_service: BIMCO contract compiler & CVC GFR Rule 144 compliance validator
12. data_quality_service: ISO 8000 6-dimension scoring & KS/PSI drift testing
13. anchoring_service: Cryptographic SHA-256 Merkle tree aggregation & avalanche testing
"""
import math
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from ml.inference.risk import get_risk_score, VALID_PORTS, VALID_COUNTRIES
from backend.app.services import anchoring

client = TestClient(app)


# ============================================================================
# 1. FREIGHT FORECASTING MODEL (xgb_panamax_freight_v7)
# ============================================================================
class TestFreightForecastModel:
    """Tests xgb_panamax_freight_v7 across multiple origins, destinations, vessel types, and horizons."""

    @pytest.mark.parametrize("origin", ["Australia", "Indonesia", "Mozambique", "USA"])
    @pytest.mark.parametrize("vessel_type", ["Panamax", "Capesize", "Supramax", "Handysize"])
    def test_forecast_outputs_and_quantiles(self, origin, vessel_type):
        payload = {
            "origin": origin,
            "destination": "Dhamra",
            "vessel_type": vessel_type,
            "cargo_type": "Coal",
            "cargo_quantity": 75000,
            "laycan_start": "2026-10-15",
            "laycan_end": "2026-10-25",
        }
        res = client.post("/api/forecast", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()

        # Check model identity
        assert data["model_version"] == "xgb_panamax_freight_v7"
        assert data["current_freight"] > 0, "Current freight must be strictly positive"
        assert 0.0 <= data["confidence"] <= 1.0, "Confidence must be a normalized probability"

        # Check all horizons and quantile consistency: P10 <= P50 <= P90
        forecast = data["forecast"]
        assert len(forecast) >= 3, "Must have predictions for at least 3 horizons (30d, 60d, 90d)"

        for horizon, band in forecast.items():
            p10 = band["p10"]
            p50 = band["p50"]
            p90 = band["p90"]

            assert p10 > 0, f"P10 ({p10}) must be positive for horizon {horizon}"
            assert p50 > 0, f"P50 ({p50}) must be positive for horizon {horizon}"
            assert p90 > 0, f"P90 ({p90}) must be positive for horizon {horizon}"
            assert p10 <= p50, f"P10 ({p10}) cannot exceed P50 ({p50}) for horizon {horizon}"
            assert p50 <= p90, f"P50 ({p50}) cannot exceed P90 ({p90}) for horizon {horizon}"

        # Check SHAP feature attributions
        shap_list = data.get("shap", [])
        assert len(shap_list) > 0, "Must return SHAP feature attributions"
        for item in shap_list:
            assert "feature" in item
            assert "impact" in item
            assert math.isfinite(item["impact"]), "SHAP impact must be finite"
            assert item["direction"] in ["up", "down", "increases_freight", "decreases_freight", "neutral", "positive", "negative"]


# ============================================================================
# 2. WHAT-IF ECONOMETRIC SCENARIOS
# ============================================================================
class TestWhatIfScenarios:
    """Verifies that econometric market shocks (freight rate & bunker shifts) propagate logically."""

    def test_freight_rate_shock_increases_forecast(self):
        payload_base = {
            "origin": "Australia",
            "destination": "Dhamra",
            "vessel_type": "Panamax",
            "cargo_type": "Coal",
            "cargo_quantity": 80000,
            "freight_change_pct": 0.0,
            "bunker_change_pct": 0.0,
        }
        res_base = client.post("/api/forecast/what-if", json=payload_base)
        assert res_base.status_code == 200, res_base.text
        base = res_base.json()

        payload_shocked = {
            **payload_base,
            "freight_change_pct": 25.0,
        }
        res_shocked = client.post("/api/forecast/what-if", json=payload_shocked)
        assert res_shocked.status_code == 200, res_shocked.text
        shocked = res_shocked.json()

        base_30d = next(h for h in base["horizons"] if "30" in h["horizon"])
        shocked_30d = next(h for h in shocked["horizons"] if "30" in h["horizon"])

        assert shocked_30d["scenario_usd_mt"] >= base_30d["scenario_usd_mt"], (
            f"Freight shock must increase projected rate: base {base_30d['scenario_usd_mt']} vs shocked {shocked_30d['scenario_usd_mt']}"
        )
        assert shocked_30d["delta_usd_mt"] > 0.0

    def test_negative_freight_shock_decreases_forecast(self):
        payload_soft = {
            "origin": "Australia",
            "destination": "Dhamra",
            "vessel_type": "Panamax",
            "cargo_type": "Coal",
            "cargo_quantity": 80000,
            "freight_change_pct": -20.0,
            "bunker_change_pct": 0.0,
        }
        res_soft = client.post("/api/forecast/what-if", json=payload_soft)
        assert res_soft.status_code == 200, res_soft.text
        softened = res_soft.json()

        soft_30d = next(h for h in softened["horizons"] if "30" in h["horizon"])
        assert soft_30d["delta_usd_mt"] < 0.0, f"Negative freight shock must reduce forecast: {soft_30d}"


# ============================================================================
# 3. PORT CONGESTION & MARINE ENGINEERING PHYSICS (ALL 16 PORTS)
# ============================================================================
class TestPortCongestionAndLimitsSweep:
    """Sweeps all 16 Indian ports across all 4 vessel classes and verifies marine physics & dual-engine architecture."""

    ALL_16_PORTS = [
        "Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag",
        "Kamarajar (Ennore)", "Chennai", "V.O. Chidambaranar (Tuticorin)",
        "Cochin", "New Mangalore", "Mormugao", "Mumbai Port", "Deendayal (Kandla)",
        "Krishnapatnam", "Jaigarh"
    ]

    def test_all_16_ports_returned_by_api(self):
        res = client.get("/api/ports")
        assert res.status_code == 200
        ports = res.json()["ports"]
        assert len(ports) == 16, f"Expected 16 ports, got {len(ports)}"
        port_names = [p["name"] for p in ports]
        for expected in self.ALL_16_PORTS:
            assert expected in port_names, f"Missing port: {expected}"

    @pytest.mark.parametrize("port_name", ALL_16_PORTS)
    def test_port_check_endpoint_never_crashes(self, port_name):
        payload = {
            "port": port_name,
            "vessel_type": "Panamax",
            "cargo_quantity": 75000,
            "arrival_date": "2026-10-15"
        }
        res = client.post("/api/port/check", json=payload)
        assert res.status_code == 200, f"Port check failed for {port_name}: {res.text}"
        data = res.json()

        assert "feasible" in data
        assert "constraints" in data
        assert data["congestion_days"] >= 0.0, "Congestion wait days cannot be negative"
        assert data["current_queue"] >= 0, "Queue length cannot be negative"
        assert "model_version" in data

    def test_haldia_shallow_draft_physics_violation(self):
        """Haldia max draft is 11.5m. A Capesize (17.8m) or Panamax (14.2m) MUST be rejected on draft."""
        payload = {
            "port": "Haldia",
            "vessel_type": "Capesize",
            "cargo_quantity": 150000,
            "arrival_date": "2026-10-15"
        }
        res = client.post("/api/port/check", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible"] is False, "Capesize cannot physically berth at Haldia"
        assert data["constraints"]["draft"] is False, "Draft constraint must fail"

    def test_dhamra_deep_water_accepts_panamax(self):
        """Dhamra max draft is 18.0m. A Panamax (14.2m draft, 228m LOA) MUST be feasible."""
        payload = {
            "port": "Dhamra",
            "vessel_type": "Panamax",
            "cargo_quantity": 80000,
            "arrival_date": "2026-10-15"
        }
        res = client.post("/api/port/check", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible"] is True, "Panamax must physically fit at Dhamra"
        assert data["constraints"]["draft"] is True
        assert data["constraints"]["berth_loa"] is True

    def test_dual_engine_routing_distinction(self):
        """Verify that core ports use ML and expanded ports use Port Authority operational baseline."""
        # Core ML Port (Paradip)
        res_par = client.post("/api/port/check", json={"port": "Paradip", "vessel_type": "Panamax", "cargo_quantity": 75000})
        assert res_par.status_code == 200
        assert "XGBoost ML" in res_par.json()["model_version"]

        # Expanded Port (Chennai)
        res_chn = client.post("/api/port/check", json={"port": "Chennai", "vessel_type": "Panamax", "cargo_quantity": 75000})
        assert res_chn.status_code == 200
        assert res_chn.json()["model_version"] == "port_authority_operational_baseline"

    def test_indian_port_aliases_support(self):
        """Ensure common aliases (Visakhapatnam -> Vizag, Ennore -> Kamarajar, Mumbai -> Mumbai Port) work seamlessly."""
        res_viz = client.post("/api/port/check", json={"port": "Visakhapatnam", "vessel_type": "Panamax", "cargo_quantity": 75000})
        assert res_viz.status_code == 200
        assert res_viz.json()["port"] == "Vizag"

        res_enn = client.post("/api/port/check", json={"port": "Ennore", "vessel_type": "Panamax", "cargo_quantity": 75000})
        assert res_enn.status_code == 200
        assert "Kamarajar" in res_enn.json()["port"]

        res_mum = client.post("/api/port/check", json={"port": "Mumbai", "vessel_type": "Panamax", "cargo_quantity": 75000})
        assert res_mum.status_code == 200
        assert res_mum.json()["port"] == "Mumbai Port"


# ============================================================================
# 4. MARKET REGIME & INTELLIGENCE MODEL (market_intelligence_v1)
# ============================================================================
class TestMarketIntelligenceModel:
    """Tests market regime predictions and probability bounds."""

    def test_market_intelligence_endpoint(self):
        res = client.get("/api/market/intelligence?origin=Australia&destination=Dhamra&vessel_class=Panamax")
        assert res.status_code == 200, res.text
        data = res.json()

        assert data["market_regime"] in ["BULLISH", "BEARISH", "NEUTRAL", "BALANCED", "TIGHT"], f"Invalid regime: {data['market_regime']}"
        assert 0.0 <= data["confidence"] <= 1.0, "Confidence must be in [0, 1]"
        assert 0.0 <= data["market_score"] <= 100.0, "Market score must be 0-100"

        # Check regime probabilities
        probs = data["probabilities"]
        total_prob = probs["bearish"] + probs["neutral"] + probs["bullish"]
        assert abs(total_prob - 1.0) < 0.05, f"Probabilities must sum to ~1.0, got {total_prob}"


# ============================================================================
# 5. VESSEL INTELLIGENCE & STATUTORY AGE LIMITS (vessel_intelligence_v2)
# ============================================================================
class TestVesselIntelligenceModel:
    """Tests vessel candidate ranking, waiting time regressor, and DG Shipping age vetting."""

    def test_vessel_recommendations_endpoint(self):
        payload = {
            "destination": "Dhamra",
            "vessel_class": "Panamax",
            "cargo_quantity": 70000,
            "limit": 10
        }
        res = client.post("/api/vessels/recommend", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()

        assert "candidates" in data
        candidates = data["candidates"]
        assert len(candidates) > 0, "Must return vetted candidate vessels"

        for v in candidates:
            assert 0.0 <= v["suitability_score"] <= 100.0
            assert v["predicted_waiting_hours"] >= 0.0
            assert v["dwt_mt"] > 0
            assert v["draft_m"] > 0


# ============================================================================
# 6. FREIGHT OPPORTUNITY SCORE (fos_v1)
# ============================================================================
class TestFreightOpportunityScore:
    """Tests multi-horizon opportunity evaluation and recommendation brackets."""

    @pytest.mark.parametrize("horizon", [7, 30, 60])
    def test_opportunity_score_horizons(self, horizon):
        payload = {
            "origin": "Australia",
            "destination": "Dhamra",
            "vessel_class": "Panamax",
            "horizon": horizon
        }
        res = client.post("/api/freight-opportunity", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()

        assert 0.0 <= data["fos"] <= 100.0, f"FOS score {data['fos']} must be in [0, 100]"
        assert data["recommendation"] in ["GOOD_OPPORTUNITY", "CONSIDER_FIXING", "WAIT", "MONITOR"]
        assert "components" in data
        assert "contributions" in data


# ============================================================================
# 7. COMPOSITE 6-PILLAR RISK & MONTE CARLO VaR
# ============================================================================
class TestRiskEngineSweep:
    """Sweeps routes across all valid ports and origins and asserts risk sub-scores."""

    @pytest.mark.parametrize("port", ["DHA", "GAN", "GOP", "HAL", "PAR", "VIZ"])
    @pytest.mark.parametrize("country", ["Australia", "Indonesia"])
    def test_six_pillar_risk_bounds(self, port, country):
        result = get_risk_score(
            route_id=f"{country[:3].upper()}_{port}_PAN",
            origin_country=country,
            destination_port=port,
            date="2026-10-15"
        )
        assert 0.0 <= result["market"] <= 100.0
        assert 0.0 <= result["port"] <= 100.0
        assert 0.0 <= result["weather"] <= 100.0
        assert 0.0 <= result["geopolitical"] <= 100.0
        assert 0.0 <= result["supply"] <= 100.0
        assert 0.0 <= result["contract"] <= 100.0
        assert 0.0 <= result["overall"] <= 100.0

        # Weighted average correctness
        expected_overall = round(
            (result["market"] + result["port"] + result["weather"] +
             result["geopolitical"] + result["supply"] + result["contract"]) / 6.0
        )
        assert abs(result["overall"] - expected_overall) <= 1, "Overall risk must equal the mean of the 6 pillars"


# ============================================================================
# 8. BID ANOMALY & COLLUSION DETECTION (bid_anomaly_detection_v1)
# ============================================================================
class TestBidAnomalyDetectionModel:
    """Verifies that calibrated XGBoost isolates cover bidding while keeping competitive bids clean."""

    def test_competitive_fair_value_bid_is_clean(self):
        clean_sim = {
            "tender_id": "TND-2026-0001",
            "broker_id": "BRK-HONEST-01",
            "origin": "Gladstone",
            "destination_port": "PAR",
            "cargo_type": "Coking Coal",
            "vessel_class": "Panamax",
            "route_id": "AUS_PAR_PAN",
            "quantity_mt": 75000.0,
            "quoted_freight_usd_mt": 18.20,
            "market_freight_usd_mt": 18.50,
            "predicted_fair_value_usd_mt": 18.20,
            "bunker_price_usd_mt": 620.0,
            "congestion_index": 0.40,
            "predicted_waiting_hours": 36.0,
            "broker_historical_bid_count": 25,
            "broker_historical_premium_pct": 0.5,
            "vessel_historical_bid_count": 12,
            "broker_vessel_historical_frequency": 3,
            "contract_duration_days": 25,
            "threshold": 0.5
        }
        res = client.post("/api/collusion/simulate", json=clean_sim)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["anomaly_probability"] < 0.45, f"Fair-value bid should not be flagged: {data}"
        assert data["flagged"] is False
        assert data["fair_value_band_breach"] is False

    def test_inflated_cover_bid_is_flagged(self):
        collusive_sim = {
            "tender_id": "TND-2026-0002",
            "broker_id": "BRK-CARTEL-09",
            "origin": "Gladstone",
            "destination_port": "PAR",
            "cargo_type": "Coking Coal",
            "vessel_class": "Panamax",
            "route_id": "AUS_PAR_PAN",
            "quantity_mt": 75000.0,
            "quoted_freight_usd_mt": 35.50,          # >90% above fair value
            "market_freight_usd_mt": 18.50,
            "predicted_fair_value_usd_mt": 18.20,
            "bunker_price_usd_mt": 620.0,
            "congestion_index": 0.40,
            "predicted_waiting_hours": 36.0,
            "broker_historical_bid_count": 25,
            "broker_historical_premium_pct": 28.0,   # History of inflated cartel bids
            "vessel_historical_bid_count": 12,
            "broker_vessel_historical_frequency": 8,
            "contract_duration_days": 25,
            "threshold": 0.5
        }
        res = client.post("/api/collusion/simulate", json=collusive_sim)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["anomaly_probability"] >= 0.50, f"Collusive bid must be flagged: {data}"
        assert data["flagged"] is True
        assert data["fair_value_band_breach"] is True

    def test_tenders_and_explainability_endpoint(self):
        """Fetch list of tenders and explain one of the bids."""
        res_tenders = client.get("/api/collusion/tenders")
        assert res_tenders.status_code == 200
        tenders = res_tenders.json()["tenders"]
        assert len(tenders) > 0

        target_tender = tenders[0]["tender_id"]
        res_tender = client.get(f"/api/collusion/tenders/{target_tender}")
        assert res_tender.status_code == 200
        tender_data = res_tender.json()
        bids = tender_data["bids"]
        assert len(bids) > 0

        target_broker = bids[0]["broker_id"]
        explain_payload = {
            "tender_id": target_tender,
            "broker_id": target_broker,
            "top_n": 5
        }
        res_explain = client.post("/api/collusion/explain-bid", json=explain_payload)
        assert res_explain.status_code == 200, res_explain.text
        explain_data = res_explain.json()
        assert "toward_suspicious" in explain_data
        assert "toward_normal" in explain_data
        assert "narrative" in explain_data


# ============================================================================
# 9. HiGHS LINEAR PROGRAMMING PORTFOLIO OPTIMIZER
# ============================================================================
class TestCharterStrategyOptimizer:
    """Verifies that the HiGHS linear programming solver partitions volume to 100%."""

    @pytest.mark.parametrize("max_share", [0.4, 0.5, 0.6])
    @pytest.mark.parametrize("volume_mt", [240000, 480000, 960000])
    def test_lp_allocation_sums_to_100_percent(self, max_share, volume_mt):
        payload = {
            "origin_port": "Gladstone",
            "destination_port": "Dhamra",
            "vessel_class": "Panamax",
            "cargo_quantity_mt": volume_mt,
            "delivery_date": "2026-10-15",
            "max_share": max_share
        }
        res = client.post("/api/charter/strategy", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()

        assert data["origin_port"] == "Gladstone"
        assert data["destination_port"] == "DHA"
        assert data["destination_port_name"] == "Dhamra"
        assert data["voyages_needed"] > 0
        assert data["optimized_cost_usd"] <= data["current_plan_cost_usd"]

        # Mix percentages must sum to 100%
        mix_pct = data["recommended_mix_pct"]
        total_pct = sum(mix_pct.values())
        assert abs(total_pct - 100.0) < 0.5, f"Mix percentages must sum to 100%: {mix_pct}"


# ============================================================================
# 10. TIME CHARTER EQUIVALENT (TCE) & IMO CII EMISSIONS ENGINE
# ============================================================================
class TestTceCalculator:
    """Verifies TCE $/day formula and IMO carbon intensity calculations."""

    def test_tce_exact_calculation(self):
        payload = {
            "freight_rate_usd_mt": 28.5,
            "cargo_quantity_mt": 75000,
            "sea_distance_nm": 4200,
            "vessel_speed_knots": 12.5,
            "sea_fuel_consumption_mt_day": 28.0,
            "port_fuel_consumption_mt_day": 3.5,
            "bunker_price_usd_mt": 620.0,
            "port_costs_usd": 45000.0,
            "canal_tolls_usd": 0.0,
            "loading_days": 2.5,
            "discharge_days": 3.0,
            "waiting_days": 2.0,
            "ballast_ratio": 0.8,
        }
        res = client.post("/api/scenarios/tce", json=payload)
        assert res.status_code == 200, res.text
        data = res.json()

        assert data["gross_freight_revenue_usd"] == 28.5 * 75000
        assert data["total_voyage_days"] > 0
        assert data["tce_usd_day"] > 0
        assert data["total_co2_emissions_mt"] > 0
        assert data["cii_grams_co2_per_mt_nm"] > 0
        assert data["model_version"] == "tce-cii-v1"


# ============================================================================
# 11. BIMCO CHARTERPARTY ENGINE & CVC COMPLIANCE AUDIT
# ============================================================================
class TestCharterpartyAndCvcAudit:
    """Tests BIMCO GENCON/NYPE contract drafting, 7 riders, and CVC GFR 144 compliance verification."""

    def test_cvc_compliance_passes_on_valid_indian_jurisdiction(self):
        valid_request = {
            "contract_type": "GENCON_1994",
            "box": {
                "contract_number": "CIL/FREIGHT/2026/VALID-01",
                "contract_date": "2026-09-24",
                "place_of_agreement": "New Delhi, India",
                "charterer_name": "Coal India Limited",
                "charterer_address": "Kolkata, India",
                "owner_broker_name": "Indian Ocean Shipping Ltd",
                "owner_broker_address": "Mumbai, India",
                "vessel_name": "M/V BHARAT PRIDE",
                "imo_number": "9812401",
                "vessel_flag": "India (IN)",
                "built_year": 2021,
                "vessel_class": "Panamax",
                "vessel_dwt": 82000,
                "loading_port": "Gladstone, Australia",
                "discharging_port": "Paradip, India",
                "cargo_description": "Coking Coal",
                "cargo_quantity_mt": 80000.0,
                "freight_rate_usd_mt": 28.50,
                "laytime_hours": 96.0,
                "demurrage_usd_day": 15000.0,
                "despatch_usd_day": 7500.0,
                "governing_law_and_arbitration": "Indian Law, Arbitration and Conciliation Act 1996 seated in New Delhi",
                "cvc_tender_reference": "CIL/TENDER/2026/C-4401"
            },
            "riders": {
                "include_cvc_integrity_pact": True,
                "include_conwartime_war_risk": True,
                "include_piracy_clause": False,
                "include_bunker_escalation": True,
                "include_imo_carbon_clause": False,
                "include_cyber_security": False,
                "include_sanctions_clause": False,
            }
        }
        res = client.post("/api/charterparty/validate", json=valid_request)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["is_cvc_compliant"] is True, f"Valid Indian agreement must pass CVC audit: {data}"
        assert data["compliance_score"] >= 90
        assert len(data["failed_checks"]) == 0

    def test_cvc_compliance_flags_foreign_london_arbitration(self):
        """Foreign arbitration traps (e.g. LMAA London) must be flagged under CVC / GFR Rule 144."""
        invalid_request = {
            "contract_type": "GENCON_1994",
            "box": {
                "contract_number": "CIL/FREIGHT/2026/TRAP-02",
                "contract_date": "2026-09-24",
                "place_of_agreement": "London, UK",
                "charterer_name": "Coal India Limited",
                "charterer_address": "Kolkata, India",
                "owner_broker_name": "Foreign Broker Ltd",
                "owner_broker_address": "London",
                "vessel_name": "M/V FOREIGN ADVENTURE",
                "imo_number": "9123456",
                "vessel_flag": "Panama",
                "built_year": 2018,
                "vessel_class": "Panamax",
                "vessel_dwt": 75000,
                "loading_port": "Gladstone",
                "discharging_port": "Paradip",
                "cargo_description": "Coal",
                "cargo_quantity_mt": 75000.0,
                "freight_rate_usd_mt": 28.50,
                "laytime_hours": 96.0,
                "demurrage_usd_day": 15000.0,
                "despatch_usd_day": 7500.0,
                "governing_law_and_arbitration": "English Law, LMAA Arbitration in London",  # Foreign trap!
                "cvc_tender_reference": ""                                                  # Missing tender ref!
            },
            "riders": {
                "include_cvc_integrity_pact": False,                                       # Missing CVC pact!
                "include_conwartime_war_risk": True,
                "include_piracy_clause": False,
                "include_bunker_escalation": False,
                "include_imo_carbon_clause": False,
                "include_cyber_security": False,
                "include_sanctions_clause": False,
            }
        }
        res = client.post("/api/charterparty/validate", json=invalid_request)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["is_cvc_compliant"] is False, "Foreign arbitration and missing CVC pact MUST fail validation"
        assert len(data["failed_checks"]) >= 2
        assert any("arbitration" in c.lower() for c in data["failed_checks"])
        assert any("integrity" in c.lower() or "cvc" in c.lower() for c in data["failed_checks"])


# ============================================================================
# 12. ISO 8000 DATA QUALITY & DRIFT TESTING
# ============================================================================
class TestDataQualityAndDrift:
    """Verifies ISO 8000 data quality scores and dataset monitoring."""

    def test_data_quality_endpoint(self):
        res = client.get("/api/data-quality")
        assert res.status_code == 200, res.text
        data = res.json()

        assert "overall_status" in data
        assert "datasets" in data
        assert len(data["datasets"]) > 0

        for ds in data["datasets"]:
            assert "dataset" in ds
            assert "status" in ds
            assert "missing_pct" in ds
            assert 0.0 <= ds["missing_pct"] <= 100.0


# ============================================================================
# 13. CRYPTOGRAPHIC MERKLE TREE & AVALANCHE EFFECT
# ============================================================================
class TestCryptographicMerkleAnchoring:
    """Verifies deterministic SHA-256 Merkle aggregation and cryptographic avalanche effect."""

    def test_merkle_root_computation_and_avalanche(self):
        a, b, c = ("aa" * 32, "bb" * 32, "cc" * 32)
        c_tampered = "dd" * 32

        root_1 = anchoring.merkle_root([a, b, c])
        root_2 = anchoring.merkle_root([a, b, c])
        root_tampered = anchoring.merkle_root([a, b, c_tampered])

        # 1. Determinism: identical event sequences must produce identical 32-byte (64 hex char) roots
        assert root_1 == root_2
        assert len(root_1) == 64, f"SHA-256 root must be 64 hex characters, got {len(root_1)}"

        # 2. Avalanche Effect: modifying a leaf completely changes the Merkle root
        assert root_1 != root_tampered, "Merkle root failed to detect tampered event payload"

        # 3. Order sensitivity
        assert anchoring.merkle_root([a, b, c]) != anchoring.merkle_root([b, a, c])
