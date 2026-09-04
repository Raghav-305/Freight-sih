"""SQLAlchemy ORM models for persistence, audit logging, and offline operation."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class ModelVersionRecord(Base):
    """Catalog of registered machine learning models."""
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_version = Column(String(128), unique=True, nullable=False, index=True)
    model_type = Column(String(64), nullable=False)
    family = Column(String(64), nullable=True)
    dataset_version = Column(String(128), nullable=True)
    feature_version = Column(String(128), nullable=True)
    training_date = Column(String(32), nullable=True)
    status = Column(String(32), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionRecord(Base):
    """Audit log of user prediction requests and model responses."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requested_at = Column(DateTime, default=datetime.utcnow, index=True)
    origin = Column(String(128), nullable=False)
    destination = Column(String(128), nullable=False)
    vessel_type = Column(String(64), nullable=False)
    cargo_type = Column(String(64), default="Coal")
    cargo_quantity = Column(Float, nullable=False)
    model_version = Column(String(128), nullable=True)
    response_json = Column(JSON, nullable=False)


class RecommendationRecord(Base):
    """Chartering and contract optimization recommendations."""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    recommendation_type = Column(String(64), nullable=False)  # charter, vessel, what_if
    inputs_json = Column(JSON, nullable=False)
    outputs_json = Column(JSON, nullable=False)
    reviewer_status = Column(String(32), default="PENDING_REVIEW")  # PENDING_REVIEW, APPROVED, REJECTED
    reviewer_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_name = Column(String(128), nullable=True)


class AuditLogRecord(Base):
    """CVC / GFR compliance audit trail for official tender actions."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    action = Column(String(64), nullable=False)  # FORECAST_RUN, CONTRACT_OPTIMIZED, CHARTER_APPROVED
    user_id = Column(String(64), default="procurement_officer_01")
    entity_id = Column(String(128), nullable=True)
    details = Column(JSON, nullable=True)


class PortReference(Base):
    """Reference port physical limitations."""
    __tablename__ = "reference_ports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False)
    port_code = Column(String(16), nullable=False)
    max_draft_m = Column(Float, nullable=False)
    max_loa_m = Column(Float, nullable=False)
    max_beam_m = Column(Float, nullable=False)
    max_dwt_mt = Column(Float, nullable=False)
    berth_count = Column(Integer, default=4)
    discharge_rate_mt_hr = Column(Float, default=3000.0)
    has_tidal_restriction = Column(Boolean, default=False)
