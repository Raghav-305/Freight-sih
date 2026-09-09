import os
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine

DB_URL = os.environ.get("FREIGHT_DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Set FREIGHT_DATABASE_URL before running freight-database ingestion.")
ENGINE = create_engine(DB_URL)
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_ROOT = PROJECT_ROOT / "freight-database" / "data" / "raw"

# Canonical UN/LOCODE normalization mapping (Phase 7)
PORT_CANONICAL_MAP = {
    'Gladstone': 'AUGLA',
    'Gladstone Port': 'AUGLA',
    'Dhamra': 'INDAH',
    'Dhamra Port': 'INDAH',
    'Dhamra, India': 'INDAH',
    'Paradip': 'INPRT',
    'Paradip Port': 'INPRT',
    'Vizag': 'INVTZ',
    'Visakhapatnam': 'INVTZ'
}

# 1. Clean and Ingest Vessels (Phase 7 & 8)
def clean_vessels(file_path: str):
    if not os.path.exists(file_path):
        return
    df = pd.read_csv(file_path)
    
    # Phase 8 Data Quality Assertions
    assert (df['imo'] > 1000000).all(), "Quality Check Failed: Invalid IMO number detected"
    assert (df['dwt'] > 0).all(), "Quality Check Failed: DWT must be positive"
    assert (df['draft'] > 0).all(), "Quality Check Failed: Draft must be positive"
    
    df = df.drop_duplicates(subset=['imo'])
    df.to_sql('vessels', ENGINE, if_exists='append', index=False, method='multi')
    print(f"[Phase C] Ingested {len(df)} clean vessel records.")

# 2. Clean and Ingest Port Constraints (Phase 7 & 8)
def clean_port_constraints(file_path: str):
    if not os.path.exists(file_path):
        return
    df = pd.read_csv(file_path)
    
    # Normalize port names to UN/LOCODE
    df['port_id'] = df['port_name'].map(PORT_CANONICAL_MAP)
    df = df.dropna(subset=['port_id'])
    
    # Assertions
    assert (df['max_draft'] > 0).all(), "Quality Check Failed: max_draft must be > 0"
    assert (df['max_loa'] > 0).all(), "Quality Check Failed: max_loa must be > 0"
    
    clean_cols = ['port_id', 'max_draft', 'max_loa', 'max_beam', 'max_dwt', 'loading_rate', 'discharge_rate', 'source']
    df[clean_cols].to_sql('port_constraints', ENGINE, if_exists='append', index=False, method='multi')
    print(f"[Phase C] Ingested {len(df)} clean port constraint records.")

# 3. Clean and Ingest Fixtures (Phase 7 & 8)
def clean_fixtures(file_path: str):
    if not os.path.exists(file_path):
        return
    df = pd.read_csv(file_path)
    
    df['fixture_date'] = pd.to_datetime(df['fixture_date'])
    df['laycan_start'] = pd.to_datetime(df['laycan_start'])
    df['laycan_end'] = pd.to_datetime(df['laycan_end'])
    
    df['origin_port_id'] = df['origin_port'].map(PORT_CANONICAL_MAP)
    df['destination_port_id'] = df['destination_port'].map(PORT_CANONICAL_MAP)
    
    # Assertions
    assert (df['cargo_quantity'] > 0).all(), "Quality Check Failed: cargo_quantity must be > 0"
    assert (df['freight_rate'] > 0).all(), "Quality Check Failed: freight_rate must be > 0"
    
    clean_cols = [
        'fixture_id', 'fixture_date', 'vessel_imo', 'vessel_class', 
        'cargo_type', 'cargo_quantity', 'origin_port_id', 'destination_port_id',
        'laycan_start', 'laycan_end', 'freight_rate', 'currency', 'contract_type', 'source'
    ]
    df[clean_cols].to_sql('fixtures', ENGINE, if_exists='append', index=False, method='multi')
    print(f"[Phase C] Ingested {len(df)} clean fixture records.")

# 4. Clean and Ingest Commodity Prices (Phase 7 & 8)
def clean_commodities(file_path: str):
    if not os.path.exists(file_path):
        return
    df = pd.read_csv(file_path)
    df['time'] = pd.to_datetime(df['date'])
    
    assert (df['price'] > 0).all(), "Quality Check Failed: Commodity price must be > 0"
    
    clean_cols = ['time', 'commodity', 'price', 'currency', 'unit']
    df[clean_cols].to_sql('commodity_prices', ENGINE, if_exists='append', index=False, method='multi')
    print(f"[Phase C] Ingested {len(df)} commodity price rows.")

# 5. Clean and Ingest Bunker Fuel Prices (Phase 7 & 8)
def clean_bunkers(file_path: str):
    if not os.path.exists(file_path):
        return
    df = pd.read_csv(file_path)
    df['time'] = pd.to_datetime(df['date'])
    
    assert (df['price'] > 0).all(), "Quality Check Failed: Bunker price must be > 0"
    
    clean_cols = ['time', 'port_or_region', 'fuel_type', 'price', 'currency']
    df[clean_cols].to_sql('bunker_prices', ENGINE, if_exists='append', index=False, method='multi')
    print(f"[Phase C] Ingested {len(df)} bunker price rows.")

if __name__ == "__main__":
    print("Running Phase B/C Ingestion & Quality Engine...")
    clean_vessels(DATA_ROOT / "ports" / "vessels_raw.csv")
    clean_port_constraints(DATA_ROOT / "ports" / "port_constraints_raw.csv")
    clean_fixtures(DATA_ROOT / "baltic" / "fixtures_raw.csv")
    clean_commodities(DATA_ROOT / "commodities" / "commodity_prices_raw.csv")
    clean_bunkers(DATA_ROOT / "commodities" / "bunker_prices_raw.csv")
    print("Phase B & C pipeline completed successfully!")