import math
import time
import numpy as np

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance between two points in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.asin(math.sqrt(a))

class VesselKalmanTracker:
    def __init__(self, mmsi: int, init_lat: float, init_lon: float, sog_knots: float, cog_deg: float):
        self.mmsi = mmsi
        self.last_update_ts = time.time()
        
        # State: [lat, lon, v_lat, v_lon] in degrees and degrees/sec
        v_mps = (sog_knots * 0.514444) if sog_knots else 0.0
        cog_rad = math.radians(cog_deg) if cog_deg else 0.0
        v_north = v_mps * math.cos(cog_rad)
        v_east = v_mps * math.sin(cog_rad)
        
        # Approximate conversion: 1 deg lat ≈ 111,000 m
        v_lat = v_north / 111000.0
        v_lon = v_east / (111000.0 * math.cos(math.radians(init_lat)) + 1e-6)
        
        self.state = np.array([init_lat, init_lon, v_lat, v_lon], dtype=float)
        self.p = np.eye(4) * 0.01  # Initial covariance estimate
        self.q = np.eye(4) * 0.0001  # Process noise
        self.r = np.eye(2) * 0.00005  # Measurement noise (GPS drift)

    def predict_and_update(self, raw_lat: float, raw_lon: float, sog: float, cog: float) -> tuple[float, float, list[str]]:
        current_time = time.time()
        dt = max(current_time - self.last_update_ts, 1.0)
        self.last_update_ts = current_time
        alerts = []

        # 1. Kinematic Sanity & Spoofing Check
        dist_km = haversine_km(self.state[0], self.state[1], raw_lat, raw_lon)
        elapsed_hours = dt / 3600.0
        implied_speed_knots = (dist_km / 1.852) / max(elapsed_hours, 1e-4)

        # Commercial bulkers/tankers rarely exceed 35 knots
        if implied_speed_knots > 45.0 and dist_km > 10.0:
            alerts.append("SPOOFING_IMPOSSIBLE_SPEED_JUMP")

        # 2. Kalman Prediction Step (Dead Reckoning)
        f = np.array([
            [1.0, 0.0, dt,  0.0],
            [0.0, 1.0, 0.0, dt ],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ])
        state_pred = f @ self.state
        p_pred = f @ self.p @ f.T + self.q

        # 3. Kalman Update Step
        h = np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0]
        ])
        z = np.array([raw_lat, raw_lon])
        y = z - (h @ state_pred)  # Residual
        s = h @ p_pred @ h.T + self.r
        k = p_pred @ h.T @ np.linalg.inv(s)  # Kalman Gain

        self.state = state_pred + (k @ y)
        self.p = (np.eye(4) - (k @ h)) @ p_pred

        filtered_lat = float(self.state[0])
        filtered_lon = float(self.state[1])
        return filtered_lat, filtered_lon, alerts