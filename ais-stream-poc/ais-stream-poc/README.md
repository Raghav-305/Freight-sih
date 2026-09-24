# Real-Time Live AIS Satellite Ingestion & Trajectory Filter PoC

This standalone module demonstrates a production-grade ingestion worker for live satellite AIS feeds, coupled with constant-velocity Kalman filtering and anomaly/spoofing detection.

## Architecture Highlights
- **Persistent Ingestion (`tracker/ingestion.py`):** Async WebSocket worker reading `PositionReport` packets from AIS aggregators (AISStream.io) without blocking API threads.
- **Dead Reckoning & Kalman Filter (`tracker/kalman_filter.py`):** Calculates 4D state vectors `[lat, lon, v_lat, v_lon]` to eliminate sensor drift, bridge coverage blindspots, and identify spoofing/teleportation jumps.
- **Broadcasting Subsystem (`main.py`):** FastAPI WebSocket hub using async task queues to feed client map instances.
- **Demo Dashboard (`demo_ui/index.html`):** Interactive map showing real-time positioning and visual indicators for flagged anomalies.

## Quick Start
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) Set your API key in `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: If no key is set, the worker automatically runs in realistic synthetic mode with 3 ships and an automatic spoofing test.*
4. Start the application:
   ```bash
   python main.py
   ```
5. Open `http://127.0.0.1:8000` in your browser.

## Integration Plan for Main Platform
1. Move `tracker/kalman_filter.py` into `backend/app/services/`.
2. Move `tracker/ingestion.py` into `backend/app/services/` and register the `run_ais_ingestion` task inside `backend/app/main.py`'s `lifespan` handler.
3. Hook `vesselData` updates in your frontend map engine (Leaflet/Mapbox) to the `/ws/ais` endpoint.