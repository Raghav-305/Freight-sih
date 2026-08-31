# API Contract

## GET /market
Returns current dry-bulk indices and route market values. Include `updated_at`, `indices.bdi`, `indices.bpi`, `indices.bsi`, `route_freight` and `bunker`.

## GET|POST /forecast
Request: `origin`, `destination`, `vessel_type`, `cargo_quantity`, `laycan_start`, `laycan_end`.
Response: `current_freight`, `forecast.7d`, `forecast.30d`, `forecast.60d`, `forecast.90d`, each with `p10`, `p50`, `p90`; plus `confidence`, `model_version`, `dataset_version`, `feature_version`, `training_date`, `shap`.

## POST /vessel/recommend
Request: cargo, origin, destination, laycan and cargo type. Response should identify recommended vessel, feasibility, economic score and explanation.

## POST /port/check
Request: port and vessel/cargo constraints. Response should include feasibility, checked constraints and congestion.

## POST /charter/recommend
Returns recommended strategy, allocation, expected cost, baseline, saving, risk and fixing window.

## POST /contract/optimize
Returns spot/short-term/multi-voyage/COA allocation, expected cost, baseline, saving, risk, strategy and fixing window.

## POST /what-if
Request contains changed cargo, route, vessel, laycan, contract duration, coverage and market/bunker/congestion assumptions. Response contains baseline, scenario and API-driven decision impact.

## GET /risk
Returns overall risk, category scores and event-driven alerts.

## GET /models
Returns model registry metadata and performance metrics.

## GET /data-quality
Returns dataset quality metrics and status.

## GET /health
Returns service health and timestamp.