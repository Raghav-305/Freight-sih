import unittest
from optimization.contract_optimizer import optimize_contract
from optimization.scenario_engine import run_scenario
from optimization.positioning import recommend_positioning
from optimization.vessel_selection import recommend_vessel


class OptimizationModulesTest(unittest.TestCase):
    def test_contract_optimizer_allocates_100_percent(self):
        payload = {
            "cargo_quantity": 480000,
            "origin": "Australia",
            "destination": "Dhamra",
            "period_start": "2026-10-01",
            "period_end": "2027-03-31",
            "contract_options": ["spot", "short_term", "multi_voyage", "coa"],
            "market_regime": "BULLISH",
            "current_freight": 20.0,
        }
        result = optimize_contract(payload)
        self.assertIn("allocation", result)
        total_alloc = sum(result["allocation"].values())
        self.assertAlmostEqual(total_alloc, 100.0, places=1)
        self.assertGreater(result["baseline_cost"], 0)
        self.assertGreater(result["expected_cost"], 0)
        self.assertGreaterEqual(result["expected_saving"], 0)
        self.assertIn("COA", result["strategy"])

    def test_scenario_engine_evaluates_deltas(self):
        payload = {
            "cargo_quantity": 500000,
            "origin": "Australia",
            "destination": "Dhamra",
            "vessel_type": "Panamax",
            "coverage": 70,
            "freight_change_pct": 10.0,
            "bunker_change_pct": 5.0,
            "congestion_change_days": 1.5,
        }
        result = run_scenario(payload)
        self.assertIn("baseline", result)
        self.assertIn("scenario", result)
        self.assertIn("financial_deltas", result)
        self.assertGreater(result["scenario"]["total_landed_cost_usd"], result["baseline"]["total_landed_cost_usd"])
        self.assertGreater(result["financial_deltas"]["total_cost_delta_usd"], 0)

    def test_positioning_feasibility(self):
        payload = {
            "vessel_name": "MV Jag Ratan",
            "current_port": "Singapore",
            "load_port": "Gladstone",
            "laycan_start": "2026-10-10",
            "laycan_end": "2026-10-20",
            "as_of_date": "2026-09-25",
            "speed_knots": 13.5,
        }
        result = recommend_positioning(payload)
        self.assertIn("steaming_days", result)
        self.assertIn("eta", result)
        self.assertIn("status", result)
        self.assertGreater(result["distance_nm"], 2000)

    def test_vessel_selection_wrapper(self):
        payload = {
            "destination": "Dhamra",
            "vessel_type": "Panamax",
            "cargo_quantity": 70000,
            "limit": 5,
        }
        result = recommend_vessel(payload)
        self.assertIn("recommended_vessel", result)
        self.assertIn("candidates", result)
        self.assertGreaterEqual(result["candidate_count"], 1)


if __name__ == "__main__":
    unittest.main()
