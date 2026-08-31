# Model Handoff

Put trained models under:

```text
ml/models/forecasting/xgboost/panamax_freight_v7/
```

Minimum expected files:

```text
model.json
feature_schema.json
metadata.json
```

If the model was serialized differently, use the corresponding artifact name,
for example `model.pkl`, `model.joblib` or `model.onnx`, and update
`ml/registry/model_registry.json`.

Do not place model files in `frontend/`, root `public/`, or any browser-readable
static asset directory.
