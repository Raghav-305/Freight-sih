import pandas as pd

from ml.inference.market_intelligence import _load_daily_dataset, _match_route, _latest_row, _prepare_inference_features


def test_prepare_inference_features_fills_missing_encoded_target():
    df = _load_daily_dataset()
    route_df = _match_route(df, "Australia", "Dhamra", "Panamax")
    latest_row = _latest_row(route_df).to_frame().T
    latest_row["market_regime_encoded"] = float("nan")

    prepared = _prepare_inference_features(latest_row)

    assert "market_regime_encoded" in prepared.columns
    assert pd.notna(prepared["market_regime_encoded"]).all()
    assert prepared["market_regime_encoded"].iat[0] == 1
