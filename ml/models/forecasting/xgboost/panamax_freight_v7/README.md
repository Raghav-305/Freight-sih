# Panamax Freight XGBoost Model

Imported Panamax freight forecasting model from `AI-FREIGHT`.

Model files:

- `model.pkl`
- `feature_schema.json`
- `metadata.json`

The frontend must never read this folder. `ml/inference/forecast.py` loads these
files through the backend.
