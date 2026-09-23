"""
API endpoints for BIMCO Standard Charterparty Contract Studio.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas.charterparty import (
    CharterpartyGenerateRequest,
    CharterpartyGenerateResponse,
    ContractTemplatesResponse,
    ContractValidateRequest,
    ContractValidationResponse,
)
from backend.app.services.charterparty_service import charterparty_service

router = APIRouter(tags=["charterparty-contracts"])


@router.get("/charterparty/templates", response_model=ContractTemplatesResponse)
@router.get("/api/charterparty/templates", response_model=ContractTemplatesResponse)
def get_templates_endpoint() -> ContractTemplatesResponse:
    """List available standard BIMCO charterparty templates (GENCON 1994, NYPE 2015)."""
    return charterparty_service.list_templates()


@router.post("/charterparty/generate", response_model=CharterpartyGenerateResponse)
@router.post("/api/charterparty/generate", response_model=CharterpartyGenerateResponse)
def generate_contract_endpoint(request: CharterpartyGenerateRequest) -> CharterpartyGenerateResponse:
    """Generate a fully compiled, legally structured BIMCO charterparty agreement with custom rider clauses."""
    try:
        return charterparty_service.generate_contract(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/charterparty/validate", response_model=ContractValidationResponse)
@router.post("/api/charterparty/validate", response_model=ContractValidationResponse)
def validate_contract_endpoint(request: ContractValidateRequest) -> ContractValidationResponse:
    """Audit a charterparty contract configuration for compliance with CVC, GFR Rule 144, and arbitration standards."""
    try:
        return charterparty_service.validate_contract(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
