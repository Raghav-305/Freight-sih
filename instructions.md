# Comprehensive Platform Manual & Standard Operating Procedures (SOP)
## Sovereign Freight Chartering & Decision Support System (SIH 2026 · PS 26006)

---

## 1. Executive System Overview

The **Sovereign Freight Chartering & Decision Support System** is an end-to-end, enterprise-grade decision intelligence and regulatory compliance platform engineered specifically for Indian Public Sector Undertakings (PSUs)—including **Coal India Limited (CIL), NTPC, SAIL, TANGEDCO, and the Ministry of Ports, Shipping and Waterways (MoPSW)**.

Maritime freight chartering for bulk commodities (coking coal, thermal coal, iron ore, and limestone) involves multimillion-dollar public procurement tenders. In traditional workflows, chartering decisions face significant operational risks:
1. **Volatile Spot Freight Markets**: Unhedged spot chartering can lead to massive cost overruns when the Baltic Dry Index (BDI) or bunker fuel prices surge.
2. **Physical Port Mismatches**: Chartering vessels that breach port draft, beam, or LOA limits leads to costly deadfreight, off-berth lighterage, or maritime demurrage penalties.
3. **Rigged & Collusive Tenders**: Cartels of shipping brokers coordinate "cover bidding" or rotational allocations to extract inflated public funds.
4. **Vigilance & Audit Scrutiny**: Decisions are retrospectively scrutinized by the **Central Vigilance Commission (CVC)**, the **Comptroller and Auditor General (CAG)**, and the **Competition Commission of India (CCI)** under General Financial Rules (GFR 2017 Rule 144).

This platform synthesizes **predictive machine learning (XGBoost/LightGBM)**, **linear programming optimization (HiGHS)**, **explainable AI (SHAP TreeExplainer)**, **cryptographic hash chaining (SHA-256)**, and **public blockchain anchoring (Polygon Amoy)** into a single unified operating console.

---

## 2. Technical Stack, Skills & Domain Competencies

### 2.1 Software & Infrastructure Architecture
- **Frontend Core**: React 18, TypeScript (Strict Mode), Vite 5. Single Page Application (SPA) with zero external CSS frameworks (strictly Vanilla CSS using GIGW-compliant tokens).
- **Design System & Accessibility**: Indian Sovereign Government Design System compliant with GIGW (Guidelines for Indian Government Websites). High-contrast palette (`--paper: #F7F4EC`, `--ink: #161616`, `--khaki-500: #7c6d48`, `--olive: #166534`, `--brick: #991b1b`). Zero unstyled dark-mode bleed, full keyboard navigation, screen-reader semantic landmarks (`main`, `nav`, `aside`, `section`), and WCAG 2.1 AAA contrast.
- **Backend Core**: Python 3.11+, FastAPI (Asynchronous REST API), Pydantic v2 (Strict Data Validation & Contracts), Uvicorn ASGI server.
- **Data Persistence**: SQLite 3 with WAL (Write-Ahead Logging) mode, SQLAlchemy 2.0 ORM, Alembic migrations schema, thread-safe session pooling.
- **Document Generation**: ReportLab (High-fidelity, printable 10-page CVC Compliance PDF Dossiers with cryptographic QR codes), openpyxl (Multi-tab CAG Audit Evidence Excel workbooks).
- **Internationalization (i18n)**: Native bilingual support (English & Hindi / हिंदी) with runtime reactive locale switching across all navigation, KPI labels, and tooltips.

### 2.2 Machine Learning & Mathematical Optimization
- **Predictive Regressors & Classifiers**: XGBoost (`xgboost>=2.0.0`), Scikit-Learn (`scikit-learn>=1.3.0`), Joblib, Pickle.
- **Explainable AI (XAI)**: SHAP (`shap>=0.44.0`) TreeExplainer generating exact log-odds attributions and waterfall breakdowns.
- **Mathematical Optimization**: SciPy `scipy.optimize.linprog` with the **HiGHS dual-simplex and interior-point solver** for multi-period portfolio allocations.
- **Statistical Drift & Quality**: SciPy Stats (Two-sample Kolmogorov-Smirnov test), Population Stability Index (PSI) computation, ISO 8000 6-dimension data quality scoring.

### 2.3 Cryptography & Distributed Ledger Technology (DLT)
- **Hash-Chained Audit Ledger**: Cryptographic SHA-256 sequential block hashing linking every decision state transition (`CREATED` $\rightarrow$ `ANALYSED` $\rightarrow$ `SUBMITTED_FOR_REVIEW` $\rightarrow$ `APPROVED`).
- **Binary Merkle Tree Aggregation**: Pairwise leaf hashing aggregating unanchored decision batches into a deterministic 32-byte Merkle root.
- **Public Blockchain Anchoring**: `web3.py` integration with the **Polygon Amoy Testnet (Chain ID 80002)**. Dispatches 0-value cryptographic anchor transactions with Merkle roots embedded in transaction calldata (`0x...`). Offline-first failover with local mock simulation when air-gapped.

### 2.4 Maritime & Public Procurement Domain Standards
- **Chartering Contracts**: BIMCO standard charterparty conventions: **GENCON 1994** (Standard Voyage Charterparty with Box Layout Part I, Part II 14 clauses, and Part III Indian PSU protective riders) and **NYPE 2015** (New York Produce Exchange Time Charter with delivery, off-hire, and speed/consumption warranties). Laytime, demurrage, despatch, and NOR (Notice of Readiness) calculations.
- **Protective Maritime Riders**: BIMCO CONWARTIME 2004 (War Risks), BIMCO Piracy Clause 2013, Bunker Price Escalation/De-escalation Clause, IMO Carbon Intensity Indicator (CII) Operations Clause, BIMCO Cyber Security Clause, BIMCO Sanctions Clause, and Force Majeure Port Congestion Relief Clause.
- **Physical Port Marine Engineering**: Full coverage of all **12 Major Port Authorities of India** governed by the *Major Port Authorities Act, 2021* (Paradip, Dhamra, Haldia, Visakhapatnam, Kamarajar/Ennore, Chennai, V.O. Chidambaranar/Tuticorin, Cochin, New Mangalore, Mormugao, Mumbai, Deendayal/Kandla) alongside major private dry-bulk terminals (Gangavaram, Gopalpur, Krishnapatnam, Jaigarh). Physical parameters include maximum LOA, beam, permissible draft, air draft, tidal window requirements, crane discharge rates (TPD), and dual-engine congestion prediction (ML XGBoost for trained ports, Port Authority operational baseline for expanded ports).
- **Vessel Vetting**: RightShip safety scoring methodology, DG Shipping (Directorate General of Shipping) age limits (<20 years for Indian cabotage / public tenders), P&I Club verification (International Group of P&I Clubs).
- **Public Procurement Governance**: Central Vigilance Commission (CVC) Vigilance Manual 2021, General Financial Rules (GFR 2017 Rule 144 & 173), Delegation of Financial Powers (DoFP) Maker-Checker governance, Competition Commission of India (CCI) Section 3 (Cartelization & Bid Rigging), and Arbitration and Conciliation Act 1996 (Indian Jurisdiction).

---

## 3. Comprehensive Page-by-Page Manual (All 15 Pages)

The platform is structured into **5 Governance Pillars** housing **15 dedicated operational pages**:

```
PILLAR 5: COMMAND CENTER
  └── 1. Executive Overview (overview)

PILLAR 1: ECONOMICS & FORECASTING
  ├── 2. Forecast & SHAP (forecast)
  ├── 3. Freight Opportunity (opportunity)
  ├── 4. Portfolio Optimizer (charter)
  └── 5. Policy & Economics (scenarios)

PILLAR 2: MARITIME GIS & RISK
  ├── 6. Maritime GIS (map)
  └── 7. Risk Intelligence (risk)

PILLAR 4: PORT & VESSEL OPERATIONS
  ├── 8. Port Operations (ports)
  └── 9. Vessel Intelligence (vessels)

PILLAR 3: GOVERNANCE & ASSURANCE
  ├── 10. CVC Governance (governance)
  ├── 11. Data Quality ISO 8000 (quality)
  ├── 12. Model Registry (models)
  ├── 13. Counterfactuals Layer 6 (counterfactual)
  ├── 14. Bid Anomaly & Collusion (collusion)
  └── 15. Charterparty Studio (contract)
```

