# DATA INPUT CHECKLIST

Before live ML integration, the data team should provide a documented, versioned source for each item below.

## Market
- BDI
- BPI
- BSI
- route freight observations
- FFA curves
- bunker prices
- commodity prices

## Maritime operations
- vessel master data
- vessel class mapping
- DWT
- LOA
- beam
- draft
- speed
- fuel consumption
- AIS positions
- port calls
- fixture history

## Ports
- port master data
- port coordinates
- berth count
- berth length
- loading/discharge rates
- draft limits
- LOA limits
- beam limits
- DWT limits
- queue/waiting history
- berth utilization
- congestion history

## External conditions
- weather observations/forecasts
- cyclone/storm events
- geopolitical risk events
- supply disruption events

## Demand / commodity
- coal imports
- origin/destination demand indicators
- commodity prices
- trade-flow features

## Model-ready data
- clean tables
- processed tables
- route daily features
- feature definitions
- source timestamps
- timezone conventions
- missing-value policy
- outlier policy
- dataset version

## Governance
Every production dataset should have:

1. Source
2. Owner
3. Update frequency
4. Timestamp semantics
5. Units
6. Quality checks
7. Version
8. Retention policy
9. Access classification
10. Lineage to model output

Do not commit confidential government/company records to source control.