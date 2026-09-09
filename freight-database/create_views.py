import os

import psycopg2

DB_URL = os.environ.get("FREIGHT_DATABASE_URL")

def create_database_views():
    if not DB_URL:
        raise RuntimeError("Set FREIGHT_DATABASE_URL before creating freight-database views.")
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    views_sql = """
    -- 1. View: Latest Freight Rates per Route
    CREATE OR REPLACE VIEW v_latest_freight_rates AS
    SELECT DISTINCT ON (route_id, vessel_class)
        time,
        route_id,
        vessel_class,
        cargo_type,
        freight_usd_mt,
        tce_usd_day,
        source
    FROM freight_rates
    ORDER BY route_id, vessel_class, time DESC;

    -- 2. View: Port Master with Active Constraints
    CREATE OR REPLACE VIEW v_port_constraints_summary AS
    SELECT 
        p.port_id,
        p.name AS port_name,
        p.country,
        p.latitude,
        p.longitude,
        c.max_draft,
        c.max_loa,
        c.max_beam,
        c.max_dwt,
        c.loading_rate,
        c.discharge_rate
    FROM ports p
    LEFT JOIN port_constraints c ON p.port_id = c.port_id;

    -- 3. View: Latest ML Gold Dataset Summary
    CREATE OR REPLACE VIEW v_latest_features AS
    SELECT DISTINCT ON (route_id, vessel_class)
        time,
        route_id,
        vessel_class,
        freight_today,
        freight_lag_1,
        freight_ma_7,
        freight_volatility_7,
        coal_price,
        bunker_price
    FROM route_daily_features
    ORDER BY route_id, vessel_class, time DESC;
    """
    
    cursor.execute(views_sql)
    conn.commit()
    cursor.close()
    conn.close()
    print("[Phase E] Analytical SQL Views created successfully!")

if __name__ == "__main__":
    create_database_views()