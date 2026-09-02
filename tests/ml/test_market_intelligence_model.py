import json
from pathlib import Path

import pandas as pd

from ml.inference.market_intelligence import _load_daily_dataset, _match_route, _latest_row, _prepare_inference_features, _load_predictor


def test_market_model_feature_schema_matches_live_data():
    df = _load_daily_dataset()
    route_df = _match_route(df, 'Australia', 'Dhamra', 'Panamax')
    assert not route_df.empty

    latest_row = _latest_row(route_df).to_frame().T
    prepared = _prepare_inference_features(latest_row)

    feature_schema = json.loads(Path('ml/models/market_intelligence/market_intelligence_v1/market_intelligence_feature_columns.json').read_text(encoding='utf-8'))
    missing = [col for col in feature_schema if col not in prepared.columns]
    assert not missing, f'Missing required inference features: {missing[:10]}'

    predictor = _load_predictor()
    assert predictor is not None

    prediction = predictor.predict_market_intelligence(prepared)
    assert 'bearish_probability' in prediction.columns
    assert 'neutral_probability' in prediction.columns
    assert 'bullish_probability' in prediction.columns
    assert pd.notna(prediction['bearish_probability']).all()
    assert pd.notna(prediction['neutral_probability']).all()
    assert pd.notna(prediction['bullish_probability']).all()
