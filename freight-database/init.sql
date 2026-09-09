CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ==========================================================
-- 1. RELATIONAL / MASTER TABLES
-- ==========================================================

-- Ports master (UN/LOCODE primary key)
CREATE TABLE IF NOT EXISTS ports (
    port_id VARCHAR(10) PRIMARY KEY, -- Canonical UN/LOCODE (e.g. INDAH, AUGLA)
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL
);

-- Route master
CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(50) PRIMARY KEY, -- e.g. AUGLA_INDAH_PANAMAX_COAL
    origin_port_id VARCHAR(10) REFERENCES ports(port_id),
    destination_port_id VARCHAR(10) REFERENCES ports(port_id),
    cargo_type VARCHAR(50) NOT NULL,
    vessel_class VARCHAR(50) NOT NULL,
    distance_nm NUMERIC(10, 2) NOT NULL
);

-- Port physical & operational constraints
CREATE TABLE IF NOT EXISTS port_constraints (
    constraint_id SERIAL PRIMARY KEY,
    port_id VARCHAR(10) REFERENCES ports(port_id),
    max_draft NUMERIC(5, 2) NOT NULL,
    max_loa NUMERIC(6, 2) NOT NULL,
    max_beam NUMERIC(5, 2) NOT NULL,
    max_dwt NUMERIC(10, 2) NOT NULL,
    berth_length NUMERIC(6, 2),
    berth_count INT,
    loading_rate NUMERIC(10, 2),
    discharge_rate NUMERIC(10, 2),
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    source VARCHAR(100),
    confidence VARCHAR(20)
);

-- Vessel particulars master (IMO primary key)
CREATE TABLE IF NOT EXISTS vessels (
    imo INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vessel_type VARCHAR(50) NOT NULL, -- Panamax, Supramax, Capesize, Handysize
    dwt NUMERIC(10, 2) NOT NULL,
    gt NUMERIC(10, 2),
    nt NUMERIC(10, 2),
    loa NUMERIC(6, 2) NOT NULL,
    beam NUMERIC(5, 2) NOT NULL,
    draft NUMERIC(5, 2) NOT NULL,
    year_built INT,
    speed_laden NUMERIC(4, 2),
    speed_ballast NUMERIC(4, 2),
    fuel_consumption_laden NUMERIC(6, 2),
    fuel_consumption_ballast NUMERIC(6, 2),
    crane_count INT DEFAULT 0,
    crane_capacity NUMERIC(6, 2) DEFAULT 0,
    flag VARCHAR(50),
    owner VARCHAR(100),
    manager VARCHAR(100)
);

-- Internal fixture history
CREATE TABLE IF NOT EXISTS fixtures (
    fixture_id VARCHAR(50) PRIMARY KEY,
    fixture_date DATE NOT NULL,
    vessel_imo INT REFERENCES vessels(imo),
    vessel_class VARCHAR(50),
    cargo_type VARCHAR(50) NOT NULL,
    cargo_quantity NUMERIC(12, 2) NOT NULL,
    origin_port_id VARCHAR(10) REFERENCES ports(port_id),
    destination_port_id VARCHAR(10) REFERENCES ports(port_id),
    laycan_start DATE NOT NULL,
    laycan_end DATE NOT NULL,
    freight_rate NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    contract_type VARCHAR(50) NOT NULL,
    source VARCHAR(100)
);

-- ==========================================================
-- 2. TIMESCALEDB HYPERTABLES (Time-Series)
-- ==========================================================

