# Freight Database Feature Store

This folder adds an optional PostgreSQL/TimescaleDB feature store for freight, port, vessel, fixture, AIS, weather, commodity, bunker, FFA, import, and ML feature data.

It is an additive integration. It does **not** replace the main application database:

- The existing `DATABASE_URL` still controls the core application SQLAlchemy database.
- The existing SQLite fallback at `data/freight_intelligence.db` remains unchanged.
- `FREIGHT_DATABASE_URL` controls this separate feature store.
- The backend status endpoint is `/freight-database/status` and `/api/freight-database/status`.

## What The Folder Contains

- `docker-compose.yml`: TimescaleDB service.
- `init.sql`: master tables, hypertables, feature table, and seed records.
- `pipelines/ingest/ingest_pipeline.py`: validates and loads vessel, port-constraint, fixture, commodity, and bunker CSV data.
- `pipelines/features/build_features.py`: creates lag, moving-average, volatility, and calendar features in `route_daily_features`.
- `create_views.py`: creates analytical views for latest freight, port constraints, and latest ML features.
- `data_quality_report.py`: audits database tables and writes `data_quality_report.json`.
- `data/raw/`: source CSV files used by ingestion.

## Activate The Database

Run from the repository root.

### 1. Start TimescaleDB

The feature-store compose file uses host port `5433` by default so it does not conflict with the existing project PostgreSQL service on `5432`.

```powershell
docker compose -f freight-database/docker-compose.yml up -d
```

The container is named `freight_timescaledb` and creates:

- Database: `freight_db`
- User: `postgres`
- Password: `postgrespassword`
- Host port: `5433`

To use another host port:

```powershell
$env:FREIGHT_DB_PORT = "55432"
docker compose -f freight-database/docker-compose.yml up -d
```

### 2. Activate the Python environment

```powershell
.venv\Scripts\Activate.ps1
```

Install the folder-specific dependencies once:

```powershell
pip install -r freight-database/requirements.txt
```

### 3. Set the feature-store connection string

For the default local container:

```powershell
$env:FREIGHT_DATABASE_URL = "postgresql://postgres:postgrespassword@127.0.0.1:5433/freight_db"
```

Do not put a cloud password or connection string directly in source files. Use a local `.env` file or environment variable that is excluded from version control.

### 4. Initialize the schema and seed data

```powershell
python freight-database/setup_db.py
```

The SQL creates relational master tables, TimescaleDB hypertables, the ML feature table, and initial ports/routes/constraints.

### 5. Load clean source data

```powershell
python freight-database/pipelines/ingest/ingest_pipeline.py
```

The pipeline reads the repository-relative files under `freight-database/data/raw/`, validates positive IMO/DWT/draft/cargo/freight/price values, normalizes port names to UN/LOCODE-style IDs, and inserts the records.

### 6. Build the gold feature table

```powershell
python freight-database/pipelines/features/build_features.py
```

This reads freight, coal, and bunker time series and computes:

- Freight lags: 1, 3, 7, 14, and 30 observations.
- 7-observation and 30-observation moving averages.
- 7-observation and 30-observation volatility.
- Calendar features: month, ISO week, and day of week.
- Coal and bunker price alignment.

### 7. Create analytical views

```powershell
python freight-database/create_views.py
```

Views created:

- `v_latest_freight_rates`
- `v_port_constraints_summary`
- `v_latest_features`

### 8. Run the database quality report

```powershell
python freight-database/data_quality_report.py
```

The report checks freight-rate completeness/positivity, vessel draft/DWT quality, port and constraint counts, and feature-store columns.

## Check Integration From The Backend

Start the existing FastAPI backend with its normal command:

```powershell
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

Set `FREIGHT_DATABASE_URL` before starting the backend. Then open:

```text
http://127.0.0.1:8000/api/freight-database/status
```

Expected connected response shape:

```json
{
  "configured": true,
  "connected": true,
  "database": "freight_db",
  "tables": ["ports", "routes", "route_daily_features"],
  "missing_tables": []
}
```

If `FREIGHT_DATABASE_URL` is absent, the endpoint returns `configured: false`. This is intentional and does not affect the core application database.

## Stop The Feature Store

```powershell
docker compose -f freight-database/docker-compose.yml down
```

To remove the feature-store volume and all TimescaleDB data:

```powershell
docker compose -f freight-database/docker-compose.yml down -v
```

Use `down -v` only when the feature-store data should be recreated from scratch.

## Troubleshooting

### Port 5433 is unavailable

Change the host port:

```powershell
$env:FREIGHT_DB_PORT = "55432"
docker compose -f freight-database/docker-compose.yml up -d
$env:FREIGHT_DATABASE_URL = "postgresql://postgres:postgrespassword@127.0.0.1:55432/freight_db"
```

### `timescaledb` extension errors

The feature-store image must be the TimescaleDB image defined in `freight-database/docker-compose.yml`. A normal PostgreSQL image is not sufficient for `create_hypertable`.

### Backend still reports SQLite

That is expected for the core database if only `DATABASE_URL` is configured or PostgreSQL on port `5432` is unavailable. Check the separate feature-store URL:

```powershell
$env:FREIGHT_DATABASE_URL
Invoke-WebRequest http://127.0.0.1:8000/api/freight-database/status
```

The core SQLite fallback and this TimescaleDB feature store are intentionally separate.
