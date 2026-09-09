import os

import pandas as pd
from sqlalchemy import create_engine
import json

DB_URL = os.environ.get("FREIGHT_DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Set FREIGHT_DATABASE_URL before running the freight-database quality audit.")
ENGINE = create_engine(DB_URL)

def run_quality_audit():
    print("Running Phase 8 Data Quality Engine...")
    
    report = {}
    
    # 1. Audit Freight Rates
    df_freight = pd.read_sql("SELECT * FROM freight_rates;", ENGINE)
    report['freight_rates'] = {
        'total_rows': len(df_freight),
        'missing_rates_pct': round(df_freight['freight_usd_mt'].isnull().mean() * 100, 2),
        'invalid_negative_rates': int((df_freight['freight_usd_mt'] <= 0).sum()),
        'unique_routes': int(df_freight['route_id'].nunique())
    }
    
    # 2. Audit Vessels
    df_vessels = pd.read_sql("SELECT * FROM vessels;", ENGINE)
    report['vessels'] = {
        'total_vessels': len(df_vessels),
        'missing_draft_pct': round(df_vessels['draft'].isnull().mean() * 100, 2),
        'invalid_dwt_count': int((df_vessels['dwt'] <= 0).sum())
    }
    
    # 3. Audit Ports & Constraints
    df_ports = pd.read_sql("SELECT * FROM ports;", ENGINE)
    df_constraints = pd.read_sql("SELECT * FROM port_constraints;", ENGINE)
    report['ports'] = {
        'total_ports': len(df_ports),
        'total_constraints_configured': len(df_constraints)
    }
    
    # 4. Audit Gold Feature Store
    df_features = pd.read_sql("SELECT * FROM route_daily_features;", ENGINE)
    report['gold_feature_store'] = {
        'total_feature_rows': len(df_features),
        'features_version': 'feature_set_v1',
        'available_columns': list(df_features.columns)
    }
    
    # Print summary output formatted per Phase 8 specification
    print("\n" + "="*45)
    print("       DATASET QUALITY REPORT")
    print("="*45)
    print(f"Freight Rates : Rows: {report['freight_rates']['total_rows']} | Missing: {report['freight_rates']['missing_rates_pct']}% | Invalid: {report['freight_rates']['invalid_negative_rates']}")
    print(f"Vessels       : Rows: {report['vessels']['total_vessels']} | Missing Draft: {report['vessels']['missing_draft_pct']}%")
    print(f"Ports         : Rows: {report['ports']['total_ports']} | Constraints: {report['ports']['total_constraints_configured']}")
    print(f"Feature Store : Rows: {report['gold_feature_store']['total_feature_rows']} (Version: {report['gold_feature_store']['features_version']})")
    print("="*45)
    
    with open("data_quality_report.json", "w") as f:
        json.dump(report, f, indent=4)
    print("Quality report exported to 'data_quality_report.json'.\n")

if __name__ == "__main__":
    run_quality_audit()