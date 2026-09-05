# Pillar 2 — Maritime GIS + Chokepoints + Hazards

## Architecture
MapLibre GL JS for rendering.
Static local GeoJSON for ports/chokepoints/reference corridors.
Optional PMTiles for packaged basemap/vector data.
IMD adapter for official hazard data when connectivity and access permit.

## Truth classes
STATIC_REFERENCE: ports/chokepoints/reference geometry
OFFICIAL_PERIODIC: IMD or other official refreshable feed
MODEL_OUTPUT: project risk/forecast result
USER_INPUT: scenario origin/destination/vessel
DEMO_SIMULATION: synthetic queue markers only

The UI badge is mandatory.

## Layers
1. Ports
2. Reference corridor
3. Chokepoint exposure
4. Cyclone/weather hazard
5. Route-risk segments
6. Port queue

## Important safety/credibility rule
A manually drawn corridor is NOT AIS.
A simulated vessel queue is NOT operational traffic.
A static cyclone polygon is NOT a live warning.

## Risk model composition
Do not add raw risk scores.
RouteRisk = weighted combination of:
market_risk
weather_hazard
chokepoint_exposure
port_delay_risk
data_staleness_penalty

Show components separately and keep weights configurable.

## Offline behavior
- static layers: always available
- cached last-success official data: available with STALE badge
- failed live request: show failure state, not old data as LIVE
- basemap unavailable: fallback to neutral local reference canvas if packaged tiles are not included

## Definition of done
A judge can switch off Wi-Fi and still see ports, corridors and chokepoints.
A judge can inspect the timestamp of every dynamic layer.
