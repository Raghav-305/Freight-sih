from __future__ import annotations

import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from backend.app.config.settings import settings
from backend.app.database.models import Base

logger = logging.getLogger("freight.database")


def _init_engine():
    db_url = settings.database_url
    
    # If postgresql is specified, attempt connection with a quick 1-second timeout
    if "postgresql" in db_url:
        try:
            test_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 1},
                pool_pre_ping=False
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected successfully to primary PostgreSQL database.")
            return test_engine
        except Exception as exc:
            logger.info("PostgreSQL not accessible (%s). Falling back to offline SQLite.", exc)

    # Local SQLite for seamless zero-config offline execution
    data_dir = Path("./data").resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    sqlite_path = data_dir / "freight_intelligence.db"
    sqlite_url = f"sqlite:///{sqlite_path}"
    logger.info("Using local offline SQLite database: %s", sqlite_url)
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})


engine = _init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Auto-provision tables on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error("Failed to auto-create database tables: %s", e)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
