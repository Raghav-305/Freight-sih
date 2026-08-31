# Panamax Freight XGBoost Model Placeholder

Place the trained Panamax freight forecasting model files in this folder.

Expected files:

- `model.json` or `model.pkl`
- `feature_schema.json`
- `metadata.json`

The frontend must never read this folder. `ml/inference/forecast.py` loads these
files through the backend.
