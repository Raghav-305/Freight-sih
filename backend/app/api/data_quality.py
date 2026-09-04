from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any
from fastapi import APIRouter
import pandas as pd

router = APIRouter(tags=["data-quality"])

TARGET_DATASETS = [
    {"name": "Processed Model Features", "path": "data/processed/model_data.csv", "type": "model_features"},
    {"name": "Port Master & Constraints", "path": "data/raw/ports/new_port_constraints.csv", "type": "reference"},
    {"name": "Vessel Fleet Master", "path": "data/raw/ports/new_vessels.csv", "type": "reference"},
    {"name": "Port Congestion Lookup", "path": "data/raw/congestion/monthly_lookup.csv", "type": "operational"},
    {"name": "Market Intelligence Features", "path": "data/features/market_intelligence/market_intelligence_latest.csv", "type": "intelligence"},
    {"name": "Vessel AIS Intelligence", "data_alt": "data/raw/vessel_intelligence/vessel_intelligence_daily.csv", "path": "data/raw/vessel_intelligence/vessel_intelligence_daily.csv", "type": "telemetry"},
    {"name": "Geopolitical & Weather Risk", "path": "ml/artifacts/risk_model/events_lookup.csv", "type": "risk"},
]


@router.get("/data-quality")
@router.get("/api/data-quality")
def get_data_quality_report() -> dict[str, Any]:
    """Inspect all core data pipelines and calculate data health, completeness, and freshness metrics."""
    reports = []
    total_records = 0
    overall_healthy = True

    for item in TARGET_DATASETS:
        file_path = Path(item["path"])
        if not file_path.exists() and "data_alt" in item:
            alt = Path(item["data_alt"])
            if alt.exists():
                file_path = alt

        if not file_path.exists():
            reports.append({
                "dataset": item["name"],
                "path": str(file_path),
                "type": item["type"],
                "status": "MISSING",
                "rows": 0,
                "columns": 0,
                "missing_pct": 100.0,
                "duplicate_pct": 0.0,
                "last_updated": "N/A",
                "note": "File not found in local workspace",
            })
            overall_healthy = False
            continue

        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(file_path)).strftime("%Y-%m-%d %H:%M:%S")
            # Sample read for fast response
            df = pd.read_csv(file_path, nrows=5000)
            row_count = len(df)
            total_records += row_count
            col_count = len(df.columns)

            null_cells = int(df.isna().sum().sum())
            total_cells = max(1, row_count * col_count)
            missing_pct = round((null_cells / total_cells) * 100.0, 2)

            dup_count = int(df.duplicated().sum())
            dup_pct = round((dup_count / max(1, row_count)) * 100.0, 2)

            status = "HEALTHY"
            if missing_pct > 15.0 or dup_pct > 5.0:
                status = "WARNING"
                overall_healthy = False

            reports.append({
                "dataset": item["name"],
                "path": str(file_path),
                "type": item["type"],
                "status": status,
                "rows": row_count,
                "columns": col_count,
                "missing_pct": missing_pct,
                "duplicate_pct": dup_pct,
                "last_updated": mtime,
                "note": f"Validated {col_count} columns across sample records",
            })
        except Exception as exc:
            reports.append({
                "dataset": item["name"],
                "path": str(file_path),
                "type": item["type"],
                "status": "ERROR",
                "rows": 0,
                "columns": 0,
                "missing_pct": 0.0,
                "duplicate_pct": 0.0,
                "last_updated": "N/A",
                "note": f"Read error: {exc}",
            })
            overall_healthy = False

    return {
        "overall_status": "HEALTHY" if overall_healthy else "WARNING",
        "total_datasets_monitored": len(reports),
        "healthy_count": sum(1 for r in reports if r["status"] == "HEALTHY"),
        "total_sampled_rows": total_records,
        "evaluated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "datasets": reports,
        "governance_note": "Data quality monitoring adheres to ISO 8000 and Indian GFR transparency guidelines for algorithmic decision support.",
    }
