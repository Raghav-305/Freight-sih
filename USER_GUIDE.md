# Freight-SIH User Guide

## What This Application Is

Freight-SIH is a maritime freight chartering and procurement decision-support platform. It helps a user compare routes, forecast freight prices, evaluate vessels and ports, understand risks, optimize contract coverage, and preserve an auditable decision trail.

It is not an automatic purchasing system. Its recommendations support an authorized officer; a human must review and approve any real chartering or procurement action.

The application is designed around five connected capabilities:

1. **Economics:** compare landed cost, energy cost, scenarios, and coal blends.
2. **Maritime GIS:** view ports, shipping corridors, chokepoints, and advisories.
3. **Governance:** record decisions, approvals, audit events, and reports.
4. **Port Operations:** check physical berth compatibility and delay exposure.
5. **Command Center:** summarize market, model, health, freshness, and review status.

## Opening The Application

Start the backend and frontend from the repository root:

```powershell
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
npm --prefix frontend run dev
```

Open:

```text
http://127.0.0.1:5173
```

The backend API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

The active application is the React/Vite app under `frontend/`. The older `public/` application is a separate legacy demo and does not contain all of the pages described here.

## How To Read The Screen

Every page uses the same main layout:

- **Left navigation:** switches between pages.
- **Top heading:** identifies the current page.
- **API status pill:** shows whether the frontend is using live or mock mode and which backend URL it is calling.
- **Command header:** shows shared system, review, model, and freshness information.
- **Compliance banner:** reminds the user that AI output is decision support and requires authorized human review.
- **Metric cards:** summarize the most important values for the current view.
- **Forms:** define the route, vessel, date, cargo, or scenario being evaluated.
- **Results:** appear after the relevant action button is pressed.

### Common result language

- **P10:** lower or optimistic estimate, depending on the metric.
- **P50:** central or base estimate.
- **P90:** higher or adverse estimate.
- **Static reference:** a local reference layer or dataset, not a live sensor.
- **Demo simulation:** illustrative data clearly marked as non-live.
- **Modelled exposure:** calculated planning exposure, not automatically a contractual liability.
- **Human review required:** the result is advisory and cannot authorize procurement by itself.

# Page-by-Page Guide

## 1. Executive Overview

### What this page is for

The Executive Overview is the starting page. It gives a senior user a quick picture of the current freight market and the immediate chartering environment.

It answers questions such as:

- Is the market currently bullish, neutral, or bearish?
- Is it better to fix freight now or wait?
- What is the current spot freight rate?
- How are Baltic dry-bulk indices moving?
- What are bunker and coal prices doing?
- Are there active market, geopolitical, or weather events?
- What does recent fixture history look like?

### What the user enters

The market form contains:

- **Origin:** load country or load-region choice such as Australia or Indonesia.
- **Destination:** Indian discharge port such as Paradip, Dhamra, Haldia, or Vizag.
- **Vessel class:** Panamax, Supramax, Capesize, or Handysize.
- **As-of date:** the date for which the market should be evaluated.

### What happens when the user submits

The application sends the selected route and date to the market and market-context APIs. The backend combines market inputs, reference data, and model or deterministic intelligence logic, then returns the current market picture.

### What the results mean

The page can show:

- **Market regime:** the overall market direction classification.
- **Chartering signal:** a practical recommendation such as monitor, wait, or consider fixing.
- **Freight direction:** whether freight is expected to rise, fall, or remain stable.
- **Volatility:** the amount of uncertainty in the market.
- **Bullish/neutral/bearish probabilities:** the model or rules-based confidence distribution.
- **Bunker pressure:** whether fuel cost is increasing the procurement risk.
- **Bunker and coal prices:** reference commodity prices.
- **FFA curve:** forward freight agreement prices for different periods.
- **Coal imports:** summarized import volume.
- **Market events:** active event count and context.
- **Fixture history:** number of historical fixtures and average rate.

### How to use it

Use this page first to understand the market context. Do not treat the chartering signal as an approval. Use it to decide which route, vessel, or scenario should receive deeper analysis on the other pages.

## 2. Forecast & SHAP

### What this page is for

This page forecasts the expected freight rate for a selected route and explains the forces influencing the forecast.

It answers:

