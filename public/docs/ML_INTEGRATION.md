# ML Integration

Frontend never imports model code. Use `FastAPI → service → ml/inference`.

Forecast input should contain route, vessel class, cargo quantity/type, laycan and the feature set selected by the model. Forecast output must include current freight, 7/30/60/90-day forecasts, probabilistic quantiles P10/P25/P50/P75/P90, confidence and reproducibility metadata. SHAP contributions should be structured as `{feature, impact, direction}` records.

Congestion prediction should follow the same principle: stable API contract, model/version metadata, timestamp and uncertainty where supported. Replace mock service internals without changing frontend presentation components.