from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.collusion import (
    BidScoreRequest,
    BidScoreResponse,
    TenderScoreRequest,
    TenderScoreResponse,
    BidExplainRequest,
    BidExplainResponse,
    TenderListResponse,
    CollusionPerformanceResponse,
    CustomBidSimRequest,
    CustomBidSimResponse,
)
from backend.app.services.collusion_service import collusion_service
from ml.inference import bid_anomaly_detection as detector

router = APIRouter(tags=["collusion-detection"])


@router.get("/collusion/tenders", response_model=TenderListResponse)
@router.get("/api/collusion/tenders", response_model=TenderListResponse)
def list_tenders_endpoint(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None, description="Filter by 'FLAGGED' or 'NORMAL'"),
) -> TenderListResponse:
    """List tenders with summary bid counts, fair value, spread, and anomaly status."""
    return collusion_service.list_tenders(limit=limit, status_filter=status)


@router.get("/collusion/tenders/{tender_id}", response_model=TenderScoreResponse)
@router.get("/api/collusion/tenders/{tender_id}", response_model=TenderScoreResponse)
def get_tender_endpoint(
    tender_id: str,
    threshold: float = Query(0.5, ge=0.0, le=1.0),
) -> TenderScoreResponse:
    """Retrieve full tender details with all broker bids, fair value comparisons, and anomaly probabilities."""
    try:
        return collusion_service.get_tender(tender_id, threshold=threshold)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/collusion/score-bid", response_model=BidScoreResponse)
@router.post("/api/collusion/score-bid", response_model=BidScoreResponse)
def score_bid_endpoint(request: BidScoreRequest) -> BidScoreResponse:
    """Score an individual bid for anomalous/collusive behavior using the XGBoost model."""
    try:
        res = detector.score_bid(request.bid, threshold=request.threshold)
        return BidScoreResponse(**res)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/collusion/score-tender", response_model=TenderScoreResponse)
@router.post("/api/collusion/score-tender", response_model=TenderScoreResponse)
def score_tender_endpoint(request: TenderScoreRequest) -> TenderScoreResponse:
    """Score all bids in a tender, detecting bid rigging, cover bidding, and logging CVC audit trail."""
    try:
        return collusion_service.score_tender(
            tender_id=request.tender_id,
            custom_bids=request.bids,
            threshold=request.threshold,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/collusion/explain-bid", response_model=BidExplainResponse)
@router.post("/api/collusion/explain-bid", response_model=BidExplainResponse)
def explain_bid_endpoint(request: BidExplainRequest) -> BidExplainResponse:
    """Generate SHAP TreeExplainer feature attributions explaining why a bid was flagged."""
    try:
        return collusion_service.explain_bid(
            tender_id=request.tender_id,
            broker_id=request.broker_id,
            top_n=request.top_n,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/collusion/simulate", response_model=CustomBidSimResponse)
@router.post("/api/collusion/simulate", response_model=CustomBidSimResponse)
def simulate_bid_endpoint(request: CustomBidSimRequest) -> CustomBidSimResponse:
    """Run an interactive what-if simulation on a custom tender quote to inspect real-time anomaly probability."""
    try:
        return collusion_service.simulate_bid(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/collusion/performance", response_model=CollusionPerformanceResponse)
@router.get("/api/collusion/performance", response_model=CollusionPerformanceResponse)
def get_performance_endpoint() -> CollusionPerformanceResponse:
    """Retrieve model performance metrics, confusion matrix results, and naive baseline comparison."""
    return collusion_service.get_performance()
