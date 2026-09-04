# Freight Opportunity Score

A leakage-safe, route-level decision-support model for identifying freight fixing opportunities. The pipeline combines a learned freight-return forecast with market, fleet, port, weather, and voyage-economics signals to produce a Freight Opportunity Score (FOS) from 0 to 100.

The output is intended to support chartering decisions. It is not a guaranteed price forecast or trading recommendation.

## What It Does

- Trains a `RandomForestRegressor` to estimate future 30-day freight returns.
- Scores observations at 7-, 30-, or 60-day horizons.
- Uses an available external forecast column when present; otherwise falls back to the temporal FOS return model.
- Combines seven normalized components into one weighted FOS.
- Produces a recommendation, expected freight value, forecast source, component scores, and component contributions.
- Backtests the FOS signal against realized future freight returns.
- Saves the trained model, feature schema, metadata, predictions, metrics, and feature importance.

## Directory Structure

```text
freight_opportunity_score/
├── freight_opportunity_score.ipynb       # End-to-end training and reporting pipeline
├── src/freight_opportunity_score/
│   ├── __init__.py
│   └── fos_model.py                       # Training, scoring, backtesting, persistence
├── fos_data/
│   └── freight_opportunity_daily.csv      # Input route-day dataset
├── artifacts/
│   ├── fos_model.pkl                      # Persisted scikit-learn pipeline
│   ├── fos_feature_schema.json             # Features used by the model
│   └── fos_metadata.json                   # Training and scoring configuration
└── reports/
    ├── fos_predictions.csv                 # FOS predictions for all input rows
    ├── fos_backtest_predictions.csv        # Predictions joined with realized returns
    ├── fos_backtest_metrics.csv            # Metrics for 7-, 30-, and 60-day horizons
    ├── fos_feature_importance.csv          # Random forest feature importance
    ├── fos_data_quality.json               # Dataset and leakage checks
    └── fos_production_smoke.csv            # Production inference smoke-test output
```

## Data

The bundled dataset contains:

- 64,860 route-day observations
- 30 routes
- Dates from 2020-01-01 through 2025-12-01
- Panamax route observations including freight, market, fleet, port, weather, and voyage-economics fields

The model trains through 2023-12-31 and uses the 30-day future return as its training target. Numeric feature selection excludes identifiers, recommendation fields, model forecast columns, and columns containing leakage tokens such as `future_`, `target`, `label`, `actual_after`, or `backtest`.

## FOS Components

| Component | Weight | Interpretation |
| --- | ---: | --- |
| Forecast | 25% | Expected freight return converted to a 0-100 score |
| Rate opportunity | 15% | Current rate opportunity signal |
| Market signal | 15% | Average of market and FFA scores |
| Fleet supply | 10% | Fleet availability and activity signal |
| Port congestion | 10% | Inverse congestion score |
| Weather risk | 10% | Inverse weather-risk score |
| Voyage economics | 15% | Risk-adjusted or economic score |

Missing component inputs default to 50 before clipping to the 0-100 range. The expected return forecast is mapped from -10% to +10% onto the same range and clipped at the boundaries.

## Recommendations

| FOS range | Recommendation |
| --- | --- |
| `< 20` | `AVOID_WAIT` |
| `20 <= FOS < 40` | `WAIT` |
| `40 <= FOS < 60` | `MONITOR` |
| `60 <= FOS < 80` | `GOOD_OPPORTUNITY` |
| `>= 80` | `FIX_NOW` |

## Run the Pipeline

From the repository root, activate the project environment and run the notebook:

```powershell
.\sihvenv\Scripts\Activate.ps1
jupyter notebook freight_opportunity_score\freight_opportunity_score.ipynb
```

The notebook loads the input data, trains the model, scores all rows, runs the backtest, and refreshes the artifacts and reports in this directory. It expects the notebook to be run either from the repository root or from `freight_opportunity_score/`.

## Production Inference

The persisted model can score a new CSV without retraining:

```python
from freight_opportunity_score.fos_model import production_score

production_score(
    input_csv="new_route_data.csv",
    artifact_dir="freight_opportunity_score/artifacts",
    output_csv="freight_opportunity_score/reports/new_fos_predictions.csv",
)
```

For direct control over loading and scoring:

```python
from freight_opportunity_score.fos_model import FreightOpportunityScorer

scorer = FreightOpportunityScorer("freight_opportunity_score/artifacts").load()
scored = scorer.score(new_data, horizon=30)  # horizon: 7, 30, or 60
```

Input data must include `date`, `route_id`, and `freight_usd_mt`. The component inputs are optional and use neutral defaults when absent. If `model_forecast_7d_usd_mt`, `model_forecast_30d_usd_mt`, or `model_forecast_60d_usd_mt` is available for the selected horizon, it takes precedence over the fallback temporal model for that scoring run.

## Current Backtest Snapshot

The generated report currently contains the following metrics:

| Horizon | Observations | Hit rate | Fix-now precision | False-signal rate |
| ---: | ---: | ---: | ---: | ---: |
| 7 days | 64,650 | 19.91% | 71.46% | 7.43% |
| 30 days | 63,960 | 26.72% | 96.85% | 0.80% |
| 60 days | 63,060 | 22.26% | 82.32% | 4.46% |

These are historical backtest results on the bundled data and should not be treated as prospective performance guarantees.

## Dependencies

- Python 3.11+
- pandas
- numpy
- scikit-learn
- Jupyter Notebook

The model uses a scikit-learn pipeline with median imputation and a random forest regressor (`250` trees, maximum depth `12`, minimum leaf size `8`, random state `42`).

## Limitations

- Results depend on the quality and representativeness of the supplied route-day data.
- The current bundled run has no non-null external forecast rows, so its predictions use the temporal FOS return model fallback.
- Synthetic or derived market fields may not represent official market data.
- Backtest metrics can differ from live performance because market conditions, coverage, and data availability change.
- Validate predictions with current commercial, operational, and safety constraints before acting on them.
