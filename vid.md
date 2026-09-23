# Sovereign Freight Chartering System: Complete Video Demonstration Script (Side-by-Side Walkthrough)

**Project Title**: Sovereign Freight Chartering & Decision Support System (SIH 2026 · PS 26006)  
**Target Audience**: Smart India Hackathon (SIH) Evaluators, Ministry of Ports, Shipping and Waterways (MoPSW), CIL/NTPC/SAIL Procurement Committees, and Vigilance Officers.  
**Video Format**: Side-by-Side Presentation Layout:
- **Left Side**: Presenter Camera / Voiceover Narration with Graphic Callouts & Model Badges.
- **Right Side**: Live Full-Screen Browser Window running the Frontend (`http://localhost:5173`) with live interactions, clicks, and real-time backend API outputs (`http://127.0.0.1:8000`).
**Total Duration**: ~14 Minutes (Structured into 11 Timed Chapters).

---

## Video Chapter Navigation & Timeline

| Chapter | Title | Pages Covered | Key Models & Tech Demonstrated | Est. Time |
|:---:|:---|:---|:---|:---:|
| **1** | [Executive Hook & Problem Statement](#chapter-1-executive-hook-problem-statement--command-center) | Page 1 (Executive Overview) | High-contrast Sovereign Design, GIGW compliance, KPI telemetry | 00:00 – 01:15 |
| **2** | [Predictive Forecasting & SHAP XAI](#chapter-2-predictive-forecasting--explainable-ai) | Pages 2 & 3 (Forecast & FOS) | `xgb_panamax_freight_v7`, SHAP TreeExplainer, Quantile bounds | 01:15 – 02:45 |
| **3** | [Linear Optimization & Economics](#chapter-3-mathematical-portfolio-optimization--macroeconomics) | Pages 4 & 5 (Charter & Scenarios) | HiGHS LP Solver (SciPy), TCE $/day engine, IMO CII carbon | 02:45 – 04:00 |
| **4** | [Maritime GIS & 6-Pillar Risk Engine](#chapter-4-geospatial-tracking--multi-dimensional-risk-intelligence) | Pages 6 & 7 (GIS Map & Risk) | Interactive Leaflet GIS, 6 Risk Pillars, Monte Carlo 95% VaR | 04:00 – 05:15 |
| **5** | [All 16 Indian Ports & Vessel Vetting](#chapter-5-port-marine-engineering-physics--vessel-intelligence) | Pages 8 & 9 (Ports & Vessels) | 16 Port Marine Physics, Dual-Engine Congestion, DG Shipping Age limits | 05:15 – 06:45 |
| **6** | [CVC Vigilance & Polygon Blockchain](#chapter-6-cvc-two-officer-governance--blockchain-merkle-anchoring) | Page 10 (CVC Governance) | Dual Maker-Checker sign-off, SHA-256 Hash Chain, Polygon Amoy DLT | 06:45 – 08:15 |
| **7** | [ISO 8000 Data Quality & Model Drift](#chapter-7-iso-8000-data-quality--model-governance-registry) | Pages 11 & 12 (Quality & Models) | ISO 8000 6-dimension health, KS drift test, ML model registry | 08:15 – 09:30 |
| **8** | [Layer 6 Counterfactuals & Sensitivity](#chapter-8-layer-6-counterfactual-explanations--algorithmic-sensitivity) | Page 13 (Counterfactuals L6) | Systematic Algorithmic Perturbation, LP Shadow Prices, What-If | 09:30 – 10:45 |
| **9** | [Anti-Collusion & Bid-Rigging Engine](#chapter-9-bid-anomaly--anti-collusion-detection-anti-rigging) | Page 14 (Bid Anomaly) | Calibrated XGBoost rare-event classifier, Cover-bidding isolation | 10:45 – 12:15 |
| **10** | [BIMCO Charterparty Studio & CVC Audit](#chapter-10-bimco-legal-charterparty-drafting--cvc-compliance-studio) | Page 15 (Charterparty Studio) | GENCON 1994, NYPE 2015, 7 Sovereign Riders, Foreign trap audit | 12:15 – 13:30 |
| **11** | [154-Test Verification & Grand Finale](#chapter-11-full-project-test-verification--concluding-pitch) | Terminal & Command Palette | 154 Passing Pytest Tests, Keyboard shortcuts, Sovereign impact | 13:30 – 14:15 |

---

## Detailed Step-by-Step Script & Side-by-Side Directions

```
================================================================================
CHAPTER 1: EXECUTIVE HOOK, PROBLEM STATEMENT & COMMAND CENTER
Page: 1. Executive Overview (overview)
Duration: 00:00 – 01:15 (75 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. Start screen recording on the browser window at `http://localhost:5173`.
2. Ensure the top navigation bar shows **Sovereign Freight Chartering & Decision Support System (SIH 2026 · PS 26006)**.
3. Click the **Language Toggle** in the top header (`English` $\rightarrow$ `हिंदी`) to demonstrate instant bilingual reactive internationalization. Toggle back to `English`.
4. Point cursor at the **Live Telemetry Banner**: show the 5 active corridors (Australia $\rightarrow$ Dhamra, Indonesia $\rightarrow$ Paradip, etc.) with real-time freight rates and Baltic Dry Index (BDI) quotes.
5. Scroll smoothly down the **Executive Overview** page:
   - Highlight the 4 top KPI cards: *Annual Tonnage Monitored (12.4M MT)*, *Average Cost per MT (\$18.40)*, *Demurrage Savings (\$2.8M)*, *CVC Audit Status (100% Verified)*.
   - Hover over the **Monthly Freight Volatility Trend** chart to reveal interactive SVG tooltips.
   - Hover over the **Strategic Allocation Breakdown** donut chart (Spot vs COA vs Period).

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Welcome to the live operational demonstration of the Sovereign Freight Chartering and Decision Support System—developed for Smart India Hackathon Problem Statement 26006.*
>
> *Indian Public Sector Undertakings like Coal India, NTPC, and SAIL import over 150 million metric tons of bulk commodities annually. Yet, commercial teams face extreme spot rate volatility, physical port congestion bottlenecks, broker cartelization, and intense post-procurement vigilance scrutiny under CVC and CAG guidelines.*
>
> *We have engineered an enterprise-grade, sovereign operating console spanning 5 Governance Pillars and 15 dedicated operational pages. Designed in strict compliance with the Guidelines for Indian Government Websites (GIGW), our platform features high-contrast accessibility, zero external CSS framework bloat, and instantaneous bilingual switching between English and Hindi.*
>
> *As you can see on our Executive Command Center, live market telemetry, vessel fixtures, and financial savings are aggregated in real time. Let us dive directly into Pillar 1 to see our predictive machine learning in action."*

### On-Screen Callout Badges:
- `GIGW Compliant UI (Vanilla CSS & Accessibility)`
- `Live PSU Telemetry · CIL / NTPC Import Corridors`

---

```
================================================================================
CHAPTER 2: PREDICTIVE FORECASTING & EXPLAINABLE AI
Pages: 2. Forecast & SHAP (forecast) & 3. Freight Opportunity (opportunity)
Duration: 01:15 – 02:45 (90 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the left navigation sidebar under **Pillar 1: Economics & Forecasting**, click **Forecast & SHAP**.
2. On the **Forecast & SHAP** page:
   - In the Route Selector, choose Origin: `Australia (Gladstone)` and Destination: `Dhamra (DPCL)`.
   - Set Vessel Class: `Panamax (75,000 MT)`.
   - Click the blue **"Run Multi-Horizon Forecast"** button.
   - Point cursor to the returned **Quantile Forward Curve** graph: highlight the shaded uncertainty envelope showing **P10 (Bearish lower bound)**, **P50 (Median fair value)**, and **P90 (Bullish upper bound)** across 7d, 15d, 30d, 45d, 60d, and 90d horizons.
   - Scroll down to the **SHAP Feature Attribution Waterfall**: hover over the top positive drivers (`BDI Momentum`, `VLSFO Bunker Cost`) and top negative drivers (`Fleet Ballast Supply`).
3. Now open the **What-If Econometric Sensitivity Sandbox** below the forecast:
   - Drag the **Bunker Fuel Price Shift** slider from `0%` to `+20%`.
   - Click **"Simulate Shock"**.
   - Watch the 30-day forecast curve shift upwards dynamically, showing the exact $\Delta$ in USD/MT.
4. Click **Freight Opportunity** in the sidebar:
   - Select horizon: `30 Days`.
   - Click **Evaluate Window**.
   - Show the resulting **FOS Score (78/100)** and the clear green recommendation badge: `CONSIDER_FIXING_NOW`.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Here on the Forecast & SHAP page, we run our pre-trained `xgb_panamax_freight_v7` gradient boosted model. Unlike naive black-box tools, our engine outputs mathematically rigorous quantile bands: P10, P50, and P90.*
>
> *Notice that for the Gladstone to Dhamra corridor, the 30-day P50 forecast is \$18.20 per metric ton with a tight confidence interval. Below the curve, our integrated SHAP TreeExplainer breaks down the exact econometric forces driving this number—proving to vigilance officers that the prediction is rooted in Baltic Dry Index momentum and Singapore VLSFO bunker prices rather than arbitrary heuristics.*
>
> *Watch this: when we simulate a sudden 20% spike in bunker prices using our What-If Econometric Sandbox, the forward curve updates instantaneously, demonstrating dynamic shock propagation.*
>
> *Moving to the Freight Opportunity page, our FOS algorithm synthesizes rate momentum, port queue predictions, and forward seasonality into a single actionable score: 78 out of 100, advising procurement officers to fix tonnage today before expected monsoon disruptions."*

### On-Screen Callout Badges:
- `Model: xgb_panamax_freight_v7 (Quantile XGBoost)`
- `Explainability: SHAP TreeExplainer Feature Attribution`
- `Mathematical Rule: P10 <= P50 <= P90 Monotonicity Verified`

---

```
================================================================================
CHAPTER 3: MATHEMATICAL PORTFOLIO OPTIMIZATION & MACROECONOMICS
Pages: 4. Portfolio Optimizer (charter) & 5. Policy & Economics (scenarios)
Duration: 02:45 – 04:00 (75 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 1**, click **Portfolio Optimizer**.
2. On the **Portfolio Optimizer** page:
   - Enter Total Cargo Quantity: `480,000 MT`.
   - Set Maximum Single Instrument Cap slider to `50%`.
   - Select Origin: `Gladstone` and Destination: `Dhamra`.
   - Click the green **"Optimize Charter Mix"** button.
   - Point cursor to the generated results:
     - Show the **Recommended Mix**: *COA: 50.0%*, *Spot: 33.3%*, *Period: 16.7%*.
     - Highlight that the mix percentages sum to **exactly 100.0%**.
     - Point out the **Optimized Cost vs. Naive Baseline** comparison card, showing a net public procurement savings of **\$420,000**.
3. In the sidebar, click **Policy & Economics**:
   - In the **TCE & Emissions Calculator**, enter Voyage Distance: `4,200 NM`, Vessel Speed: `12.5 knots`, Fuel Consumption: `28 MT/day`, Bunker Price: `\$620/MT`.
   - Click **"Calculate Voyage Economics"**.
   - Show the resulting **Time Charter Equivalent (TCE)**: `\$18,450 / day`.
   - Highlight the **IMO Carbon Intensity Indicator (CII)** rating: `Grade C (Compliant)` with exact grams $\text{CO}_2/\text{MT}\cdot\text{NM}$.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Public procurement cannot rely on intuition to decide between Spot fixtures, Contracts of Affreightment (COA), or Period time charters. That is why on Page 4, we embed the HiGHS Linear Programming optimization solver.*
>
> *When we ask the solver to allocate 480,000 metric tons under a 50% single-instrument risk cap, HiGHS solves the multi-period constraint matrix in milliseconds. It prescribes an optimal portfolio of 50% COA, 33.3% Spot, and 16.7% Period, reducing projected expenditure by \$420,000 compared to spot-only procurement.*
>
> *On Page 5, our Policy & Economics studio calculates the exact Time Charter Equivalent (TCE) in dollars per day and validates the vessel's IMO Carbon Intensity Indicator (CII). This ensures Indian public cargo moves strictly aboard carbon-compliant tonnage in line with international environmental mandates."*

### On-Screen Callout Badges:
- `Solver: SciPy HiGHS Linear Programming (LP)`
- `Maritime Economics: TCE $/day & IMO Carbon Intensity Indicator (CII)`

---

```
================================================================================
CHAPTER 4: GEOSPATIAL TRACKING & MULTI-DIMENSIONAL RISK INTELLIGENCE
Pages: 6. Maritime GIS (map) & 7. Risk Intelligence (risk)
Duration: 04:00 – 05:15 (75 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 2: Maritime GIS & Risk**, click **Maritime GIS**.
2. On the **Maritime GIS** page:
   - The interactive Leaflet global maritime map renders with dark-navy styling.
   - Point cursor to the navigational tracks connecting Australia, Indonesia, and Mozambique to India's East and West coasts.
   - Click on the **Chokepoint Toggle**: activate the **Malacca Strait** and **Bab-el-Mandeb** geopolitical risk circles.
   - Click on an active bulk carrier vessel icon (`M/V MAHA ANAND` off the Bay of Bengal): show the pop-up drawer detailing vessel IMO, flag, current speed (12.2 knots), loaded draft (14.2m), and ETA at Paradip.
3. In the sidebar, click **Risk Intelligence**:
   - In the Corridor Risk Matrix, select `Australia to Haldia (Panamax)`.
   - Point cursor to the **6-Pillar Risk Radar**: highlight *Market Risk (65)*, *Port Congestion Risk (82)*, *Weather Risk (45)*, *Geopolitical Risk (20)*, *Vessel Supply Risk (55)*, and *Contract Risk (30)*.
   - Show the **Monte Carlo 95% Value at Risk (VaR)** card: display the potential tail exposure: `\$1.42M`.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Under Pillar 2, we integrate real-time geospatial awareness with multi-dimensional risk intelligence. Our Maritime GIS interface tracks bulk vessel movements across major international shipping lanes, highlighting geopolitical chokepoints like the Malacca Strait and the Red Sea.*
>
> *Clicking on any vessel reveals live AIS telemetry, speed, draft, and cargo status.*
>
> *On Page 7, our Risk Intelligence engine evaluates maritime fixtures across 6 distinct pillars: Market, Port, Weather, Geopolitical, Supply, and Contractual exposure. For high-risk routes, such as Haldia during monsoon season, our Monte Carlo simulator executes 10,000 iterations to quantify the 95% Value at Risk (VaR), enabling charterers to budget contingency reserves before issuing tenders."*

### On-Screen Callout Badges:
- `GIS: Global AIS Maritime Telemetry & Chokepoint Overlays`
- `Risk Engine: 6 Sovereign Risk Pillars & Monte Carlo 95% VaR`

---

```
================================================================================
CHAPTER 5: PORT MARINE ENGINEERING PHYSICS & VESSEL INTELLIGENCE
Pages: 8. Port Operations (ports) & 9. Vessel Intelligence (vessels)
Duration: 05:15 – 06:45 (90 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 4: Port & Vessel Operations**, click **Port Operations**.
2. On the **Port Operations** page:
   - Point cursor to the Port Dropdown: scroll through to show **all 16 Indian Ports** (12 Major Port Authorities including Paradip, Visakhapatnam, Kolkata/Haldia, Mumbai Port, Kandla, Chennai, Cochin + 4 premier private terminals like Dhamra and Krishnapatnam).
   - **Physics Rejection Test**:
     - Select Port: `Haldia Dock Complex (SMP Kolkata)`.
     - Select Vessel Class: `Capesize (17.8m Draft, 150,000 MT)`.
     - Click **"Check Port Compatibility"**.
     - Point cursor to the bold red alert: **`FEASIBILITY: REJECTED`**. Show the constraint checklist: `Draft Constraint: FAILED (Vessel draft 17.8m exceeds Haldia maximum permissible draft of 11.5m)`.
   - **Physics Acceptance Test**:
     - Select Port: `Dhamra (DPCL)`.
     - Select Vessel Class: `Panamax (14.2m Draft, 80,000 MT)`.
     - Click **"Check Port Compatibility"**.
     - Point cursor to the green badge: **`FEASIBILITY: APPROVED`**. Show that Dhamra's 18.0m deep-water berth accommodates the vessel with zero draft violations.
   - Point out the **Dual-Engine Routing Indicator**: Dhamra displays `Model: congestion_sih_v1 (XGBoost ML)`, while selecting Chennai or Mumbai Port displays `Model: port_authority_operational_baseline`, proving zero out-of-vocabulary crashes.
3. In the sidebar, click **Vessel Intelligence**:
   - Filter by destination: `Dhamra`, Panamax class.
   - Show candidate vessels vetted with **RightShip Safety Stars (4/5 or 5/5)**.
   - Highlight the **DG Shipping Order 06/2023 Age Vetting rule**: all recommended vessels are strictly under 20 years of age.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"A frequent failure point in chartering is fixing a ship that cannot physically dock at the discharge port. On Page 8, we have encoded the real marine engineering limits of all 12 Major Port Authorities of India governed by the Major Port Authorities Act 2021, plus 4 premier bulk terminals.*
>
> *Watch what happens when we attempt to send a Capesize bulk carrier with a 17.8-meter draft to Haldia: the system immediately rejects the fixture because Haldia is a shallow riverine dock with an 11.5-meter draft ceiling. Switching to deep-water Dhamra with an 18-meter draft immediately yields green approval.*
>
> *Crucially, our dual-engine architecture routes core ports through our trained `congestion_sih_v1` XGBoost model, while newly expanded major ports fall back seamlessly to Port Authority operational baselines—guaranteeing 100% uptime with zero unhandled exceptions.*
>
> *On Page 9, our Vessel Intelligence engine screens candidates against RightShip safety ratings, international P&I club memberships, and statutory DG Shipping age restrictions."*

### On-Screen Callout Badges:
- `Coverage: All 12 Major Indian Ports + 4 Private Terminals (16 Ports Total)`
- `Marine Engineering: Draft, LOA, Beam, and DWT Physics Enforced`
- `Dual-Engine Architecture: Core ML + Port Authority Operational Baseline`

---

```
================================================================================
CHAPTER 6: CVC TWO-OFFICER GOVERNANCE & BLOCKCHAIN MERKLE ANCHORING
Page: 10. CVC Governance (governance)
Duration: 06:45 – 08:15 (90 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 3: Governance & Assurance**, click **CVC Governance**.
2. On the **CVC Governance** page:
   - Point cursor to the **Dual-Officer Authorization Workflow (Maker-Checker)** card.
   - Click **"Create Tender Decision Draft"**: enter Cargo: `75,000 MT Coking Coal`, Route: `Gladstone to Paradip`, Approved Rate: `\$18.20/MT`. Click **"Save Draft"**.
   - Show the state transition: status moves to `SUBMITTED_FOR_REVIEW`.
   - As Officer 1 (Commercial Officer), enter remarks *"Rate validated against 30d P50 forecast"*, and click **"Sign & Prepare"**.
   - Switch role to Officer 2 (Vigilance Reviewer), enter remarks *"Complies with GFR Rule 144. Approved"*, and click **"Authorize Decision"**.
   - Show the final state: `APPROVED`.
3. Point cursor down to the **Cryptographic Decision Hash Chain**:
   - Show the sequence of events with **SHA-256 Current Hashes** and **Previous Hashes**, demonstrating a tamper-evident hash chain.
4. Point cursor to the **Blockchain Anchoring Console (Polygon Amoy Testnet)**:
   - Point out the badge: `Status: 1 Unanchored Decision Event`.
   - Click the blue **"Anchor Now"** button.
   - Watch the live loading state as the backend extracts leaves, computes the 32-byte Merkle root, and signs the 0-value transaction.
   - Show the confirmation banner: **`ANCHORED ON POLYGON AMOY`**.
   - Point out the **Transaction Hash** (`0x...`) and the **32-Byte Merkle Root**.
   - Click the **"View On-Chain (PolygonScan)"** link: show the external block explorer confirming the immutable public timestamp.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Pillar 3 provides our defining sovereign feature: Central Vigilance Commission Maker-Checker compliance backed by public blockchain anchoring.*
>
> *Under GFR 2017 Rule 144, no single commercial manager can approve a multi-million-dollar charter. Here, Officer 1 creates and signs the charter draft, while Officer 2—the Vigilance Officer—audits and authorizes the decision.*
>
> *Every single state transition is cryptographically chained using SHA-256 hashes linking back to the genesis event. Even if a rogue database administrator alters the rate in local SQLite storage, the hash chain breaks instantly.*
>
> *To eliminate any internal tampering risk, watch as we click 'Anchor Now'. Our backend dynamically aggregates all unanchored decisions into a 32-byte Merkle root and broadcasts a zero-value transaction onto the Polygon Amoy blockchain. Clicking 'View on-chain' reveals the exact transaction on PolygonScan. We have permanently anchored our public procurement audit trail onto an immutable global ledger."*

### On-Screen Callout Badges:
- `Governance: Dual-Officer CVC Maker-Checker Authorization`
- `DLT: Deterministic 32-Byte Merkle Tree Aggregation`
- `Public Verification: Live On-Chain Timestamp on Polygon Amoy (Chain ID 80002)`

---

```
================================================================================
CHAPTER 7: ISO 8000 DATA QUALITY & MODEL GOVERNANCE REGISTRY
Pages: 11. Data Quality ISO 8000 (quality) & 12. Model Registry (models)
Duration: 08:15 – 09:30 (75 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 3**, click **Data Quality ISO 8000**.
2. On the **Data Quality** page:
   - Point cursor to the **ISO 8000 6-Dimension Health Card**: show the scores for *Completeness (99.8%)*, *Uniqueness (100%)*, *Timeliness (98.5%)*, *Validity (100%)*, *Accuracy (99.2%)*, and *Consistency (99.0%)*.
   - Point cursor to the **Dataset Health Monitoring Table**: highlight the 8 monitored datasets (`model_data.csv`, `port_constraints.csv`, `vessel_intelligence_daily.csv`, etc.) all displaying green `HEALTHY` badges with 0.0% missing cells.
   - Scroll down to the **Statistical Model Drift Monitor**:
     - Point out the **Two-Sample Kolmogorov-Smirnov (KS) Test** and **Population Stability Index (PSI = 0.042)**.
     - Show the badge: `Status: NO DRIFT DETECTED (Data distribution within safe baseline)`.
3. In the sidebar, click **Model Registry**:
   - Point cursor to the list of active models: `xgb_panamax_freight_v7`, `congestion_sih_v1`, `bid_anomaly_detection_v1`, `vessel_intelligence_v2`.
   - Click on `xgb_panamax_freight_v7` to open the modal: show the training date, dataset hash, Git commit hash, and validation RMSE.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"CAG audits frequently question the data provenance feeding AI models. On Page 11, we implement automated ISO 8000 data quality monitoring across all 8 internal data pipelines.*
>
> *Our system continuously audits completeness, uniqueness, and validity. More importantly, we run live Kolmogorov-Smirnov two-sample tests and Population Stability Index (PSI) calculations to detect feature drift in freight rates and bunker costs before model accuracy can degrade.*
>
> *On Page 12, our Model Registry maintains full MLOps governance, recording exact training dates, feature schemas, hyperparameters, and cryptographic dataset hashes for every model running in production."*

### On-Screen Callout Badges:
- `Standard: ISO 8000 Data Quality 6-Dimension Compliance`
- `Monitoring: Kolmogorov-Smirnov (KS) & PSI Statistical Drift Detection`
- `Governance: Full MLOps Model Versioning Registry`

---

```
================================================================================
CHAPTER 8: LAYER 6 COUNTERFACTUAL EXPLANATIONS & ALGORITHMIC SENSITIVITY
Page: 13. Counterfactuals Layer 6 (counterfactual)
Duration: 09:30 – 10:45 (75 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 3**, click **Counterfactuals Layer 6**.
2. On the **Counterfactuals** page:
   - In the Route Selector, select a high-risk corridor: Origin: `Russia (Baltic)` to Destination: `Paradip (Panamax)`.
   - Point cursor to the baseline composite risk score: `UNVIABLE / CRITICAL (Risk Score: 78/100)`.
   - Click the purple **"Run Systematic Counterfactual Search"** button.
   - Point cursor to the **Counterfactual Recommendation Card**:
     - Highlight the minimum actionable perturbation: *"Mitigating Geopolitical Risk from 85 to 40 (via non-sanctioned transit insurance) drops overall route risk by 22.4 points and flips the decision to FEASIBLE."*
   - Scroll down to the **Linear Programming Shadow Price Sensitivity Table**:
     - Show the sensitivity coefficients: *"Reducing discharge port queue delay by 3 days yields an immediate cost savings of \$360,000."*
   - Drag the **Interactive Congestion Perturbation Slider** from 7 days down to 4 days: watch the optimized charter cost curve drop in real time.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Predicting that a route is risky is only half the battle. Decision-makers need to know: 'What is the minimum operational change required to make this fixture viable?'*
>
> *That is the breakthrough of Layer 6: Counterfactual Explanations and Algorithmic Sensitivity. When we select a high-risk Russia to Paradip corridor with a critical risk score of 78, our perturbation search algorithm analyzes all 6 risk dimensions.*
>
> *In less than a second, it identifies the single highest-leverage intervention: securing compliant, non-sanctioned insurance drops geopolitical risk by 45 points, immediately flipping the route from unviable to approved.*
>
> *Below, our HiGHS linear programming shadow prices reveal exact monetary sensitivities: mitigating port waiting time by just 3 days directly saves the public exchequer \$360,000 in demurrage."*

### On-Screen Callout Badges:
- `Innovation: Layer 6 Algorithmic Counterfactual Search`
- `Decision Science: Minimum Perturbation to Flip Decisions`
- `Economics: HiGHS LP Shadow Price Demurrage Sensitivity`

---

```
================================================================================
CHAPTER 9: BID ANOMALY & ANTI-COLLUSION DETECTION (ANTI-RIGGING)
Page: 14. Bid Anomaly & Collusion (collusion)
Duration: 10:45 – 12:15 (90 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 3**, click **Bid Anomaly & Collusion**.
2. On the **Bid Anomaly & Collusion** page:
   - Point cursor to the Tender Dropdown: select Tender `TND-2023-0019` (Coal India Coking Coal Import Tender).
   - Point cursor to the **Broker Submissions Table**:
     - Highlight the winning bidder (`BRK-HONEST-01`) quoted at `\$18.20/MT` (P50 fair value is `\$18.20/MT`), showing a clean green badge: `NORMAL (Probability: 4.2%)`.
     - Highlight the suspicious bidders (`BRK-CARTEL-04` and `BRK-CARTEL-09`): quoted at `\$35.50/MT` and `\$36.00/MT` with flashing red badges: **`FLAGGED COVER BID (Probability: 99.8%)`**.
   - Click the **"Explain with SHAP"** button next to the flagged broker:
     - The **SHAP TreeExplainer Waterfall Drawer** slides open.
     - Point cursor to the top red bars: *Positive Deviation from Fair Value (+5.59 log-odds)* and *Artificial Cartel Bid Spread (+1.55 log-odds)*.
     - Point out the natural language audit narrative: *"Broker submitted a cover bid 95% above fair value to protect a designated winner under cartel collusion pattern."*
   - Scroll down to the **Interactive Bid Simulator**:
     - Set Quoted Freight to `\$18.20`: show anomaly probability is `5.1% (Clean)`.
     - Slide Quoted Freight up to `\$34.00`: show anomaly probability immediately jump to `98.6% (Flagged)`.
   - Point cursor to the **Model Benchmark Card**:
     - Highlight that our calibrated XGBoost model eliminates **73.4% of false alarms** compared to naive percentage band-breach rules.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"Public procurement tenders frequently fall victim to broker cartels practicing 'cover bidding'—submitting deliberately inflated bids to simulate fake competition while protecting a collusive winner.*
>
> *Page 14 houses our Anti-Rigging Engine, powered by `bid_anomaly_detection_v1`. Inspecting Coal India Tender 2023-0019, our model instantly isolates the suspicious cover bids, highlighting them in red with a 99.8% anomaly probability.*
>
> *Clicking 'Explain with SHAP' opens the exact mathematical breakdown from our XGBoost TreeExplainer. It proves to the vigilance committee that the bid was flagged due to an uncompetitive 95% premium over P50 fair value combined with an artificial bid spread.*
>
> *Using our Interactive Bid Simulator, evaluators can test custom quotes in real time. Most impressively, our benchmark proves that machine learning eliminates 73.4% of the false positives generated by legacy rule-of-thumb thresholds, saving hundreds of hours of manual audit review."*

### On-Screen Callout Badges:
- `Model: bid_anomaly_detection_v1 (Calibrated XGBoost Classifier)`
- `Anti-Rigging: Cover Bidding & Cartel Detection`
- `Explainability: SHAP TreeExplainer Log-Odds Contributions`
- `Efficiency: 73.4% False Alarm Reduction vs Naive Rules`

---

```
================================================================================
CHAPTER 10: BIMCO LEGAL CHARTERPARTY DRAFTING & CVC COMPLIANCE STUDIO
Page: 15. Charterparty Studio (contract)
Duration: 12:15 – 13:30 (75 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the sidebar under **Pillar 3**, click **Charterparty Studio**.
2. On the **Charterparty Studio** page:
   - In the **Procurement Presets**, click **"Coal India Limited (CIL)"**:
     - Notice that all Part I Box parameters (Contract Number, Charterer, Loading Port Gladstone, Discharging Port Paradip, Freight Rate \$18.20/MT, Laytime 96 hours) auto-populate instantly.
   - Point cursor to the **7 Sovereign Protective Riders Switchboard**:
     - Show that *BIMCO CONWARTIME 2004*, *Piracy Clause 2013*, and *Bunker Price Escalation* are toggled **ON**.
   - **Foreign Arbitration Trap Test**:
     - In Box 25 (Governing Law & Arbitration), intentionally change the text to: `English Law, LMAA London Arbitration`.
     - Click the red **"Validate Contract"** button.
     - Point cursor to the red **Compliance Alert Card**:
       - Score drops to `55 / 100` (`NON_COMPLIANT`).
       - Failed Checks: *"Foreign arbitration trap detected! Indian Public Procurement mandates Indian Law and ACA 1996 arbitration seated in New Delhi, Mumbai, or Kolkata under CVC / GFR Rule 144."*
   - **Indian Law Compliance Fix**:
     - Change Box 25 back to: `Indian Law, Arbitration and Conciliation Act 1996 seated in New Delhi`.
     - Click **"Validate Contract"**.
     - Show the compliance score surge to **`100 / 100 (COMPLIANT)`** with 0 failed checks.
   - Click the **"Generate BIMCO Agreement"** button:
     - The **Live Document Viewer** renders the complete legally compiled contract with **Part I Box Layout**, **Part II Standard Clauses**, and **Part III Indian Protective Riders**.
     - Click **"Export Contract (.md)"** to show instant document download.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"After rates are fixed and tenders cleared, commercial teams must draft the binding maritime charterparty. Historically, foreign shipowners slip foreign arbitration clauses—such as London LMAA arbitration under English law—into the agreement, exposing Indian PSUs to costly overseas litigation in violation of CVC guidelines.*
>
> *Page 15 is our automated BIMCO Charterparty Studio. Selecting our Coal India preset automatically populates standard GENCON 1994 and NYPE 2015 box terms alongside 7 sovereign protective riders, including war-risk rerouting and fuel price escalation.*
>
> *Watch what happens when a foreign broker attempts to insert London arbitration: our CVC GFR Rule 144 validator instantly triggers a non-compliance alert, blocking the contract and mandating an Indian arbitration seat under the Arbitration and Conciliation Act 1996.*
>
> *Correcting the jurisdiction immediately brings the contract to 100% compliance, compiling a publication-grade legal document ready for execution."*

### On-Screen Callout Badges:
- `Standard: BIMCO GENCON 1994 (Voyage) & NYPE 2015 (Time Charter)`
- `Legal Protection: 7 Sovereign Protective Maritime Riders`
- `Auditor: CVC & GFR 2017 Rule 144 Indian Arbitration Enforcement`

---

```
================================================================================
CHAPTER 11: FULL PROJECT TEST VERIFICATION & CONCLUDING PITCH
Duration: 13:30 – 14:15 (45 seconds)
================================================================================
```

### Screen Actions (Right Screen):
1. In the browser, press `Ctrl + K` (or `Cmd + K`) to launch the **Universal Command Palette**:
   - Type `"collusion"` and press `Enter` to show instant keyboard navigation.
   - Press `Ctrl + K` again, type `"blockchain"` to jump back to CVC Governance.
2. Switch briefly to the split terminal window running in the root directory:
   - Run the full regression test command:
     ```powershell
     .venv\Scripts\python -m pytest tests -v
     ```
   - Highlight the terminal output as the suite completes:
     ```
     ====================== 154 passed, 29 warnings in 26.01s ======================
     ```
3. Return to the browser window showing the high-contrast dashboard with the Indian emblem and platform header.

### Spoken Narration (Left Screen / Audio Voiceover):
> *"To prove that this entire platform is a fully functional, mathematically sound reality rather than an interactive prototype, we execute our comprehensive test suite directly in the terminal.*
>
> *Across multi-horizon quantile forecasting, HiGHS linear programming, 16-port marine physics, CVC GFR Rule 144 legal audits, and Polygon blockchain Merkle trees—every single test passes with 100% success rate: 154 passed in 26 seconds with zero failures.*
>
> *By uniting predictive machine learning, legal automation, anti-collusion intelligence, and cryptographic transparency, our Sovereign Freight Chartering System delivers multimillion-dollar annual savings while safeguarding national public procurement integrity.*
>
> *Thank you for watching our live demonstration."*

### On-Screen Callout Badges:
- `Test Proof: 154 / 154 Pytest Tests Passing (100% Success Rate)`
- `National Impact: Sovereign Decision Intelligence for Indian Maritime PSUs`

---

## Technical Recording & Production Checklist

1. **Local Servers Active**:
   - Backend running on `http://127.0.0.1:8000` (`python -m uvicorn backend.app.main:app --port 8000`).
   - Frontend running on `http://localhost:5173` (`npm run dev`).
2. **Display Settings**:
   - Browser zoom set to 100% (or 90% if recording at 1080p for maximum data density).
   - Chrome/Brave bookmarks bar hidden (`Ctrl + Shift + B`).
3. **Cursor Settings**:
   - Enable mouse click highlighter / spotlight circles in OBS Studio or Screenflow so evaluators can follow every click easily.
4. **Audio Settings**:
   - High-fidelity microphone with noise suppression filter active.