- What freight rate should be expected over the next several planning horizons?
- How uncertain is the prediction?
- Which factors are pushing the forecast up or down?
- What happens if freight or bunker prices change?

### What the user enters

The forecast form includes:

- **Origin:** load location.
- **Destination:** discharge port.
- **Vessel class:** usually Panamax, Supramax, or Capesize.
- **Cargo quantity:** shipment size in metric tonnes.
- **Laycan start:** first acceptable loading/delivery date.
- **Laycan end:** last acceptable loading/delivery date.

### Generate Forecast

When the user selects **Generate Forecast**, the frontend calls the forecast service. The service prepares the input features, loads the active forecasting artifact, calculates the requested horizons, and returns a forecast object.

### Forecast results

Each horizon card shows:

- **Central freight estimate:** normally the P50 value.
- **P10:** lower-side estimate.
- **P90:** upper-side estimate.
- **Horizon:** the planning window, such as 7-day, 30-day, 60-day, or 90-day.

The forecast output also displays the model version so the user can identify which registered model produced the result.

### SHAP-style explanation

The explanation section lists the factors that contributed to the forecast. A positive contribution pushes the estimate upward; a negative contribution pushes it downward. The explanation is meant to answer “why did the forecast move?” rather than simply showing a number.

This improves reviewability: an officer can see whether the result is being influenced by market freight, bunker pressure, port congestion, route conditions, or another feature.

### What-if analysis

The What-If form allows the user to enter:

- **Freight change percentage.**
- **Bunker fuel change percentage.**

The application returns scenario freight values for the available horizons, the absolute change, and the percentage change. This is a sensitivity exercise, not a new trained model.

### How to use it

Use the forecast as a range, not as a guaranteed price. Compare the P50 with the P10/P90 spread. A wide spread means the procurement decision is more exposed to uncertainty and may require a larger risk buffer or stronger contract coverage.

## 3. Portfolio Optimizer

### What this page is for

This page helps decide how much cargo should be covered through different charter structures instead of relying on one contract type.

It compares structures such as:

- Spot voyages.
- Multi-voyage arrangements.
- Short-term coverage.
- COA-style or longer-term coverage.

### What the user enters

The form includes:

- **Total cargo commitment:** total metric tonnes to cover.
- **Load port:** origin such as Gladstone, Newcastle, Hay Point, or another supported source.
- **Discharge port:** Indian destination.
- **Vessel class:** Panamax or Capesize in the active form.
- **Delivery/laycan date.**
- **Maximum single-contract share:** the largest allowed fraction assigned to one contract structure.

### Calculate Optimal Contract Allocation

The backend combines route, freight, bunker, distance, congestion, operating cost, risk, and contract assumptions. Where configured, the strategy uses a HiGHS linear-programming solver to find a lower-cost allocation subject to constraints.

### What the results mean

The page can display:

- **Strategy:** the recommended high-level contract posture.
- **Voyages needed:** approximate number of voyages required.
- **Voyage distance:** route distance in nautical miles.
- **Baseline cost:** cost if the commitment were treated as spot coverage.
- **LP optimized cost:** cost under the recommended allocation.
- **Projected savings:** estimated reduction versus the baseline.
- **Recommended voyage mix:** number and percentage of voyages by contract structure.
- **Contract volume distribution:** percentage and metric tonnes by structure.
- **Rate by structure:** estimated USD per metric tonne.
- **Cost breakdown:** base freight, bunker fuel, congestion delay, idle/deadhead, and risk buffer.
- **Recommended fixing window:** when the strategy suggests acting.

### How to use it

Use this page to compare coverage strategies, not to automatically execute a contract. Review the assumptions and constraints, especially maximum share and risk buffer. A low expected cost is not automatically the best choice if it creates excessive concentration or operational risk.

## 4. Vessel Intelligence

### What this page is for

Vessel Intelligence finds vessels that are suitable for a selected destination, vessel class, and cargo quantity.

It answers:

- Which candidate vessels can carry the shipment?
- Which candidates are physically feasible?
- Which vessel has the best suitability score?
- How much waiting time is expected?
- Which constraints cause a vessel to fail?

### What the user enters

- **Destination port.**
- **Vessel class.**
- **Cargo quantity.**
- **Maximum results:** how many candidates to return.

### Find Suitable Vessels

