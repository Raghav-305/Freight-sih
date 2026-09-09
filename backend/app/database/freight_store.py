from __future__ import annotations

from sqlalchemy import create_engine, inspect, text

from backend.app.config.settings import settings


FEATURE_TABLES = (
    "ports",
    "routes",
    "port_constraints",
    "vessels",
    "fixtures",
    "freight_rates",
    "port_calls",
    "ais_positions",
    "commodity_prices",
    "bunker_prices",
    "ffa_prices",
    "coal_imports",
    "weather",
    "route_daily_features",
)


def freight_database_status() -> dict:
    """Return a non-mutating status check for the optional TimescaleDB feature store."""
    if not settings.freight_database_url:
        return {
            "configured": False,
            "connected": False,
            "database": "freight_db",
            "message": "FREIGHT_DATABASE_URL is not configured; the core application database is unchanged.",
        }

    engine = create_engine(settings.freight_database_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            tables = set(inspect(connection).get_table_names())
        return {
            "configured": True,
            "connected": True,
            "database": engine.url.database,
            "tables": sorted(tables.intersection(FEATURE_TABLES)),
            "missing_tables": sorted(set(FEATURE_TABLES).difference(tables)),
        }
    except Exception as exc:
        return {
            "configured": True,
            "connected": False,
            "database": engine.url.database,
            "error": str(exc),
        }
    finally:
        engine.dispose()
