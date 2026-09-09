from fastapi import APIRouter

from backend.app.database.freight_store import freight_database_status

router = APIRouter(tags=["freight-database"])


@router.get("/freight-database/status")
@router.get("/api/freight-database/status")
def status() -> dict:
    return freight_database_status()