The backend evaluates candidate vessels using specifications, port constraints, cargo requirements, and waiting-time or congestion information. The result is a ranked candidate list.

### Candidate table

The table shows:

- **Vessel name and IMO number:** identity of the candidate.
- **DWT:** deadweight capacity.
- **Draft:** vessel draft in metres.
- **Predicted wait:** expected waiting hours.
- **Suitability:** ranking score out of 100.
- **Status:** whether the vessel is eligible.
- **Tier and constraints:** recommendation tier and failed constraints.

### Individual Port Feasibility Checker

The second section checks one port and vessel class more directly. It accepts:

- Port.
- Vessel class.
- Cargo quantity.
- Arrival date.

It returns:

- **Feasible or incompatible/high risk.**
- **Current queue:** vessels waiting.
- **Expected wait:** congestion estimate in days.
- **Constraint checks:** pass/fail values for physical or operational rules.

### How to use it

Start with the vessel ranking, then use the individual port checker to inspect a specific operational concern. A high suitability score does not override an ineligible berth or an unacceptable wait.

## 5. Risk Intelligence

### What this page is for

Risk Intelligence provides a structured route-risk assessment before a chartering or procurement decision.

It helps the user ask:

- Is this route exposed to unusual risk?
- Is the discharge port a major concern?
- Which risk dimensions are driving the result?
- Should the route receive additional controls or review?

### What the user enters

- **Route ID:** identifier for the route under review.
- **Origin country.**
- **Destination port code.**
- **Assessment date.**

### Assess Route Risk

The risk service combines the selected route and date with available market, port, geopolitical, weather, vessel, and operational risk inputs. The active implementation may use rules and stored artifacts; it is not necessarily a live intelligence feed.

### What the results mean

- **Overall risk:** combined score out of 100.
- **Route:** the route identifier supplied by the user.
- **Port:** resolved destination port name.
- **Engine:** mode or assessment engine used.
- **Risk cards:** individual risk dimensions and their scores.
- **High exposure:** typically a score of 70 or more.
- **Moderate exposure:** typically 45 to 69.
- **Lower exposure:** below the moderate threshold.

### How to use it

Use the individual scores to determine mitigations. For example, a high port-risk score may require a different berth, larger time buffer, or stronger demurrage planning. Do not reduce the decision to the overall number alone.

## 6. Freight Opportunity Score

### What this page is for

The Freight Opportunity Score, or FOS, evaluates whether the current conditions look favorable for fixing freight during a chosen planning horizon.

It is intended to answer:

- Is this a good opportunity to fix?
- Should the user wait or monitor?
- What components are contributing to the opportunity score?
- What freight return is expected?

### What the user enters

- **Origin.**
- **Destination.**
- **Vessel class.**
- **Horizon days:** 7, 30, or 60 days.
- **As-of date.**

### Calculate Opportunity Score

The service combines freight expectations, market direction, bunker conditions, port pressure, and other opportunity features into an FOS result.

### What the results mean

- **FOS score:** normalized score out of 100.
- **Recommendation:** action posture such as fix, monitor, or wait.
- **Expected return:** estimated return percentage.
- **Expected freight:** expected USD per metric tonne.
- **Components:** separate scores such as market, freight, bunker, or port components.
- **Weight contribution:** how strongly each component influences the final score.
- **Forecast source and note:** indicates where the result came from and any qualification.

### How to use it

Use FOS as a screening signal. Compare it with the Forecast, Risk, and Portfolio Optimizer pages before deciding. A favorable opportunity score can still be unsuitable if the vessel or port is physically infeasible.

## 7. Policy & Economics

### What this page is for

This page is Pillar 1. It compares delivered economics for import and coastal coal scenarios and helps a user understand the effect of fuel quality and cost assumptions.

It answers:

- Which scenario has the lower landed cost per tonne?
- Which scenario has the lower energy-adjusted cost?
- How does GCV change the comparison?
- What assumptions produced the ranking?

### Default scenarios

The page begins with examples such as:

- Import: Gladstone to Paradip.
- Coastal: Paradip to Ennore.

These are editable scenario labels, not fixed recommendations.

### What the user enters

For each scenario, the user enters cost components:

- Commodity.
- Freight.
- Insurance.
- Port.
- Handling.
- Inland.
- Other.
- GCV in kcal/kg, when available.