---

### Page 1: Executive Overview (`ExecutiveOverviewPage.tsx`)
- **Pillar**: Pillar 5 — Command Center
- **Tab Key**: `overview`
- **Backend API**: `GET /api/market/context`, `GET /api/market/intelligence`, `GET /api/command-center/summary`
- **Model Used**:
  - `market_intelligence_v1` (Random Forest Classifier + Heuristic Macro Signal Synthesizer)
  - Evaluates BDI momentum, FFA 1-month forward curves, bunker prices, and global fleet supply to classify the market regime into **Bullish**, **Bearish**, or **Neutral**.

#### How It Works:
The Executive Overview serves as the chief chartering officer's mission control. It ingests global freight market data, port congestion updates, and bunker indices, synthesizing them into a high-level strategic posture:
- **Chartering Posture Signal**: Recommends immediate action—`CONSIDER FIXING` (market at bottom / rising), `WAIT & MONITOR` (rates softening / high volatility), or `HEDGE / COA` (structural uncertainty).
- **Macro Economic Barometers**: Displays live Baltic Dry Index (BDI), Panamax 4TC average, Brent Crude / Singapore VLSFO bunker benchmark, and Chinese steel/coking coal demand.
- **14-Step Workflow Progress Counter**: Tracks the user's progress through the end-to-end chartering audit lifecycle.

#### Step-by-Step Operating Instructions:
1. **Define Voyage Parameters**: In the top configuration bar, select the cargo origin (e.g., *Gladstone, Australia* or *Richards Bay, South Africa*), discharge port (e.g., *Paradip* or *Dhamra*), vessel class (*Panamax*, *Capesize*, or *Supramax*), and target fixture date.
2. **Generate Market Intelligence**: Click **"Run Market Intelligence"**. Review the resulting Market Regime badge and 30-day directional probabilities.
3. **Inspect Macro Drivers**: Scroll through the fuel pressure index, forward freight agreement (FFA) contango/backwardation spread, and global fleet supply-demand ratio.
4. **Follow the Workflow**: Click **"Proceed to Rate Forecasting"** or use the step tracker cards to transition into Pillar 1.

#### Glossary of Terms:
- **Baltic Dry Index (BDI)**: The global composite benchmark published by the Baltic Exchange in London tracking the cost of moving raw materials across 20+ maritime routes.
- **Panamax 4TC**: The daily time-charter average earnings ($/day) across four benchmark Panamax routes (Transpacific, Transatlantic, Far East, Continent).
- **FFA (Forward Freight Agreement)**: Cash-settled derivative contracts used by shipowners and charterers to hedge future freight rate fluctuations.
- **Backwardation**: A market condition where current spot freight rates are higher than forward contract prices, indicating expected near-term softening.
- **Contango**: A market condition where forward freight rates are higher than spot rates, indicating rising future shipping costs.
- **Chartering Posture**: A non-binding operational recommendation guiding whether a PSU should tender immediately or defer procurement.

---

### Page 2: Freight Forecast & SHAP Explainability (`ForecastPage.tsx`)
- **Pillar**: Pillar 1 — Economics & Forecasting
- **Tab Key**: `forecast`
- **Backend API**: `POST /api/forecast`, `POST /api/forecast/shap`
- **Model Used**:
  - `xgb_panamax_freight_v7` (XGBoost Regressor)
  - Features: 28 macroeconomic, route-distance, bunker fuel (VLSFO), waiting-time, and seasonal features.
  - Explainability: SHAP TreeExplainer computing exact marginal contributions ($/MT) for each feature.
  - Uncertainty Estimation: Conformalized quantile regression generating P10 (optimistic), P50 (expected), and P90 (conservative) freight corridors.

#### How It Works:
Instead of a single "black-box" point prediction, this page generates an auditable, probabilistically bounded freight rate forecast for 30, 60, and 90-day procurement horizons. Every dollar per metric ton ($/MT) quoted is decomposed into its driving variables via SHAP (Shapley Additive exPlanations), showing exactly why the model predicts rates above or below historical baselines.

#### Step-by-Step Operating Instructions:
1. **Set Route Specifications**: Verify origin, discharge port, cargo parcel size (e.g., 75,000 MT), and target laycan window.
2. **Execute Forecast**: Click **"Calculate Freight Forecast"**.
3. **Analyze Confidence Corridor**: Examine the P10, P50, and P90 forecast bands. Use the P50 as the primary budgeting figure; use P90 to set the maximum ceiling price for public tenders.
4. **Inspect SHAP Decision Drivers**: Review the waterfall plot. Factors shaded red pushed the predicted rate upward (e.g., rising bunker prices or port congestion); factors shaded green pushed rates downward (e.g., excess regional vessel supply).
5. **Snapshot for Governance**: Click **"Save Forecast Snapshot"** to automatically bind the prediction, confidence bounds, and SHAP hash to the active procurement decision file.

#### Glossary of Terms:
- **Laycan (Laydays Cancelling)**: The contractually agreed window of dates during which the shipowner must present the vessel at the loading port. If the vessel arrives after the cancelling date, the charterer can cancel the contract.
- **P10 / P50 / P90**: Percentile estimates from probability distributions. P50 represents the median forecast (50% likelihood of being higher or lower). P10 represents the 10th percentile (low-cost scenario), while P90 represents the 90th percentile (risk-adjusted high-cost ceiling).
- **SHAP (Shapley Additive exPlanations)**: A game-theoretic approach that fairly allocates the payout (prediction delta from base value) among all input features.
- **Base Rate (Expected Value $E[f(x)]$ )**: The mean freight rate across the entire historical training dataset before specific route parameters are applied.

---

### Page 3: Freight Opportunity Score (FOS) (`FreightOpportunityPage.tsx`)
- **Pillar**: Pillar 1 — Economics & Forecasting
- **Tab Key**: `opportunity`
- **Backend API**: `GET /api/opportunity/score`, `POST /api/opportunity/evaluate`
- **Model Used**:
  - `fos_v1` (Random Forest Regressor + Multi-Criteria Decision Rule Engine)
  - Scores market timing on a scale from **0 to 100**, where $\ge 70$ indicates a Prime Fixing Opportunity, $40-69$ indicates Neutral/Caution, and $< 40$ indicates Unfavourable/Overheated.

#### How It Works:
Tendering at the wrong time of the monthly or seasonal shipping cycle can cost Indian PSUs millions in inflated freight. The Freight Opportunity Score (FOS) synthesizes freight forward curves, vessel queue trends, seasonal weather windows, and historical rate quantiles into a single numerical index. It tells procurement managers whether today is the optimal time to release a tender.

#### Step-by-Step Operating Instructions:
1. **Select Route & Cargo Category**: Choose the commodity (e.g., *Non-Coking Thermal Coal*) and shipping route.
2. **Review FOS Gauge**: Inspect the composite score (0–100) and recommendation badge:
   - **Strong Buy / Fix Spot**: Spot rates are cyclical lows; initiate immediate spot chartering.
   - **Neutral**: Maintain scheduled procurement cadence.
   - **Delay / COA**: Spot market is overheated; defer spot fixing by 10–14 days or utilize existing long-term COA contracts.
3. **Examine Sub-Indices**: Check the 4 component sub-scores:
   - *Rate Attractiveness Index* (current rate vs 52-week moving average)
   - *Vessel Availability Index* (ballast ships steaming toward loading area)
   - *Bunker Timing Index* (fuel price momentum)
   - *Port Congestion Pressure* (waiting times at Indian discharge terminals)

#### Glossary of Terms:
- **FOS (Freight Opportunity Score)**: A proprietary composite index (0–100) quantifying the commercial favorability of entering the chartering market today.
- **Ballast Voyage**: A voyage where the cargo vessel sails empty of cargo, traveling solely to reposition itself for its next cargo loading.
- **Fixing Window**: The optimal time frame (typically 3 to 10 days) within which charterers should conclude negotiations with shipowners to secure the lowest freight.

---