CREATE TABLE IF NOT EXISTS freight_rates (
    time TIMESTAMPTZ NOT NULL,
    route_id VARCHAR(50) REFERENCES routes(route_id),
    vessel_class VARCHAR(50) NOT NULL,
    cargo_type VARCHAR(50) NOT NULL,
    freight_usd_mt NUMERIC(10, 2) NOT NULL,
    tce_usd_day NUMERIC(10, 2),
    source VARCHAR(100)
);
SELECT create_hypertable('freight_rates', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS port_calls (
    time TIMESTAMPTZ NOT NULL,
    imo INT REFERENCES vessels(imo),
    port_id VARCHAR(10) REFERENCES ports(port_id),
    arrival_time TIMESTAMPTZ,
    berth_time TIMESTAMPTZ,
    departure_time TIMESTAMPTZ,
    waiting_hours NUMERIC(6, 2),
    port_stay_hours NUMERIC(6, 2)
);
SELECT create_hypertable('port_calls', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ais_positions (
    time TIMESTAMPTZ NOT NULL,
    imo INT REFERENCES vessels(imo),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    speed NUMERIC(4, 1),
    heading NUMERIC(5, 1),
    destination VARCHAR(100),
    draft NUMERIC(5, 2)
);
SELECT create_hypertable('ais_positions', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS commodity_prices (
    time TIMESTAMPTZ NOT NULL,
    commodity VARCHAR(50) NOT NULL,
    price NUMERIC(12, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    unit VARCHAR(20) DEFAULT 'MT'
);
SELECT create_hypertable('commodity_prices', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS bunker_prices (
    time TIMESTAMPTZ NOT NULL,
    port_or_region VARCHAR(100) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD'
);
SELECT create_hypertable('bunker_prices', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ffa_prices (
    time TIMESTAMPTZ NOT NULL,
    route VARCHAR(100) NOT NULL,
    vessel_class VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);
SELECT create_hypertable('ffa_prices', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS coal_imports (
    time TIMESTAMPTZ NOT NULL,
    origin_country VARCHAR(50) NOT NULL,
    destination_country VARCHAR(50) NOT NULL,
    quantity_mt NUMERIC(14, 2) NOT NULL,
    value_usd NUMERIC(16, 2)
);
SELECT create_hypertable('coal_imports', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS weather (
    time TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    wind_speed NUMERIC(5, 2),
    wave_height NUMERIC(5, 2),
    wave_period NUMERIC(5, 2),
    precipitation NUMERIC(5, 2),
    pressure NUMERIC(6, 1),
    storm_flag BOOLEAN DEFAULT FALSE,
    cyclone_flag BOOLEAN DEFAULT FALSE
);
SELECT create_hypertable('weather', 'time', if_not_exists => TRUE);

-- ==========================================================
-- 3. GOLD ML FEATURE STORE TABLE
-- ==========================================================

CREATE TABLE IF NOT EXISTS route_daily_features (
    time TIMESTAMPTZ NOT NULL,
    route_id VARCHAR(50) REFERENCES routes(route_id),
    vessel_class VARCHAR(50) NOT NULL,
    freight_today NUMERIC(10, 2),
    freight_lag_1 NUMERIC(10, 2),
    freight_lag_3 NUMERIC(10, 2),
    freight_lag_7 NUMERIC(10, 2),
    freight_lag_14 NUMERIC(10, 2),
    freight_lag_30 NUMERIC(10, 2),
    freight_ma_7 NUMERIC(10, 2),
    freight_ma_30 NUMERIC(10, 2),
    freight_volatility_7 NUMERIC(10, 4),
    freight_volatility_30 NUMERIC(10, 4),
    bdi NUMERIC(8, 2),
    bpi NUMERIC(8, 2),
    bsi NUMERIC(8, 2),
    coal_price NUMERIC(10, 2),
    bunker_price NUMERIC(10, 2),
    ffa_1m NUMERIC(10, 2),
    ffa_3m NUMERIC(10, 2),
    ffa_6m NUMERIC(10, 2),
    fleet_utilization NUMERIC(5, 2),
    fleet_idle NUMERIC(5, 2),
    port_congestion_origin NUMERIC(6, 2),
    port_congestion_destination NUMERIC(6, 2),
    weather_origin NUMERIC(6, 2),
    weather_destination NUMERIC(6, 2),
    cargo_demand NUMERIC(12, 2),
    ton_miles NUMERIC(14, 2),
    usd_inr NUMERIC(8, 4),
    month INT,
    week INT,
    day_of_week INT,
    PRIMARY KEY (time, route_id, vessel_class)
);
SELECT create_hypertable('route_daily_features', 'time', if_not_exists => TRUE);

-- ==========================================================
-- 4. MVP INITIAL SEED DATA
-- ==========================================================

INSERT INTO ports (port_id, name, country, latitude, longitude) VALUES
('AUGLA', 'Gladstone', 'Australia', -23.8485, 151.2684),
('INDAH', 'Dhamra', 'India', 20.8037, 86.9744),
('INPRT', 'Paradip', 'India', 20.2644, 86.6713),
('INVTZ', 'Vizag', 'India', 17.6868, 83.2185)
ON CONFLICT (port_id) DO NOTHING;

INSERT INTO routes (route_id, origin_port_id, destination_port_id, cargo_type, vessel_class, distance_nm) VALUES
('AUGLA_INDAH_PANAMAX_COAL', 'AUGLA', 'INDAH', 'Thermal Coal', 'Panamax', 5300.00),
('AUGLA_INPRT_PANAMAX_COAL', 'AUGLA', 'INPRT', 'Thermal Coal', 'Panamax', 5320.00)
ON CONFLICT (route_id) DO NOTHING;

INSERT INTO port_constraints (port_id, max_draft, max_loa, max_beam, max_dwt, loading_rate, discharge_rate, source) VALUES
('INDAH', 18.0, 300.0, 48.0, 180000, NULL, 35000, 'Port Marine Guide'),
('AUGLA', 17.5, 290.0, 45.0, 150000, 40000, NULL, 'Port Authority Data')
ON CONFLICT DO NOTHING;