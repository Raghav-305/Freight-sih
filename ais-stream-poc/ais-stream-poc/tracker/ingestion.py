import asyncio
import json
import os
import websockets
from dotenv import load_dotenv
from tracker.kalman_filter import VesselKalmanTracker

load_dotenv()
API_KEY = os.getenv("AISSTREAM_API_KEY", "852d9cb1b1140c10e913b345cd9436cf26f7f33f")

# In-memory registry of tracker instances per vessel
TRACKERS: dict[int, VesselKalmanTracker] = {}

async def run_ais_ingestion(broadcast_queue: asyncio.Queue):
    """
    Subscribes to live AIS feed via WebSocket and forwards filtered points.
    Includes a fallback synthetic generator if no valid API key is set.
    """
    if not API_KEY or API_KEY == "your_free_api_key_here":
        print("[INGESTION] No valid AISSTREAM_API_KEY found. Starting synthetic simulation feed...")
        await _run_mock_generator(broadcast_queue)
        return

    url = "wss://stream.aisstream.io/v0/stream"
    # Example bounding box: English Channel / North Sea maritime corridor
    subscription = {
        "APIKey": API_KEY,
        "BoundingBoxes": [[[49.0, -5.0], [52.5, 3.0]]],
        "FilterMessageTypes": ["PositionReport"]
    }

    while True:
        try:
            async with websockets.connect(url) as ws:
                await ws.send(json.dumps(subscription))
                print("[INGESTION] Connected to live AIS satellite stream.")

                async for raw_msg in ws:
                    msg = json.loads(raw_msg)
                    if msg.get("MessageType") == "PositionReport":
                        meta = msg.get("MetaData", {})
                        pos = msg.get("Message", {}).get("PositionReport", {})

                        mmsi = meta.get("MMSI")
                        lat = meta.get("latitude")
                        lon = meta.get("longitude")
                        sog = pos.get("Sog", 0.0)
                        cog = pos.get("Cog", 0.0)
                        name = meta.get("ShipName", f"MMSI-{mmsi}").strip()

                        if not mmsi or lat is None or lon is None:
                            continue

                        # Initialize or update Kalman state
                        if mmsi not in TRACKERS:
                            TRACKERS[mmsi] = VesselKalmanTracker(mmsi, lat, lon, sog, cog)
                            filt_lat, filt_lon, alerts = lat, lon, []
                        else:
                            filt_lat, filt_lon, alerts = TRACKERS[mmsi].predict_and_update(lat, lon, sog, cog)

                        payload = {
                            "mmsi": mmsi,
                            "name": name,
                            "raw_lat": lat,
                            "raw_lon": lon,
                            "filtered_lat": round(filt_lat, 6),
                            "filtered_lon": round(filt_lon, 6),
                            "sog": sog,
                            "cog": cog,
                            "alerts": alerts,
                            "timestamp": meta.get("time_utc")
                        }
                        await broadcast_queue.put(payload)
        except Exception as e:
            print(f"[INGESTION ERROR] Feed disconnected: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

async def _run_mock_generator(broadcast_queue: asyncio.Queue):
    """Generates realistic movements for 3 vessels in the English Channel for demo testing."""
    vessels = [
        {"mmsi": 211281610, "name": "NORDIC VOYAGER", "lat": 50.50, "lon": -1.20, "sog": 14.5, "cog": 65.0},
        {"mmsi": 353130000, "name": "PACIFIC TITAN", "lat": 50.10, "lon": -2.10, "sog": 11.2, "cog": 70.0},
        {"mmsi": 636019821, "name": "ATLANTIC CARRIER", "lat": 49.80, "lon": -3.00, "sog": 18.0, "cog": 55.0},
    ]

    for v in vessels:
        TRACKERS[v["mmsi"]] = VesselKalmanTracker(v["mmsi"], v["lat"], v["lon"], v["sog"], v["cog"])

    step = 0
    while True:
        await asyncio.sleep(2.0)
        step += 1

        for v in vessels:
            # Simulate slight GPS noise and course advancement
            noise_lat = np.random.normal(0, 0.0003)
            noise_lon = np.random.normal(0, 0.0003)
            
            v["lat"] += 0.002 * (v["sog"] / 15.0) + noise_lat
            v["lon"] += 0.003 * (v["sog"] / 15.0) + noise_lon

            # Inject artificial anomaly on PACIFIC TITAN at step 15 to test spoofing alert
            if v["mmsi"] == 353130000 and step == 15:
                v["lat"] += 0.85  # Jump ~90km instantaneously
                print("\n[SIMULATION] Triggered artificial AIS spoofing jump on MMSI 353130000\n")

            tracker = TRACKERS[v["mmsi"]]
            filt_lat, filt_lon, alerts = tracker.predict_and_update(v["lat"], v["lon"], v["sog"], v["cog"])

            payload = {
                "mmsi": v["mmsi"],
                "name": v["name"],
                "raw_lat": round(v["lat"], 6),
                "raw_lon": round(v["lon"], 6),
                "filtered_lat": round(filt_lat, 6),
                "filtered_lon": round(filt_lon, 6),
                "sog": v["sog"],
                "cog": v["cog"],
                "alerts": alerts,
                "timestamp": asyncio.get_event_loop().time()
            }
            await broadcast_queue.put(payload)