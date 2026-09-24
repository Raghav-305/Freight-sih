"""
Unit and Integration Tests for Real-Time Satellite AIS Ingestion & Kalman Trajectory Filter.
Verifies constant-velocity 4D Kalman filtering, kinematic spoofing detection, REST and WebSocket endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.ais_tracker import VesselKalmanTracker, haversine_km, ais_service

client = TestClient(app)


def test_haversine_km_calculation():
    """Verify Great Circle distance calculation between known coordinates."""
    # Distance between Dhamra (20.78, 86.92) and Paradip (20.32, 86.62) is ~60-65 km
    dist = haversine_km(20.7833, 86.9167, 20.3167, 86.6167)
    assert 55.0 <= dist <= 70.0, f"Expected ~60 km between Dhamra and Paradip, got {dist}"


def test_kalman_filter_state_update_and_noise_reduction():
    """Verify that Kalman filter smooths noisy GPS points and updates 4D state vector."""
    tracker = VesselKalmanTracker(
        mmsi=419001234,
        init_lat=16.50,
        init_lon=85.20,
        sog_knots=13.8,
        cog_deg=340.0
    )
    assert len(tracker.state) == 4
    assert tracker.state[0] == 16.50
    assert tracker.state[1] == 85.20

    # Simulate 5 consecutive 1-second pings with GPS jitter
    for step in range(1, 6):
        raw_lat = 16.50 + step * 0.0005 + 0.0001
        raw_lon = 85.20 - step * 0.0002 - 0.0001
        filt_lat, filt_lon, alerts = tracker.predict_and_update(raw_lat, raw_lon, 13.8, 340.0)
        assert len(alerts) == 0, "Normal continuous track must not trigger spoofing alerts"
        # Filtered coordinate must remain close to ground truth
        assert abs(filt_lat - raw_lat) < 0.01
        assert abs(filt_lon - raw_lon) < 0.01


def test_kalman_filter_flags_impossible_spoofing_jump():
    """Verify that an instantaneous teleportation jump (> 45 knots over > 10 km) triggers SPOOFING alert."""
    tracker = VesselKalmanTracker(
        mmsi=353130000,
        init_lat=14.80,
        init_lon=84.40,
        sog_knots=11.2,
        cog_deg=325.0
    )
    # Sudden impossible jump: 0.85 degrees latitude (~95 km in 1 second)
    teleport_lat = 14.80 + 0.85
    teleport_lon = 84.40 + 0.30

    filt_lat, filt_lon, alerts = tracker.predict_and_update(teleport_lat, teleport_lon, 11.2, 325.0)
    assert len(alerts) > 0, "Impossible speed jump MUST trigger spoofing alert"
    assert "SPOOFING_IMPOSSIBLE_SPEED_JUMP" in alerts


def test_ais_status_endpoint():
    """Verify GET /api/ais/status returns telemetry health and Kalman parameters."""
    res = client.get("/api/ais/status")
    assert res.status_code == 200, res.text
    data = res.json()

    assert "mode" in data
    assert "active_vessels_count" in data
    assert data["active_vessels_count"] >= 5
    assert data["kalman_state_dim"] == 4
    assert "Constant-Velocity" in data["kalman_filter_type"]
    assert len(data["monitored_corridors"]) >= 4


def test_ais_live_vessels_endpoint():
    """Verify GET /api/ais/live-vessels returns active vessels with filtered coordinates."""
    res = client.get("/api/ais/live-vessels")
    assert res.status_code == 200, res.text
    data = res.json()

    assert "count" in data
    assert "vessels" in data
    assert data["count"] >= 5

    vessels = data["vessels"]
    for v in vessels:
        assert "mmsi" in v
        assert "name" in v
        assert "filtered_lat" in v
        assert "filtered_lon" in v
        assert "sog" in v
        assert "cog" in v
        assert isinstance(v["alerts"], list)


def test_ais_simulate_spoof_and_reset_endpoints():
    """Verify POST /api/ais/simulate-spoof injects a jump and POST /api/ais/reset restores fleet."""
    res_spoof = client.post("/api/ais/simulate-spoof", json={"mmsi": 353130000})
    assert res_spoof.status_code == 200, res_spoof.text
    spoof_data = res_spoof.json()
    assert spoof_data["status"] == "SPOOF_INJECTED"
    assert spoof_data["mmsi"] == 353130000

    # Reset
    res_reset = client.post("/api/ais/reset")
    assert res_reset.status_code == 200, res_reset.text
    assert res_reset.json()["status"] == "RESET_SUCCESSFUL"


def test_websocket_ais_endpoint():
    """Verify that clients can establish a WebSocket connection to /ws/ais."""
    with client.websocket_connect("/ws/ais") as websocket:
        # Send keep-alive text
        websocket.send_text("ping")
        # Connection succeeds without error