### Page 4: Multi-Period Portfolio Optimizer (`PortfolioOptimizerPage.tsx`)
- **Pillar**: Pillar 1 — Economics & Forecasting
- **Tab Key**: `charter`
- **Backend API**: `POST /api/charter/optimize`, `GET /api/charter/allocations`
- **Model / Solver Used**:
  - **HiGHS Linear Programming (LP) & Mixed-Integer Linear Programming (MILP)** via `scipy.optimize.linprog`.
  - Objective: Minimize total annual freight expenditure $\sum (C_i \cdot V_i)$ subject to volume fulfillment, budget caps, and risk constraints.
  - Markowitz Modern Portfolio Theory (Mean-Variance frontier) balancing expected freight cost against budget volatility.

#### How It Works:
Indian PSUs cannot fulfill their entire annual coal requirement (e.g., 10 Million Metric Tons) through the volatile spot market without violating CVC risk guidelines, nor can they lock 100% into long-term contracts without overpaying during market downturns. The Portfolio Optimizer determines the mathematically optimal allocation across three primary contracting vehicles:
1. **Spot Voyage Charter**: Single voyages fixed at prevailing market rates (high flexibility, high price volatility).
2. **Contract of Affreightment (COA)**: Multi-voyage agreements covering fixed cargo quantities over 6–12 months at pre-agreed index-linked or fixed rates.
3. **Period Time Charter (1–3 Years)**: Hiring a dedicated vessel for a continuous time period, paying a fixed daily rate ($/day) plus fuel and port expenses.

#### Step-by-Step Operating Instructions:
1. **Input Annual Target Volume**: Enter total coal shipment requirement (e.g., 2,500,000 MT).
2. **Set Risk Tolerance & Bounds**:
   - Minimum Spot % (e.g., 20%)
   - Maximum Spot % (e.g., 50%)
   - Maximum COA Commitment % (e.g., 60%)
   - Volatility Penalty Factor ($\lambda$)
3. **Run Optimization**: Click **"Solve Optimal Allocation"**.
4. **Inspect Allocation Matrix**: View the recommended split (e.g., 35% Spot, 45% COA, 20% Period Time Charter).
5. **Review Financial Metrics**: Compare projected total landed shipping cost vs a pure-spot baseline to verify risk-adjusted cost savings (e.g., projected savings of ₹42.5 Crore).

#### Glossary of Terms:
- **Spot Voyage Charter**: A contract for a single specific voyage from load port to discharge port, with freight paid per metric ton of cargo loaded.
- **COA (Contract of Affreightment)**: A legally binding agreement where a shipowner agrees to transport a specified total quantity of cargo over a designated period using vessels of their fleet, without committing a specific named ship.
- **Period Time Charter**: Hiring a vessel for a specific duration of time (e.g., 12 months). The charterer directs commercial operations and pays for fuel, port dues, and canal tolls, while the owner provides the crew and technical maintenance.
- **Efficient Frontier**: The set of optimal procurement portfolios that offer the lowest cost for a defined level of risk or volatility.

---

### Page 5: Policy & Energy Economics (`PolicyEconomicsPage.tsx`)
- **Pillar**: Pillar 1 — Economics & Forecasting
- **Tab Key**: `scenarios`
- **Backend API**: `POST /api/scenarios/landed-cost`, `GET /api/scenarios/benchmark`
- **Model Used**:
  - Deterministic Macroeconomic Landed-Cost Accounting Engine.
  - Calorific-value parity normalization ($/GCAL and INR/GCAL).
  - Parametric tariff & duty calculation engine (Basic Customs Duty, GST Compensation Cess, Clean Energy Cess, Sagarmala port discount schemes).

#### How It Works:
Power utilities (like NTPC or state electricity boards) cannot evaluate coal tenders on raw FOB (Free On Board) price alone because different coals have radically different energy contents (Gross Calorific Value / GCV). A cheap 3,800 kcal/kg domestic coal may generate electricity at a higher landed cost per megawatt-hour than a 5,500 kcal/kg Australian coal once rail freight, sea freight, customs duties, and boiler efficiencies are factored in.
This page performs energy-normalized economic parity comparisons between:
- **Domestic Coastal Coal**: Rail freight from eastern mines (Mahanadi Coalfields / ECL) to Dhamra/Paradip $\rightarrow$ Coastal coastal shipping to Ennore/Tuticorin $\rightarrow$ Local unloading.
- **Imported Coal**: Seaborne shipping from Australia, Indonesia, South Africa, or Russia.

#### Step-by-Step Operating Instructions:
1. **Configure Coal Source Specs**: Input FOB price ($/MT), Gross Calorific Value (kcal/kg), and source country.
2. **Select Domestic Counterfactual**: Choose the domestic mining subsidiary (e.g., CIL MCL Talcher) and destination thermal power station.
3. **Review Landed Cost Parity**:
   - Inspect raw landed cost in INR/MT and USD/MT.
   - Inspect energy-normalized cost in **₹ per Million Kilocalories (₹/Gcal)**.
4. **Simulate Policy Shocks**: Toggle policy levers such as:
   - National Logistics Policy (NLP) rail freight discount (-15%)
   - Customs duty exemption adjustments
   - Carbon tax / Clean Energy Cess revisions
5. **Verify GFR Rule 144 Justification**: If imported coal is recommended over domestic coal, the system automatically prints an energy-efficiency justification note for public auditor records.

#### Glossary of Terms:
- **GCV (Gross Calorific Value)**: The total amount of heat released by a unit quantity of fuel upon complete combustion (measured in kcal/kg).
- **GCAL (Gigacalorie)**: One billion calories ($10^9$ calories). The standard unit of energy used in Indian power purchase agreements (PPA) to price fuel heat rate.
- **Landed Cost**: The total all-inclusive cost of commodity arrival at the power plant boundary (FOB Price + Ocean Freight + Insurance + Port Handling + Customs Tariff + Inland Rail Transit).
- **Sagarmala Initiative**: Government of India national program to promote coastal shipping and inland waterways, offering prioritized port berthing and tariff discounts for coastal coal movement.

---

### Page 6: Maritime GIS & Chokepoint Intelligence (`MaritimeGisPage.tsx`)
- **Pillar**: Pillar 2 — Maritime GIS & Risk
- **Tab Key**: `map`
- **Backend API**: `GET /api/map/routes`, `GET /api/map/chokepoints`, `GET /api/map/hazards`
- **Model / GIS Engine**:
  - Leaflet.js / React-Leaflet interactive cartographic engine.
  - Geospatial route geometry rendering along Great Circle maritime corridors.
  - Indian Meteorological Department (IMD) cyclone track integration adapter.
  - Geospatial polygon boundary monitoring for maritime chokepoints and High Risk Areas (HRA).

#### How It Works:
Provides an interactive spatial command map visualizing bulk carrier voyages from key international coal terminals (Newcastle, Hay Point, Gladstone, Richards Bay, Tanjung Priok) to Indian ports. The engine overlays real-time and historical risk layers:
- **Strategic Chokepoints**: Monitors vessel flow and potential blockage points through the **Strait of Malacca, Sunda Strait, Bab-el-Mandeb, and Cape of Good Hope**.
- **Maritime Weather Hazards**: Overlays active cyclone tracks, tropical depressions, and gale warnings across the Bay of Bengal and Arabian Sea.
- **Geopolitical Conflict Corridors**: Highlights Maritime Security Centre / UKMTO piracy and missile risk zones (Red Sea / Gulf of Aden), automatically recalculating detour voyaging around the Cape of Good Hope (+12 to 14 days steaming).

#### Step-by-Step Operating Instructions:
1. **Select Voyage Corridor**: Choose an active voyage (e.g., *Newcastle to Visakhapatnam*).
2. **Toggle Map Layers**:
   - Turn on **Chokepoints** to view transit status and maritime bottlenecks.
   - Turn on **Weather / Cyclone Hazard** to visualize IMD weather storm cones.
   - Turn on **PIRACY / Conflict Corridors** to view war risk insurance premium zones.
3. **Inspect Route Metrics**: Hover over waypoint markers to view nautical miles (NM), estimated steaming days at 12.5 knots eco-speed, and total bunker fuel consumption.
4. **Evaluate Alternative Routing**: Click **"Simulate Cape of Good Hope Detour"** to compare Suez/Red Sea transit cost vs extended Cape transit fuel costs.

