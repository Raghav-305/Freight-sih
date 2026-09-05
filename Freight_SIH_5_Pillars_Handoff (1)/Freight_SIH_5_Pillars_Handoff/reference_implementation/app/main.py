"""
Freight-SIH reference backend -- entrypoint.

Run:  uvicorn app.main:app --reload
Docs: http://localhost:8000/docs

This wires exactly the five pillars in README.md / MANIFEST.txt. Nothing
here should be extended with a sixth, unrelated feature area -- see
10_FINAL_QA/QUALITY_GATE.md.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import command_center, decisions, eligibility, map as map_router, scenarios

app = FastAPI(
    title="Freight-SIH Decision Support Command Center",
    description=(
        "Decision-support system only. Final chartering or procurement action requires "
        "review and approval by an authorized officer under the applicable delegation "
        "and procurement framework."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenarios.router)
app.include_router(map_router.router)
app.include_router(eligibility.router)
app.include_router(decisions.router)
app.include_router(command_center.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "OK"}
