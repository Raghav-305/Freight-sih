# Pillar 5 — Executive Command Center

## Design principle
The command center is a decision surface, not a dashboard wallpaper.

## Top navigation
Data freshness
Active decision cases
Route-risk alerts
System health
Market feed status

Only label a value LIVE when a genuine live feed is connected.

## Tabs
1 Executive Overview & KPIs
2 Freight Forecasting & Explanation
3 Chartering Portfolio: Spot vs COA
4 Vessel Eligibility & Port Constraints
5 Maritime Geospatial Visualizer
6 Data Quality & Pipeline Lineage
7 Audit Log & Approval Workflow

## Above-the-fold order
1 blocking constraint
2 recommended action / scenario rank
3 financial impact
4 risk
5 uncertainty
6 provenance/freshness

## KPI contract
Every decision-critical KPI must support drill-down:
value
unit
source
observed_at
transformation
model/version
confidence/uncertainty

## Visual rules
- uncertainty band is visually different from point forecast
- stale data is visible, not silently hidden
- blocked approval is visible
- conditional vessel eligibility is amber-style semantic state, but do not rely on color alone
- demo/simulated data must carry text label

## Judge flow
Overview → compare options → explain forecast → verify physical feasibility → inspect route → review evidence → approve.
