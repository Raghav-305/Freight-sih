from fastapi import APIRouter

from ml.evaluation.model_performance import compute_model_performance
from ml.inference.loader import load_model_registry

router = APIRouter(tags=["models"])


@router.get("/models")
@router.get("/api/models")
def list_models() -> dict:
    return load_model_registry()


@router.get("/models/performance")
@router.get("/api/models/performance")
def list_model_performance() -> dict:
    return compute_model_performance()