### Compare scenarios

The backend totals the cost components, ranks the scenarios, and calculates energy-normalized cost when GCV is supplied.

### Results

The comparison table shows:

- Rank.
- Scenario name.
- Landed cost per tonne.
- Cost per GJ.

The assumptions panel can be opened to inspect the exact payload and warnings returned by the backend.

### How to use it

Do not compare only USD per tonne. If two fuels have different calorific values, cost per GJ can be the more useful economic comparison. Review all cost components and warnings before accepting the ranking.

## 8. Port Operations

### What this page is for

Port Operations is Pillar 4. It checks whether a vessel can physically use a specified port or berth and estimates the financial exposure of waiting.

It answers:

- Is the vessel eligible for the berth?
- Is eligibility conditional?
- Which physical constraint fails?
- What could a delay cost under low, base, and high waiting assumptions?

### What the user enters

- **LOA:** length overall in metres.
- **Beam:** vessel width in metres.
- **Draft:** vessel draft in metres.
- **Port ID.**
- **Optional berth ID.**

### Check eligibility

The backend compares the vessel dimensions with the port and berth constraints. It returns semantic states:

- **Eligible.**
- **Eligible with condition.**
- **Ineligible.**
- **Unknown:** insufficient data.

The page also lists individual berth checks, reasons, and warnings.

### Delay exposure

When a vessel is conditional or ineligible, the page calculates a separate modelled delay exposure using low/base/high waiting cases and a daily charter-hire rate.

It deliberately labels this as:

> Modelled delay exposure, not contractual demurrage.

This distinction matters. A planning estimate is not automatically the amount legally owed under a charterparty.

### How to use it

Use this page before relying on a vessel recommendation. Resolve any conditional or failed constraint before proceeding. Use the delay exposure as a planning buffer and investigate the actual charterparty terms separately.

## 9. Maritime GIS

### What this page is for

Maritime GIS is Pillar 2. It gives a geographic view of the maritime network and highlights the locations that affect freight movement.

It shows:

- **Blue points:** ports.
- **Yellow lines:** shipping corridors.
- **Orange points:** strategic chokepoints.
- **Red points:** hazard advisories when mappable demo geometry exists.

### How the map works

The application requests local/reference GeoJSON for ports, corridors, chokepoints, and hazards. The visible basemap uses bundled country geometry through `world-atlas`, `topojson-client`, and `d3-geo`, so the map can still display without external map tiles.

The map surface supports:

- Dragging to pan.
- Mouse-wheel zoom.
- Layer checkboxes to show or hide application layers.
- Navigation controls when MapLibre is available.
- Popups for map features when the interactive MapLibre layer is active.

### What the user can understand

The map helps answer:

- Where are the relevant Indian discharge ports?
- Which routes connect source regions to India?
- Which chokepoints could affect a voyage?
- Where are the advisory regions shown by the current data?

The map is a spatial reference tool. It does not itself calculate the best charter strategy or prove a vessel is eligible for a berth.

### Truth labels

Static ports and corridors are reference information. Hazard overlays may be labelled demo simulation. The user should inspect the label and freshness indicator before treating a layer as live operational intelligence.

## 10. Data Quality

### What this page is for

Data Quality checks the health of the datasets that support the platform. It helps a user decide whether an output is based on complete and current inputs.

### What it displays

Top-level metrics include:

- **Pipeline health.**
- **Number of monitored datasets.**
- **Healthy streams.**
- **Sampled rows.**

The dataset table includes:

- Dataset name.
- File path.
- Category/type.
- Status.
- Row count.
- Column count.
- Missing percentage.
- Duplicate percentage.
- Last updated timestamp.

### Why this matters

A sophisticated model cannot repair a missing, stale, or duplicated source automatically. Use this page to check data readiness before relying heavily on a forecast, opportunity score, or optimization result.

The governance note at the bottom provides the interpretation supplied by the data-quality service.

## 11. CVC Governance

### What this page is for

CVC Governance is Pillar 3. It records and reviews governed decisions rather than leaving important procurement reasoning in an untracked conversation or spreadsheet.

It supports:

- Decision creation.
- Analysis.
- Submission for review.
- Approval by an authorized reviewer.
- Return for revision.
- Rejection.
- Audit-event inspection.
- PDF/XLSX report generation.
- Hash-chain verification where exposed by the audit service.

