from fastapi import APIRouter

from ml.inference.loader import load_model_registry

router = APIRouter(tags=["models"])


@router.get("/models")
def list_models() -> dict:
    return load_model_registry()
