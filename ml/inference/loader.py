import json
import os
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def load_model_registry() -> dict:
    registry_path = Path(os.getenv("MODEL_REGISTRY_PATH", "./ml/registry/model_registry.json"))
    if not registry_path.exists():
        return {"models": [], "warning": f"Model registry not found: {registry_path}"}

    with registry_path.open("r", encoding="utf-8") as registry_file:
        return json.load(registry_file)


def resolve_model_path(relative_path: str) -> Path:
    model_root_path = Path(os.getenv("MODEL_ROOT_PATH", "./ml/models"))
    model_path = model_root_path / relative_path
    return model_path.resolve()
