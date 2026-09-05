# Pillar 1 — Government Alignment + Coastal/Import Economics + Coal Energy Cost

## Research conclusion
Do not hard-code a headline such as "India logistics cost is 13–14% of GDP vs global 8%". The government record is more nuanced. Historical PIB material described 13–14% as private estimates and explicitly said no official estimate existed at that time; later government material referenced a range from prior studies and ongoing official estimation work.

## What should appear in the product
### Policy Alignment Card
- NLP: integrated, efficient, reliable, green and cost-effective logistics
- Sagarmala: reduction of logistics cost for domestic and EXIM cargo
- Coal logistics: scenario evidence for movement and sourcing choices

### Scenario A — Imported cargo
Inputs:
origin port/country
destination port
commodity FOB/reference cost
freight
insurance
port charges
handling
inland leg
currency and FX assumption
GCV
ash/moisture if blend analysis is enabled

### Scenario B — Domestic/coastal movement
origin port
destination port
commodity/reference cost
coastal freight
port/terminal charges
handling
inland first/last mile
GCV and quality

## Core formulas
LandedCostPerTonne = Commodity + Freight + Insurance + Port + Handling + Inland + Other

EnergyGJPerTonne = GCV_kcal_per_kg × 0.004184

CostPerGJ = LandedCostPerTonne / EnergyGJPerTonne

BlendCost = x*DomesticCost + (1-x)*ImportCost
BlendGCV = x*DomesticGCV + (1-x)*ImportGCV
BlendAsh = x*DomesticAsh + (1-x)*ImportAsh

## Critical product correction
The requested "USD/GCV" label is ambiguous. Use one of:
- USD/GJ, preferred because it is physically normalized
- USD per Gcal
- cost per 1,000 kcal-equivalent
Never divide USD directly by a raw GCV number without documenting the unit.

## Sensitivity grid
Required because the scenario outcome can flip:
Freight ±10%
FX ±5%
Port cost ±20%
GCV ±5%
Waiting days 0 / P50 / P90

## Data provenance schema
field,value,unit,currency,source_type,source_url_or_note,observed_at,effective_from,confidence

## Definition of done
- comparison works with missing optional fields
- unit/currency mismatches are rejected
- cost/GJ is disabled if GCV missing
- no option is called "best" unless ranking assumptions are visible
- every displayed policy claim links to source text in the internal evidence panel
