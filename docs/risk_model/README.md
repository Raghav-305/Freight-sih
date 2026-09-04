# Risk Intelligence

The risk engine is a rule-based decision-support component, not a trained ML model. It combines six 0-100 scores with equal weights:

- market
- port
- weather
- geopolitical
- supply
- contract

The engine is implemented in `ml/inference/risk.py` and reads derived lookup tables from `ml/artifacts/risk_model`. The FastAPI endpoint is `POST /risk` and accepts `route_id`, `origin_country`, `destination_port`, and `date`.

The response contains the component scores, weighted `overall` and `overall_risk` values, and the resolved destination port name. It is exposed in the React frontend under Risk Intelligence.

Risk scores are synthetic/proxy decision-support signals and must not be treated as guaranteed outcomes or official market observations.