### How the workflow operates

A typical decision moves through:

```text
Draft -> Analysed -> Submitted -> Approved
                         |-> Returned -> Analysed/Submitted
                         `-> Rejected
```

The system applies separation-of-duties rules. The person who created or submitted a decision should not be able to approve it when the self-approval rule applies.

### What the user should review

- Who created and analysed the decision.
- Which inputs and recommendations were captured.
- Which actions occurred and when.
- Whether the decision was returned or rejected.
- Whether the audit chain is intact.
- Whether the generated report reflects the correct decision state.

### Important boundary

The audit trail improves accountability; it does not replace the organization’s formal procurement, vigilance, finance, or legal approval process.

## 12. Model Registry

### What this page is for

The Model Registry page shows which model artifacts are known to the application and which model is active for relevant inference paths.

### What it can provide

- Active forecasting model.
- Registered model versions.
- Model family and algorithm.
- Artifact path or relative location.
- Model status.
- Available performance metadata.
- Overall system health indicators.

### How to use it

Use this page when you need to answer:

- Which model produced the current forecast?
- Is the model registered and marked active?
- Which artifact is deployed locally?
- Is there performance information available?

A model being registered does not prove that every page is using it. Always check the endpoint and response metadata for the specific workflow.

# Shared User Workflow

A sensible review sequence is:

1. **Executive Overview:** understand the current market.
2. **Forecast & SHAP:** estimate the route freight range and understand drivers.
3. **Freight Opportunity:** determine whether the timing looks favorable.
4. **Vessel Intelligence:** identify vessels that fit the cargo and port.
5. **Port Operations:** verify physical berth eligibility and delay exposure.
6. **Risk Intelligence:** inspect route and port risk.
7. **Policy & Economics:** compare import/coastal or alternative economic scenarios.
8. **Portfolio Optimizer:** decide how to distribute cargo across charter structures.
9. **Maritime GIS:** inspect route geography and chokepoints.
10. **Data Quality:** confirm that the underlying data is healthy and fresh.
11. **Model Registry:** record which model/artifact supported the analysis.
12. **CVC Governance:** create or update the governed decision and submit it for authorized review.

The order can change depending on the business question. The important principle is to combine market, model, operational, economic, and governance evidence rather than rely on a single score.

# What The User Should Not Assume

- A forecast is not a guaranteed future freight rate.
- A high opportunity score is not an automatic fixing instruction.
- A vessel suitability score does not override berth constraints.
- Modelled delay exposure is not the same as contractual demurrage.
- A static map layer is not live AIS or live weather telemetry.
- A demo hazard is not an official warning.
- A lower landed cost per tonne is not always the lower cost per unit of energy.
- A registered model is not proof that every page uses that model.
- A generated recommendation is not an approval.

# Glossary

| Term | Meaning |
|---|---|
| AIS | Automatic Identification System data used for vessel position or movement context |
| Berth | Specific docking location within a port |
| BDI/BPI | Baltic Dry Index and Baltic Panamax Index reference measures |
| COA | Contract of Affreightment, a longer-term cargo movement structure |
| DWT | Deadweight tonnage, a vessel carrying-capacity measure |
| FFA | Forward Freight Agreement |
| FOS | Freight Opportunity Score |
| GCV | Gross Calorific Value, the energy content of fuel |
| HiGHS | Optimization solver used by the linear-programming path |
| IMO | International Maritime Organization vessel identification number |
| Laycan | Loading/cancellation date window |
| LOA | Length overall |
| P10/P50/P90 | Lower, central, and upper planning estimates |
| SHAP | Feature-attribution method used to explain model outputs |
| VLSFO | Very Low Sulfur Fuel Oil |

## Source Files

The page behavior described here comes primarily from:

- `frontend/src/main.tsx`
- `frontend/src/api.ts`
- `frontend/src/components/ScenarioComparator.tsx`
- `frontend/src/components/EligibilityMatrix.tsx`
- `frontend/src/components/MapCanvas.tsx`
- `frontend/src/components/AuditTimeline.tsx`
- `backend/app/api/`
- `backend/app/services/`

This guide explains how the current implementation behaves; it does not promise capabilities that are only described in future roadmap or handoff documents.
