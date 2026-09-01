import unittest

from ml.inference.forecast import run_forecast


class ForecastInferenceIntegrationTest(unittest.TestCase):
    def test_run_forecast_uses_real_model_output(self):
        payload = {
            "origin": "Australia",
            "destination": "Dhamra",
            "vessel_type": "Panamax",
            "cargo_type": "Coal",
            "cargo_quantity": 80000,
            "laycan_start": "2026-10-10",
            "laycan_end": "2026-10-20",
        }

        result = run_forecast(payload)

        self.assertEqual(result["model_version"], "xgb_panamax_freight_v7")
        self.assertEqual(result["feature_version"], "lags_rolling_calendar_v1")
        self.assertNotIn("placeholder", result["dataset_version"])
        self.assertNotIn("replace-with", result["training_date"])
        self.assertGreater(result["current_freight"], 0)
        self.assertTrue(all(band["p50"] > 0 for band in result["forecast"].values()))


if __name__ == "__main__":
    unittest.main()