#### Glossary of Terms:
- **Nautical Mile (NM)**: 1,852 meters. The international unit of distance used in maritime navigation.
- **Chokepoint**: A narrow, strategically significant maritime strait through which international trade flows (e.g., Malacca Strait handles over 60% of India's seaborne coal imports).
- **Great Circle Distance**: The shortest distance between two points on the surface of a sphere, representing the true shortest sailing path across the ocean.
- **War Risk Premium**: An additional insurance surcharge levied by marine underwriters (Lloyd's JWC) on vessels transiting declared geopolitical conflict areas.

---

### Page 7: Multi-Dimensional Risk Intelligence (`RiskIntelligencePage.tsx`)
- **Pillar**: Pillar 2 — Maritime GIS & Risk
- **Tab Key**: `risk`
- **Backend API**: `POST /api/risk/assess`, `GET /api/risk/benchmarks`
- **Model / Engine**:
  - Composite Multi-Attribute Risk Scoring Engine (weighted 6-dimension risk framework).
  - Monte Carlo Simulation (10,000 iterations) computing **Value-at-Risk (VaR 95%, 99%)** and **Conditional Value-at-Risk (CVaR / Expected Shortfall)** for charter financial liabilities.

#### How It Works:
Chartering risks extend far beyond spot price volatility. A voyage can experience catastrophic delays due to monsoonal storms, vessel breakdown, port strikes, or broker default. This page quantifies risk across 6 critical dimensions:
1. *Geopolitical & Chokepoint Risk* (war risk, canal closures, maritime sanctions).
2. *Meteorological / Cyclone Risk* (tropical depressions, wave height > 4.5m, wind speed > 35 knots).
3. *Port Congestion & Draft Risk* (berth queues, tidal draft delays, seasonal dredging backlogs).
4. *Bunker Volatility Risk* (fuel price sensitivity, spread between VLSFO and LSMGO).
5. *Demurrage & Laytime Risk* (probability of exceeding permitted laytime allowance).
6. *Counterparty & Broker Credit Risk* (shipowner solvency, fleet age, RightShip safety record).

#### Step-by-Step Operating Instructions:
1. **Select Route & Target Vessel**: Choose the active chartering scenario.
2. **Review Composite Risk Score**: The score is indexed from 0 (Zero Risk) to 100 (Extreme Risk).
   - $0 - 30$: Low Risk (Standard procurement process).
   - $31 - 65$: Moderate Risk (Implement risk mitigation clauses).
   - $66 - 100$: High / Severe Risk (Requires Executive Director sign-off and mandatory contingency provisions).
3. **Inspect Radar Chart**: Review the 6-spoke risk radar chart to immediately isolate which specific dimension is elevating voyage risk.
4. **Analyze Monte Carlo VaR**: Check the 95% Value-at-Risk figure. For example, *"95% VaR: ₹1.42 Crore"* means there is only a 5% statistical probability that unexpected voyage delays and fuel spikes will exceed ₹1.42 Crore.
5. **Export Risk Mitigation Checklist**: Click **"Generate Risk Mitigation Clauses"** to produce recommended contractual warranties (e.g., weather-working days laytime terms, bunker price escalation caps).

#### Glossary of Terms:
- **VaR (Value-at-Risk)**: A statistical technique measuring the maximum potential financial loss over a given time frame at a specified confidence level (e.g., 95%).
- **CVaR (Conditional Value-at-Risk / Expected Shortfall)**: The average loss incurred in the worst (tail-risk) 5% or 1% of scenarios, providing a more realistic assessment of extreme maritime crises.
- **Monte Carlo Simulation**: A computational mathematical technique that runs thousands of simulated trials with randomly sampled variables to model probability distributions of complex outcomes.

---

### Page 8: Port Operations & Berth Eligibility (`PortOperationsPage.tsx`)
- **Pillar**: Pillar 4 — Port & Vessel Operations
- **Tab Key**: `ports`
- **Backend API**: `GET /api/ports/list`, `POST /api/ports/berth-eligibility`, `GET /api/ports/congestion`
- **Model / Engine**:
  - `congestion_sih_v1` (XGBoost Congestion Regressor predicting berth waiting hours).
  - Physical Engineering Eligibility Engine: Validates vessel Length Overall (LOA), Extreme Beam, Arrival Draft, and Deadweight Tonnage (DWT) against official berth parameters at Indian Major Ports.
  - Tidal Dynamic Draft Calculator: Models astronomical tide curves to determine high-water berthing windows for Capesize/Baby-Cape vessels.

#### How It Works:
Chartering a ship that cannot physically berth at the destination terminal is a catastrophic public procurement blunder resulting in massive deadfreight, off-berth lighterage, and demurrage claims. This page evaluates real berth-level physical constraints for Indian bulk ports (Paradip, Dhamra, Visakhapatnam, Ennore/Kamarajar, Krishnapatnam, Tuticorin, Mormugao):
- **Physical Feasibility Check**: Compares vessel dimensions against berth length, channel depth, turning basin diameter, and unloader outreach.
- **Dynamic Tidal Windowing**: Calculates if a vessel with a 14.5m draft can enter a 13.0m chart-datum port during a +2.2m spring tide high-water window.
- **Demurrage Exposure vs Delay Split**: Distinguishes between normal port queue waiting and contractual demurrage liability ($/day) incurred once agreed laytime hours elapse.

#### Step-by-Step Operating Instructions:
1. **Select Target Port & Berth**: Choose the destination port (e.g., *Paradip Port*) and specific mechanised coal berth (e.g., *PICT Berth* or *Mechanised Coal Berth MCB*).
2. **Input Vessel Physical Dimensions**: Enter Deadweight Tonnage (e.g., 74,500 DWT), Length Overall (e.g., 225m), Beam (e.g., 32.2m), and Sailing Draft (e.g., 14.0m).
3. **Verify Physical Verdict**:
   - **PASS (Green)**: Vessel meets all physical LOA, beam, draft, and air-draft limits.
   - **FAIL (Red)**: Vessel breaches specific constraints (e.g., *"Draft 14.0m exceeds Maximum Permissible Berth Draft 13.5m"*). The engine immediately flags the vessel as ineligible for tender award.
4. **Review Mechanized Unloading Rate**: Inspect the terminal's rated handling capacity (e.g., 40,000 MT/day for conveyor systems vs 15,000 MT/day for mobile harbor cranes).
5. **Estimate Demurrage Liability**: Review the predicted berth waiting time (e.g., 54 hours). If allowed laytime is 48 hours, the system highlights 6 hours of demurrage exposure at the charterparty demurrage rate (e.g., $18,000/day).

#### Glossary of Terms:
- **LOA (Length Overall)**: The maximum length of a vessel's hull from the forward-most tip of the bow to the aftermost point of the stern.
- **Beam**: The maximum width of the ship at its widest point.
- **Draft (Draught)**: The vertical distance between the waterline and the bottom of the ship's hull (keel).
- **Air Draft**: The vertical distance from the ship's waterline to its highest point (mast/radar), determining clearance under shore-side unloader booms or bridges.
- **Chart Datum (CD)**: The reference water level to which depths on a nautical chart are measured (typically Lowest Astronomical Tide).
- **UKC (Under Keel Clearance)**: The minimum safe vertical distance between the lowest part of the ship's bottom and the sea bed.
- **Demurrage**: A liquidated damages penalty payable by the charterer to the shipowner when cargo loading or discharging operations exceed the contractually agreed time (laytime).
- **Despatch**: An incentive payment made by the shipowner to the charterer if the cargo is loaded or discharged faster than the permitted laytime.

---

### Page 9: Vessel Intelligence & Fleet Vetting (`VesselIntelligencePage.tsx`)
- **Pillar**: Pillar 4 — Port & Vessel Operations
- **Tab Key**: `vessels`
- **Backend API**: `GET /api/vessels/eligible`, `POST /api/vessels/vetting-audit`
- **Model Used**:
  - `vessel_intelligence_v2` (XGBoost Regressor for vessel voyage efficiency & discharge turnaround estimation).
  - Statutory Vetting Rule Engine (Directorate General of Shipping cabotage rules, RightShip safety threshold, Paris/Tokyo MoU inspection records, P&I Club verification).

#### How It Works:
In public chartering tenders, lowest price (L1) cannot be awarded to a substandard, unsafe, or blacklisted vessel. This page automates comprehensive maritime technical vetting:
- **RightShip Safety Score**: Checks vessel safety ratings (1 to 5 stars). Vessels scoring $< 3$ stars are automatically flagged for physical inspection.
- **Age Restriction (< 20 Years)**: Indian PSU tenders strictly disqualify bulk carriers exceeding 20 years of age (or 15 years for certain coastal trades) due to hull stress and bunker inefficiency.
- **Flag State & Cabotage (RoFR)**: Identifies Indian-flagged vessels entitled to **Right of First Refusal (RoFR)** under DG Shipping cabotage guidelines to promote Indian tonnage.
- **P&I Club & Classification Society**: Verifies that the vessel is classed by an IACS (International Association of Classification Societies) member and has valid P&I oil pollution liability coverage.

#### Step-by-Step Operating Instructions:
1. **Search or Filter Candidate Vessels**: Enter IMO number, vessel name, or filter by vessel class (*Panamax / Kamsarmax*).
2. **Review Vetting Scorecard**:
   - Check the **Vetting Status** badge (`ELIGIBLE`, `CONDITIONAL`, or `DISQUALIFIED`).
   - Confirm vessel age (e.g., 8 years · Built 2018 · *Eligible*).
   - Confirm IACS Class (e.g., *DNV* or *Lloyd's Register* · *Passed*).
   - Check Port State Control (PSC) deficiency history (zero detentions in past 36 months).
3. **Inspect Turnaround Performance**: Review the predicted cargo discharge turnaround time (hours) calculated by `vessel_intelligence_v2`.
4. **Attach Vetting Certificate**: Click **"Attach Vetting Report to Tender"** to generate an immutable vetting approval record for the procurement dossier.

#### Glossary of Terms:
- **IMO Number**: A unique seven-digit identification number assigned by the International Maritime Organization to every commercial ship, which remains unchanged throughout the ship's lifetime.
- **RightShip**: The global maritime risk assessment organization that rates vessel safety, greenhouse gas emissions, and crew welfare.
- **IACS (International Association of Classification Societies)**: The premier technical association of marine classification societies (DNV, ABS, Lloyd's Register, Indian Register of Shipping / IRS) establishing structural safety standards.
- **P&I Club (Protection & Indemnity Club)**: A mutual insurance association of shipowners providing liability coverage for third-party risks (crew injury, cargo damage, oil pollution, wreck removal).
- **RoFR (Right of First Refusal)**: A statutory policy in Indian public chartering where Indian-flagged vessels are given the right to match the lowest bid (L1) submitted by foreign-flagged ships.

---

### Page 10: CVC Governance & Decision Sign-Off (`CvcGovernancePage.tsx`)
- **Pillar**: Pillar 3 — Governance & Assurance
- **Tab Key**: `governance`
- **Backend API**:
  - `GET /api/decisions/timeline`, `POST /api/decisions/create`, `POST /api/decisions/transition`
  - `GET /api/audit/anchor-status`, `POST /api/audit/anchor`
  - `GET /api/reports/cvc-pdf`, `GET /api/reports/cag-excel`
- **Model / Cryptographic Engine**:
  - Sequential SHA-256 Hash Chaining across all `decision_events`.
  - Binary Merkle Tree Aggregator.
  - Web3.py RPC client broadcasting to Polygon Amoy Testnet (Chain ID 80002).
  - ReportLab PDF & openpyxl Excel document generation pipelines.

#### How It Works:
This is the sovereign compliance anchor of the platform. Under CVC and CAG guidelines, every public chartering decision must be auditable, transparent, and legally defensible.
- **Dual-Officer Maker-Checker Authorization**: Implements strict Delegation of Financial Powers (DoFP). The initiating Chartering Officer (*Maker*) creates and submits a proposal. The system mathematically prevents self-approval. A distinct Senior Reviewer / Finance Concurrence Officer (*Checker*) must log in to approve or reject.
- **Cryptographic Event Chain**: Every action (`CREATED`, `ANALYSED`, `SUBMITTED_FOR_REVIEW`, `APPROVED`, `RETURNED`) is chained via SHA-256 hashing to the previous event's hash, creating an immutable local ledger.
- **Public Blockchain Anchoring**: Batches of unanchored events are compiled into a 32-byte Merkle root and anchored onto the public Polygon Amoy blockchain. Anyone (auditors, vigilance officers, the public) can verify on PolygonScan that procurement records were not altered retrospectively.
- **Auditor Report Generation**: Generates 1-click official 10-page CVC compliance dossiers (PDF) with embedded QR codes and multi-sheet CAG audit workbooks (Excel).

#### Step-by-Step Operating Instructions:
1. **Review Active Decision File**: Inspect the current decision snapshot (commodity, volume, recommended route, vessel, and forecast freight).
2. **Check Maker-Checker Status**:
   - If logged in as *Chartering Officer*: Click **"Submit for Finance Concurrence"**. Note that the "Approve" button is disabled to enforce anti-self-approval rules.
   - Switch user role to *Senior Reviewer / Director*: The review panel activates. Review the attached market forecast, risk radar, port eligibility, and collusion check.
3. **Execute Sign-Off**: Click **"Approve Tender Award"** or **"Return with Observations"**.
4. **Anchor to Blockchain**:
   - Check the **Anchor Status** card. If unanchored events exist, click **"Anchor Batch to Blockchain"**.
   - Watch the status transition: `PENDING` $\rightarrow$ `ANCHORED`.
   - Click the displayed **PolygonScan Transaction Hash** link to inspect the 32-byte Merkle root on the public Polygon explorer.
5. **Download Audit Evidence**:
   - Click **"Download CVC Compliance PDF Dossier"** for a formal, stamped 10-page report.
   - Click **"Download CAG Audit Workbook (XLSX)"** for spreadsheet financial evidence.

#### Glossary of Terms:
- **CVC (Central Vigilance Commission)**: The apex Indian integrity institution addressing governmental corruption and establishing public procurement guidelines.
- **CAG (Comptroller and Auditor General of India)**: The supreme constitutional audit authority in India scrutinizing government expenditure and PSU financial efficiency.
- **DoFP (Delegation of Financial Powers)**: Formal administrative schedules defining financial spending limits and mandatory sign-off tiers for public officials.
- **Maker-Checker Principle**: A mandatory corporate governance control requiring that every financial transaction or procurement commitment be initiated by one individual (Maker) and independently verified and approved by a second individual (Checker).
- **Merkle Root**: The single 32-byte cryptographic root hash of a binary tree that mathematically verifies the integrity of all underlying leaf transactions.
- **Polygon Amoy**: The official public Ethereum Layer-2 testnet utilized for publishing immutable zero-value proof-of-existence transactions.

---

### Page 11: Data Quality & ISO 8000 Compliance (`DataQualityPage.tsx`)
- **Pillar**: Pillar 3 — Governance & Assurance
- **Tab Key**: `quality`
- **Backend API**: `GET /api/quality/metrics`, `POST /api/quality/validate-pipeline`
- **Model / Statistical Engine**:
  - ISO 8000 Data Quality Scoring Framework.
  - Two-Sample Kolmogorov-Smirnov (KS) Test: Detects distributional shifts in freight and bunker time series.
  - Population Stability Index (PSI): Quantifies feature drift between training distributions and live ingestion feeds ($PSI > 0.2$ triggers automated retraining alert).

#### How It Works:
Machine learning models are only as reliable as their input data ("garbage in, garbage out"). In maritime intelligence, data streams from commodity exchanges, satellite AIS providers, and meteorological agencies frequently suffer from missing values, latency, and reporting drift. This page provides real-time data governance adhering to **ISO 8000 (Data Quality)** across 6 core dimensions:
1. *Completeness*: Percentage of required fields populated without nulls.
2. *Timeliness / Latency*: Freshness of live feeds (e.g., bunker prices < 2 hours old, AIS positions < 15 minutes old).
3. *Accuracy*: Values falling within physically and commercially valid ranges.
4. *Uniqueness*: Deduplication of vessel AIS pings and fixture records.
5. *Consistency*: Cross-system reconciliation between port terminal reports and shipmaster logs.
6. *Validity*: Conformance to international schemas (e.g., ISO country codes, valid 7-digit IMO numbers).

#### Step-by-Step Operating Instructions:
1. **Review Feed Health Cards**: Inspect live status badges for external data feeds:
   - *Baltic Exchange Feed* (Latency: 12 min · *Healthy*)
   - *Satellite AIS Spire Stream* (Latency: 4 min · *Healthy*)
   - *Platts Bunker Fuel Index* (Latency: 45 min · *Healthy*)
   - *IMD Weather Hazard API* (Latency: 30 min · *Healthy*)
   - *Indian Major Ports IPA Feed* (Latency: 60 min · *Healthy*)
2. **Inspect ISO 8000 Dimension Scores**: Ensure composite quality index exceeds the 90% benchmark (e.g., 96.4%).
3. **Review Feature Drift Monitor**: Examine the Kolmogorov-Smirnov and PSI metrics. If any feature shows significant drift (e.g., bunker prices experiencing sudden war-risk dislocation), the system displays a warning advising human supervision of model outputs.

#### Glossary of Terms:
- **ISO 8000**: The international standard for data quality and enterprise master data exchange.
- **Data Drift**: Changes in the statistical distribution of input data over time compared to the data on which machine learning models were originally trained.
- **PSI (Population Stability Index)**: A metric used to measure how much a variable's distribution has shifted away from a reference baseline distribution. $PSI < 0.1$ indicates no shift; $0.1 \le PSI < 0.2$ indicates moderate shift; $PSI \ge 0.2$ indicates significant drift requiring model recalibration.
- **Kolmogorov-Smirnov (KS) Test**: A non-parametric statistical test that compares the continuous cumulative distributions of two datasets to determine if they originate from the same underlying population.

---

### Page 12: Machine Learning Model Registry (`ModelRegistryPage.tsx`)
- **Pillar**: Pillar 3 — Governance & Assurance
- **Tab Key**: `models`
- **Backend API**: `GET /api/models/registry`, `GET /api/models/{version}`
- **Engine**:
  - MLflow-compatible JSON Model Metadata & Lineage Registry.
  - Tracks model versioning, training dates, hyperparameters, feature schemas, input column definitions, test split evaluation metrics, and operational deployment statuses (`active`, `imported`, `shadow`, `archived`).

#### How It Works:
Public procurement regulations prohibit using untracked, unversioned algorithms for public spending. The Model Registry serves as the central MLOps audit repository, documenting every algorithm running inside the platform. It provides complete transparency into model provenance, hyperparameter choices, and offline validation performance.

#### Step-by-Step Operating Instructions:
1. **Browse Registered Models**: Inspect the list of all platform models:
   - `xgb_panamax_freight_v7` (Active Freight Forecasting Model)
   - `congestion_sih_v1` (Port Congestion Model)
   - `market_intelligence_v1` (Market Regime Classifier)
   - `vessel_intelligence_v2` (Vessel Turnaround Model)
   - `fos_v1` (Freight Opportunity Score Engine)
   - `bid_anomaly_detection_v1` (Bid Anomaly & Collusion Detection Engine)
2. **Inspect Model Specifications**: Click on any model to view:
   - Algorithm family (e.g., XGBoost / Random Forest)
   - Artifact hash and serialization format (`.pkl` / `.joblib`)
   - Input feature count and schema validation mapping
   - Offline test metrics ($R^2$, MAE, RMSE, Precision, Recall, ROC-AUC)
3. **Verify Compliance Status**: Confirm that the model status is marked `active` and that its cryptographic hash matches the version recorded in CVC audit dossiers.

#### Glossary of Terms:
- **Model Registry**: A centralized repository that tracks machine learning models throughout their lifecycle, from development to production deployment and archiving.
- **Model Provenance**: The documented historical record of who trained a model, on what dataset, using which hyperparameters, and with what verified test performance.
- **MAE (Mean Absolute Error)**: The average magnitude of the errors between model predictions and actual outcomes, measured in the same units as the target variable (e.g., $/MT).
- **RMSE (Root Mean Squared Error)**: The square root of the mean squared differences between predictions and actuals, penalizing large outlier errors more severely than MAE.
- **ROC-AUC**: The Area Under the Receiver Operating Characteristic curve, measuring the ability of a classification model to distinguish between positive (e.g., anomalous) and negative (normal) classes across all classification thresholds.

---

### Page 13: Counterfactual Explanations & Sensitivity Hub (`CounterfactualPage.tsx`)
- **Pillar**: Pillar 3 — Governance & Assurance
- **Tab Key**: `counterfactual`
- **Backend API**:
  - `POST /api/counterfactual/explain`
  - `POST /api/counterfactual/simulate`
- **Model / Algorithmic Engine**:
  - Systematic Algorithmic Grid Search / Gradient-Free Optimization across model predictive surfaces.
  - Answers the counterfactual question: *"What is the smallest operational or market change required to flip a chartering decision or de-risk a route?"*
  - Elasticity Sensitivity Matrix calculating first-order partial derivatives $\frac{\partial \text{Freight}}{\partial \text{Bunker}}$, $\frac{\partial \text{Freight}}{\partial \text{Congestion}}$, $\frac{\partial \text{Freight}}{\partial \text{Laytime}}$.

#### How It Works:
Standard machine learning models tell users *what* will happen; counterfactual explanations tell users *what operational levers they can pull to change the outcome*.
For example: If a route is classified as "HIGH RISK" or a freight quote is judged "UNFAVOURABLE", standard AI leaves managers helpless. The Counterfactual Engine systematically searches the parameter space to find minimal actionable interventions:
- *"If you negotiate a 2-day increase in permitted laytime (from 4 to 6 days), the demurrage risk score drops by 38%, flipping the route from High Risk to Acceptable."*
- *"If bunker fuel drops by just $32/MT, or if vessel speed is reduced from 13.5 to 11.8 knots (eco-steaming), voyage fuel cost drops by $48,000, bringing total freight below your budget ceiling."*

#### Step-by-Step Operating Instructions:
1. **Select Baseline Decision**: Load a completed chartering scenario.
2. **Review Minimal Counterfactual Flip**: Inspect the engine's automatically generated minimum-intervention recommendation card.
3. **Operate Interactive Sensitivity Sliders**:
   - Adjust **Bunker Price Delta** (-$100 to +$100 / MT)
   - Adjust **Port Congestion Hours** (-48h to +48h)
   - Adjust **Contracted Laytime Days** (2 to 8 days)
   - Adjust **Vessel Draft / Parcel Quantity**
4. **Observe Real-Time Decision Flipping**: Watch the live recalculation gauge. As you adjust sliders, observe the exact threshold at which the recommendation flips from `REJECT` $\rightarrow$ `APPROVE`.
5. **Attach Counterfactual Justification**: Click **"Attach Counterfactual Sensitivity Card"** to include these actionable operational levers in the CVC audit dossier.

#### Glossary of Terms:
- **Counterfactual Explanation**: An explanation of a model prediction that specifies the smallest possible change to the input features that would result in a different, desired outcome.
- **Elasticity**: The percentage change in an output variable (e.g., Freight Rate) resulting from a one-percent change in an input variable (e.g., Bunker Price).
- **Eco-Steaming**: The practice of operating cargo vessels at reduced speeds (e.g., 11 to 12 knots instead of 14 knots) to dramatically reduce daily fuel consumption and carbon emissions.
- **Actionable Feature**: A variable that can be intentionally modified by human decision-makers (e.g., laytime days, vessel speed, cargo parcel size), as opposed to non-actionable variables (e.g., seasonal monsoon weather).

---

### Page 14: Bid Anomaly & Collusion Detection (`BidAnomalyPage.tsx`)
- **Pillar**: Pillar 3 — Governance & Assurance
- **Tab Key**: `collusion`
- **Backend API**:
  - `GET /api/collusion/tenders`, `GET /api/collusion/tenders/{tender_id}`
  - `POST /api/collusion/score-bid`, `POST /api/collusion/score-tender`
  - `POST /api/collusion/explain-bid`, `POST /api/collusion/simulate`
  - `GET /api/collusion/performance`
- **Model Used**:
  - `bid_anomaly_detection_v1` (Rare-Event Calibrated XGBoost Classifier).
  - Class Imbalance Handling: Calibrated with `scale_pos_weight: 36.9` to handle real-world low collusion prevalence (~2%) without missing cartel bids.
  - Explainability: SHAP TreeExplainer decomposing bid risk into positive/negative log-odds attributions.
  - Fair-Value Benchmark: Dynamic statistical corridor spanning **P50 ± 8%** based on underlying voyage fundamentals.

#### How It Works:
Public procurement tenders in shipping are vulnerable to illegal cartel behavior under **Section 3 of the Competition Act 2002** and CVC guidelines. Corrupt brokers coordinate to extract inflated public funds through:
1. **Cover Bidding (Courtesy Bidding)**: Conspiring brokers submit artificially inflated quotes (+20% to +35% above fair value) to simulate fierce competition while ensuring the designated cartel member wins at an inflated price.
2. **Bid Rotation**: Conspiring firms take turns submitting the lowest quote across consecutive tenders.
3. **Artificial Spread Clustering**: Losing bids cluster within an unnaturally tight band above the winning quote.

This page provides an automated anti-rigging screening system. It compares all submitted tender bids against the machine learning Fair-Value Corridor, scores every bid for anomaly probability, and generates legally admissible SHAP decision cards.

#### Step-by-Step Operating Instructions:
1. **Inspect Submitted Tender File**: In the *Tender Integrity Inspector*, select a tender to audit. Use the quick-filter pills to view *All Tenders*, *Flagged Suspect*, or *Clean Competitive*.
2. **Set Sensitivity Dial**: Adjust the Anomaly Detection Threshold slider (default: `0.50`).
3. **Review Integrity Verdict**:
   - Inspect the composite tender badge: `ANOMALOUS / FLAG FOR VIGILANCE` (Red) vs `COMPETITIVE & CLEAN` (Green).
   - Review the broker submissions table. Bids with an anomaly score $\ge 0.50$ are highlighted with red status pills (`status-risk`).
4. **Deep-Dive SHAP Feature Drivers**: Click **"Explain Bid Drivers"** on any flagged submission to open the SHAP Decision Drawer. Inspect the exact factors that drove the suspicion (e.g., *Fair-Value Band Breach: +28.5%*, *Broker Historical Premium: +6.2%*, *Historical Vessel Pairing Cluster*).
5. **Simulate What-If Bids**: Switch to Sub-Tab 2 (*Interactive What-If Bid Simulator*). Adjust quoted freight, market benchmark, broker premium, and fuel sliders to observe how cartel pricing shifts trigger anomaly alarms.
6. **Verify Governance Benchmarks**: Switch to Sub-Tab 3 (*Model Benchmark & Vigilance Governance*). Review the test evaluation matrix demonstrating that the machine learning engine achieves a **73.4% reduction in false alarms** compared to naive rule-of-thumb thresholds.

#### Glossary of Terms:
- **Cover Bidding**: A form of bid rigging where some competitors agree to submit bids that are either too high to be accepted or contain special terms that are unacceptable to the buyer, designed solely to protect the designated winner.
- **Bid Rotation**: A cartel practice where conspiring bidders take turns being the winning bidder on a series of public contracts.
- **Fair-Value Corridor**: The dynamic statistical pricing range (P50 ± 8%) calculated from underlying voyage economics within which honest, competitive bids should naturally fall.
- **scale_pos_weight**: An XGBoost hyperparameter that scales the gradient for positive instances, compensating for severe class imbalance in rare-event detection (such as fraudulent or collusive tenders).
- **GFR Rule 144**: General Financial Rules 2017 provision governing fundamental principles of public procurement, competition, and integrity.

---

### Page 15: Charterparty Studio (`CharterpartyStudioPage.tsx`)
- **Pillar**: Pillar 3 — Governance & Assurance
- **Tab Key**: `contract`
- **Backend API**:
  - `GET /api/charterparty/templates`: Returns available legal frameworks (`GENCON_1994` voyage charter, `NYPE_2015` time charter).
  - `POST /api/charterparty/generate`: Compiles Part I commercial box layout, Part II standard clauses, and Part III selected protective riders into a unified legal agreement.
  - `POST /api/charterparty/validate`: Audits contract for Indian CVC / GFR Rule 144 compliance, Indian arbitration jurisdiction, anti-bribery covenants, and critical maritime risk riders.
- **Contractual Framework**:
  - **BIMCO GENCON 1994**: Box Layout Part I with 18 standard commercial parameters (Boxes 1–18 covering Owners, Charterers, Vessel Particulars, Cargo, Freight, Laytime SHINC/SHEX, Demurrage/Despatch, General Average, Law & Arbitration). Part II contains 14 standard clauses (Owners' Responsibility, Deviation, Payment of Freight, Loading/Discharging, Demurrage, Liens, Cancelling, General Average, Both-to-Blame, Strike, War, Ice, Taxes).
  - **BIMCO NYPE 2015**: Time Charter Box Layout with 7 core operational clauses: Delivery, Speed & Consumption Warranties, Off-Hire, Owners to Provide / Charterers to Provide, Redelivery, and Charterer's Lien.
  - **7 Indian Sovereign & Maritime Protective Riders**:
    1. *BIMCO CONWARTIME 2004* (War Risks & Red Sea / Gulf of Aden transit safety)
    2. *BIMCO Piracy Clause 2013* (Security guards, insurance reimbursement, transit routes)
    3. *Bunker Price Escalation Clause* (Fuel price risk-sharing mechanism benchmarked to Singapore / Fujairah VLSFO)
    4. *IMO Carbon Intensity Indicator (CII) Operations Clause* (Charterer speed instructions vs vessel carbon rating maintenance)
    5. *BIMCO Cyber Security Clause* (Cyber incident notification and mitigation)
    6. *BIMCO Sanctions Clause* (Protection against OFAC/EU/UN sanctioned trade counterparties)
    7. *Force Majeure & Port Congestion Relief Clause* (Monsoon berthing delay and tidal congestion protections)
  - **CVC & GFR Rule 144 Compliance Engine**: Automated verification of Indian PSU procurement compliance, verifying GFR tender references, anti-bribery covenants, and dispute resolution under the Indian *Arbitration and Conciliation Act, 1996* (seated in New Delhi, Mumbai, or Kolkata).

#### How It Works:
In traditional PSU procurement, compiling maritime charterparties is a manual, error-prone legal process conducted across disparate word processors. Crucial protective riders (e.g., bunker escalation or piracy rerouting clauses) are frequently omitted, exposing PSUs to millions in unhedged claims. Furthermore, foreign shipowners often insert foreign arbitration clauses (e.g., LMAA London seated), forcing Indian PSUs into expensive international litigation.

Charterparty Studio solves this by automating contract compilation directly from tender and vessel vetting parameters. It guarantees that all agreements strictly adhere to BIMCO standards, embeds all mandatory sovereign Indian riders, and executes an automated CVC audit before contract finalization.

#### Step-by-Step Operating Instructions:
1. **Select Contract Framework**: Toggle between **BIMCO GENCON 1994 (Voyage Charter)** and **BIMCO NYPE 2015 (Time Charter)**.
2. **Apply PSU Operational Preset (Optional)**: Click one of the 3 pre-configured operational templates to auto-populate standard commercial terms:
   - *CIL Australia-Paradip Panamax Coal*: Australia to Paradip, 80,000 MT coking coal, 20,000 TPD laytime SHINC, $14,500/day demurrage.
   - *NTPC Indonesia-Ennore Thermal Coal*: Indonesia to Kamarajar/Ennore, 75,000 MT thermal coal, 18,000 TPD laytime SHINC.
   - *TANGEDCO Coastal Supramax*: Paradip to Tuticorin/VOC, 55,000 MT domestic coal, 12,000 TPD laytime SHEX.
3. **Configure Commercial Box Parameters**: Adjust vessel details, load/discharge ports, freight rate ($/MT or $/day), laytime rates, demurrage/despatch terms, and CVC tender reference.
4. **Toggle Protective Rider Clauses**: Activate or deactivate the 7 protective riders in the *Protective Rider Clauses* panel.
5. **Compile & Audit Agreement**: Click **"Compile Charterparty Agreement"**. The system generates the unified legal document and runs the real-time CVC compliance validator.
6. **Review CVC Integrity Verdict**: Inspect the *CVC / GFR 144 Integrity Verdict* banner. Verify that Indian arbitration jurisdiction is enforced, anti-bribery covenants are active, and no critical risk gaps exist.
7. **Export Contract**: Click **"Export Legal Markdown"** or **"Print / Save Agreement"** to generate the final contract for legal execution.

---

## 4. Master 15-Step End-to-End Operational Workflow

The following table defines the mandatory standard operating procedure (SOP) for chartering officers and vigilance auditors executing a procurement decision:

| Step # | Milestone Page | Officer Action & Audit Requirement |
|---|---|---|
| **Step 1** | **Executive Overview** | Review global market regime (Bullish/Bearish/Neutral), BDI momentum, and set baseline chartering posture. |
| **Step 2** | **Forecast & SHAP** | Generate 30/60/90-day freight forecast. Review P10/P50/P90 confidence corridor and snapshot SHAP decision drivers. |
| **Step 3** | **Freight Opportunity** | Evaluate Freight Opportunity Score (FOS). Confirm whether the current fixing window is optimal or if tendering should be deferred. |
| **Step 4** | **Vessel Intelligence** | Screen candidate vessels against statutory criteria: Age < 20 years, RightShip $\ge 3$ stars, IACS classification, and P&I coverage. |
| **Step 5** | **Port Operations** | Run physical berth eligibility audit for all 16 Indian ports (LOA, beam, arrival draft, tidal UKC). Verify turnaround hours and dual-engine congestion prediction. |
| **Step 6** | **Maritime GIS** | Map voyage geometry, chokepoint bottlenecks (Malacca/Suez), and active Bay of Bengal cyclone hazards via IMD adapter. |
| **Step 7** | **Risk Intelligence** | Calculate composite 6-pillar risk score and Monte Carlo 95% Value-at-Risk (VaR). Attach mandatory risk mitigation clauses. |
| **Step 8** | **Policy & Economics** | Verify energy-normalized landed cost (₹/Gcal) against domestic coal counterfactuals. Record GFR Rule 144 justification notes. |
| **Step 9** | **Portfolio Optimizer** | Run HiGHS linear program to allocate parcel across Spot, COA, and Period Time Charter vehicles according to annual volume targets. |
| **Step 10** | **Data Quality ISO 8000** | Audit input data feeds for Completeness, Timeliness, Accuracy, Uniqueness, Consistency, and Validity. Check KS/PSI drift metrics. |
| **Step 11** | **Model Registry** | Record active model versions (`xgb_panamax_freight_v7`, `bid_anomaly_detection_v1`), artifact hashes, and offline test metrics. |
| **Step 12** | **Counterfactual Hub** | Execute sensitivity search to identify minimal operational levers (laytime days, eco-steaming speed) that de-risk the voyage. |
| **Step 13** | **Bid Anomaly & Collusion** | Audit received broker quotes against the Fair-Value Corridor (P50 ± 8%). Check for cover bidding, price clustering, or cartel rotation. |
| **Step 14** | **Charterparty Studio** | Compile legally binding BIMCO GENCON 1994 / NYPE 2015 contract with Indian PSU protective riders and automated CVC/GFR Rule 144 compliance verification. |
| **Step 15** | **CVC Governance & Blockchain** | Enforce DoFP Maker-Checker sign-off. Prevent self-approval, compile SHA-256 event chain, anchor Merkle root to Polygon Amoy, and export PDF/Excel audit dossiers. |

---

## 5. Master Technical & Domain Glossary

### 5.1 Maritime Shipping & Chartering Terms
- **BIMCO**: Baltic and International Maritime Council—the world's largest international shipping association representing shipowners, operators, and charterers.
- **Capesize**: Bulk carriers too large to transit the original Panama Canal (typically 120,000 to 200,000+ DWT), requiring transit around Cape Horn or Cape of Good Hope.
- **Panamax / Kamsarmax**: Bulk carriers designed to the maximum dimensions of the original Panama Canal locks (typically 65,000 to 85,000 DWT; Kamsarmax up to 229m LOA).
- **Supramax / Ultramax**: Versatile geared bulk carriers (typically 50,000 to 65,000 DWT) equipped with onboard cranes and grabs for discharging at ports lacking shore infrastructure.
- **DWT (Deadweight Tonnage)**: The total weight a ship can safely carry, including cargo, bunker fuel, fresh water, ballast, provisions, and crew.
- **VLSFO (Very Low Sulphur Fuel Oil)**: Marine bunker fuel with a maximum sulphur content of 0.50%, compliant with IMO 2020 MARPOL Annex VI regulations.
- **LSMGO (Low Sulphur Marine Gas Oil)**: Cleaner distillate marine fuel with $\le 0.10\%$ sulphur content, mandatory in Emission Control Areas (ECAs).
- **Notice of Readiness (NOR)**: A formal notice tendered by the ship's master to the charterer stating that the vessel has arrived at the port and is in all respects ready to load or discharge cargo.
- **Laytime**: The contractually permitted time (stipulated in hours or days) allowed to the charterer for loading or discharging cargo without incurring extra financial penalties.
- **SHINC / SHEX**: Standard laytime clauses: *SHINC* = Sundays and Holidays Included; *SHEX* = Sundays and Holidays Excluded.

### 5.2 Public Procurement, Legal & Vigilance Terms
- **Central Vigilance Commission (CVC)**: Apex anti-corruption body monitoring public sector integrity and procurement compliance in India.
- **Comptroller and Auditor General (CAG)**: Constitutional auditor evaluating regularity, economy, and efficiency of Indian governmental and PSU expenditures.
- **Competition Commission of India (CCI)**: Statutory body enforcing the Competition Act 2002 to prevent anti-competitive agreements, cartels, and bid rigging.
- **General Financial Rules (GFR 2017)**: The foundational administrative rules governing all public procurement, contracting, and expenditure across Indian government ministries and PSUs.
- **GFR Rule 144**: Sets fundamental procurement principles: transparency, competition, fair treatment of bidders, and commercial justification of public funds.
- **Delegation of Financial Powers (DoFP)**: Administrative schedule defining spending caps and approval authorities across executive tiers.
- **Maker-Checker Control**: Internal governance control ensuring separation of duties between transaction initiators and transaction approvers.
- **L1 (Lowest Bidder)**: The legally compliant tenderer submitting the lowest financial quote, who is ordinarily awarded the public contract under standard tender guidelines.

### 5.3 Machine Learning, Mathematics & Blockchain Terms
- **XGBoost (Extreme Gradient Boosting)**: An optimized distributed gradient boosting library implementing scalable tree-boosting algorithms.
- **SHAP (SHapley Additive exPlanations)**: Game-theoretic attribution method explaining individual machine learning model predictions.
- **TreeExplainer**: An optimized algorithm within SHAP specifically designed for tree-based models (XGBoost, Random Forest, LightGBM) that computes exact Shapley values in polynomial time.
- **Linear Programming (LP)**: A mathematical optimization technique for maximizing or minimizing a linear objective function subject to linear equality and inequality constraints.
- **HiGHS Solver**: A high-performance open-source software package for solving large-scale linear programming (LP) and mixed-integer linear programming (MILP) problems.
- **Conformalized Quantile Regression**: A framework for constructing rigorous prediction intervals with guaranteed finite-sample coverage probabilities.
- **SHA-256**: A cryptographic secure hash algorithm producing a fixed 256-bit (32-byte) deterministic hash signature from arbitrary input data.
- **Merkle Tree**: A cryptographic binary tree structure where every non-leaf node is labelled with the cryptographic hash of the labels of its child nodes.
- **Polygon Amoy**: A public Ethereum Layer-2 proof-of-stake test network offering low transaction costs and instant finality for public audit anchoring.
- **Zero-Value Calldata Transaction**: A blockchain transaction transferring 0 cryptocurrency units while appending arbitrary data (such as a 32-byte Merkle root) to the transaction input payload, immutably timestamping the data on the blockchain.
