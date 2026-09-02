from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.forecast import router as forecast_router
from backend.app.api.health import router as health_router
from backend.app.api.market import router as market_router
from backend.app.api.models import router as models_router
from backend.app.api.ports import router as ports_router

app = FastAPI(
    title="Freight Chartering Intelligence API",
    version="0.1.0",
    description="Local FastAPI boundary for forecasting, optimization, risk and model metadata.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(forecast_router)
app.include_router(market_router)
app.include_router(models_router)
app.include_router(ports_router)
