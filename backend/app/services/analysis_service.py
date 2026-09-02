from __future__ import annotations

import pandas as pd

from backend.app.schemas.analysis import (
    ExplainForecastRequest,
    ExplainForecastResponse,
    WhatIfForecastRequest,
    WhatIfForecastResponse,
)
from ml.explainability.explain_prediction import explain_prediction
from ml.inference.what_if_forecast import run_what_if


class AnalysisService:
    def explain_forecast(self, request: ExplainForecastRequest) -> ExplainForecastResponse:
        data_path = "data/processed/model_data.csv"
        data = pd.read_csv(data_path, parse_dates=["date"])

        latest = (
            data.sort_values(["route_id", "date"])
            .groupby("route_id")
            .tail(1)
            .copy()
        )

        route_row = latest[
            (latest["origin"].astype(str).str.lower() == request.origin.lower())
            & (latest["destination_port"].astype(str).str.lower() == request.destination.lower())
            & (latest["vessel_class"].astype(str).str.lower() == request.vessel_type.lower())
        ]

        if route_row.empty:
            route_row = latest[
                (latest["destination_port"].astype(str).str.lower() == request.destination.lower())
                & (latest["vessel_class"].astype(str).str.lower() == request.vessel_type.lower())
            ]

        if route_row.empty:
            raise ValueError(f"No route data found for {request.origin} -> {request.destination} ({request.vessel_type})")

        result = explain_prediction(route_row.iloc[0], horizon=request.horizon)
        return ExplainForecastResponse(**result)

    def what_if_forecast(self, request: WhatIfForecastRequest) -> WhatIfForecastResponse:
        data_path = "data/processed/model_data.csv"
        data = pd.read_csv(data_path, parse_dates=["date"])

        latest = (
            data.sort_values(["route_id", "date"])
            .groupby("route_id")
            .tail(1)
            .copy()
        )

        route_row = latest[
            (latest["origin"].astype(str).str.lower() == request.origin.lower())
            & (latest["destination_port"].astype(str).str.lower() == request.destination.lower())
            & (latest["vessel_class"].astype(str).str.lower() == request.vessel_type.lower())
        ]

        if route_row.empty:
            route_row = latest[
                (latest["destination_port"].astype(str).str.lower() == request.destination.lower())
                & (latest["vessel_class"].astype(str).str.lower() == request.vessel_type.lower())
            ]

        if route_row.empty:
            raise ValueError(f"No route data found for {request.origin} -> {request.destination} ({request.vessel_type})")

        result = run_what_if(
            route_row.iloc[0],
            freight_change_pct=request.freight_change_pct,
            bunker_change_pct=request.bunker_change_pct,
        )
        return WhatIfForecastResponse(**result)


analysis_service = AnalysisService()
