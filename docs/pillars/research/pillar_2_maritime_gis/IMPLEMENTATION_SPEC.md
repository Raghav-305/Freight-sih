GET /api/map/ports
GET /api/map/corridors
GET /api/map/chokepoints
GET /api/map/hazards
GET /api/map/freshness

Hazard adapter interface:
fetch()
normalize()
validate_timestamp()
cache()
return_with_freshness()

Frontend:
MapCanvas
LayerControl
FreshnessBadge
RiskLegend
RouteInspector
PortQueueOverlay

Do not place network calls directly in map components.
