# Pillar 4 — Physical Port Operations + Waiting + Financial Exposure

## Research conclusion
Port-level feasibility is too coarse. Use berth-level records where available.

## Official Paradip examples
New Coal Import Berth:
LOA 300 m, Beam 46 m, Draft 16 m
Condition: 16 m berthing during high tide.

Coal Berth-01:
LOA 300 m, Beam 46 m, Base draft 14.5 m
Condition: draft up to 16 m during high tide.

Coal Berth-02:
LOA 300 m, Beam 46 m, Draft 14.5 m.

These values are reference seed data and must carry source URL and retrieval date.

## Eligibility states
ELIGIBLE
ELIGIBLE_WITH_CONDITION
INELIGIBLE
UNKNOWN

Never force UNKNOWN into ELIGIBLE.

## Constraint evaluation
1 identify berth if known
2 evaluate LOA
3 evaluate beam
4 evaluate draft
5 evaluate commodity compatibility
6 evaluate tide/conditional rule
7 evaluate data freshness
8 return reasons and evidence

## Waiting uncertainty
If the model predicts P10/P50/P90 waiting days:
DelayExposureLow = P10 × daily_cost
DelayExposureBase = P50 × daily_cost
DelayExposureHigh = P90 × daily_cost

## Critical distinction
Estimated delay exposure is not contractual demurrage.

ContractualDemurrage =
max(0, ActualOrForecastPortTime - AllowedLaytime) × ContractRate

Only calculate the latter if allowed laytime and contract rate are available.

## Tidal design
Do not create a generic "seasonal draft allowance" constant.
Use a rule record:
condition_type
effective window
threshold
source
version
verified_at

## Definition of done
A vessel can be:
INELIGIBLE because LOA exceeds berth
ELIGIBLE_WITH_CONDITION because high tide is required
UNKNOWN because berth/dimension data is missing
