# Vessel Intelligence Model

## 1. Overview

The **Vessel Intelligence Model** is a decision-support system designed to identify and rank the most suitable vessels for bulk cargo movements between origin markets and Indian East Coast ports.

The model is designed for a maritime chartering environment where vessel selection depends on much more than vessel carrying capacity. A suitable vessel must satisfy cargo requirements, port infrastructure restrictions, operational conditions, expected waiting time, and voyage economics.

The primary purpose of the model is therefore:

> **To identify vessels that are operationally feasible and economically suitable for a specific cargo, route, destination port, and decision date.**

The model supports the broader objective of moving from reactive individual spot fixtures toward a more proactive and data-driven vessel chartering strategy.

---

# 2. Business Problem

Bulk cargo procurement and vessel chartering involve several interacting uncertainties:

* Different cargo parcel sizes
* Different vessel classes
* Port draft restrictions
* LOA and beam restrictions
* Berth limitations
* Vessel capacity
* Port congestion
* Waiting time
* Weather conditions
* Freight rates
* Bunker conditions
* Vessel age and characteristics
* Operational risk

A vessel with the lowest nominal freight rate is not necessarily the best vessel.

For example, a larger vessel may offer better freight economics but may exceed the destination port's draft restriction and experience significant operational delays.

The Vessel Intelligence Model addresses this problem by combining vessel feasibility, operational prediction, and suitability ranking.

---

# 3. What the Model Predicts

The first machine-learning component of the system predicts:

## Expected Vessel Waiting Time

### Target

`avg_waiting_hours`

### Meaning

The predicted number of hours a vessel is expected to wait under the available operational conditions.

Example:

`Predicted waiting time = 18.4 hours`


This means that, based on the information available to the model, the vessel is expected to experience approximately 18.4 hours of operational waiting.

Waiting time is used as an important operational-risk signal when ranking candidate vessels.

---

# 4. What the Model Does NOT Predict

The model does **not** directly predict:

* The exact vessel that will be chartered in the real market
* A guaranteed optimal vessel
* A guaranteed freight rate
* A guaranteed voyage profit
* A guaranteed chartering outcome
* Future vessel availability with certainty
* Historical chartering decisions as ground truth

Historical vessel selection is not treated as the definition of an optimal decision because a vessel may have been selected for commercial or operational reasons that are not recorded in the dataset.

Instead, the model predicts measurable operational outcomes and combines them with explicit feasibility and suitability rules.

---

# 5. Vessel Intelligence Concept

The system has three major layers:

```text
Vessel Data
      +
Port Constraints
      +
Cargo Requirements
      +
Operational Data
      ↓
HARD FEASIBILITY
      ↓
Eligible / Ineligible
      ↓
Waiting-Time Prediction
      ↓
Operational Risk
      ↓
Cargo + Port + Economic Suitability
      ↓
VESSEL SUITABILITY SCORE
      ↓
VESSEL RANKING
```

The model therefore combines:

### Deterministic intelligence

Used for physical and contractual feasibility.

### Machine learning

Used to estimate operational waiting time.

### Decision-support scoring

Used to rank feasible vessels.

---

# 6. Vessel-Level Inputs

The model uses vessel characteristics such as:

* Vessel class
* DWT
* LOA
* Beam
* Draft
* Year built
* Vessel age
* Speed
* Fuel-related information
* Operational status
* Vessel-specific historical information where available

These characteristics describe the physical and operational profile of a candidate vessel.

---

# 7. Cargo Inputs

Vessel suitability depends strongly on the cargo parcel.

Important cargo information includes:

* Cargo type
* Cargo quantity
* Required carrying capacity
* Origin
* Destination

The model calculates:

### Cargo Utilization

```text
Cargo utilization =
Cargo quantity / Vessel DWT × 100
```

This indicates how effectively the vessel's deadweight capacity matches the cargo parcel.

A vessel that is too small cannot carry the cargo.

A vessel that is excessively large may have poor cargo utilization and may be less attractive economically.

---

# 8. Port Compatibility

Port compatibility is one of the most important components of Vessel Intelligence.

The model considers available destination-port restrictions such as:

* Maximum DWT
* Maximum LOA
* Maximum beam
* Maximum draft
* Berth length
* Berth constraints
* Special restrictions
* Tidal restrictions where available

The system calculates physical margins such as:

```text
Draft margin
LOA margin
Beam margin
DWT margin
Berth-length margin
```

For example:

```text
Port maximum draft = 13.0 m
Vessel draft        = 12.4 m

Draft margin = +0.6 m
```

A positive margin indicates that the vessel is within the available limit.

---

# 9. Hard Feasibility

Hard feasibility is applied before vessel ranking.

A vessel must satisfy the applicable constraints.

Examples:

```text
DWT capacity
LOA
Beam
Draft
Berth length
Cargo capacity
Vessel operational status
```

A vessel that fails a mandatory constraint is considered:

```text
INELIGIBLE
```

and receives:

```text
Suitability Score = 0
```

This prevents a machine-learning prediction from recommending a vessel that cannot physically or operationally perform the voyage.

---

# 10. Origin and Destination Feasibility

The intended final system evaluates both:

```text
Loading Port
        +
Discharge Port
```

The vessel should be feasible at both ends of the voyage.

However, the current master dataset may contain an origin **country** rather than an exact loading-port identifier.

In that situation the model does not fabricate a loading-port restriction.

Instead:

```text
Origin constraint status = UNKNOWN
```

This is intentional and prevents false feasibility claims.

Once loading-port data is available, the same feasibility framework can evaluate both ports.

---

# 11. Operational Intelligence

The waiting-time prediction component uses operational information available in the master dataset.

Possible signals include:

### Port activity

* Port calls
* Queue activity
* Historical port conditions
* Waiting-time indicators

### AIS

* AIS observations
* Unique vessel activity
* Vessel speed
* Low-speed vessel activity
* Draft observations
* Port-area activity where available

### Weather

* Wind
* Waves
* Pressure
* Precipitation
* Storm conditions
* Cyclone conditions

These variables help estimate the operational environment surrounding a vessel and destination port.

---

# 12. Waiting-Time Prediction

The supervised ML target is:

```text
avg_waiting_hours
```

The system trains multiple candidate models:

```text
Median baseline
Random Forest
XGBoost
```

The model selected for deployment is determined using the validation data.

The final test set is used only for unbiased performance evaluation.

---

# 13. Why Waiting Time Is Important

Waiting time directly affects vessel economics.

A vessel may appear attractive based on freight cost but become less attractive if it is expected to remain idle at the port.

For example:

```text
Vessel A
Lower freight
Expected waiting = 72 hours

Vessel B
Slightly higher freight
Expected waiting = 18 hours
```

The second vessel may have better overall economics once delay and idle exposure are considered.

Therefore waiting-time prediction becomes an important part of vessel selection.

---

# 14. Operational Risk Score

The system converts operational conditions into an:

```text
Operational Risk Score
```

from approximately:

```text
0 = lower risk
100 = higher risk
```

The score considers factors such as:

* Predicted waiting time
* Port queue pressure
* Weather conditions
* Cyclone/storm conditions
* Vessel age where available

A high operational-risk score does not automatically mean a vessel is impossible.

It means that the vessel has relatively higher operational exposure.

---

# 15. Economic Suitability

The model can use available voyage-economic information to estimate the relative economic attractiveness of vessels.

The current prototype uses the available:

```text
voyage_economic_proxy
```

as a normalized ranking signal.

This produces:

```text
Economic Score
```

from approximately:

```text
0–100
```

where higher values represent relatively stronger economic attractiveness within the available dataset.

This is a **relative prototype score**, not a complete voyage-profit calculation.

A production system should replace the proxy with explicit:

```text
Freight revenue
- Bunker cost
- Port cost
- Waiting cost
- Other voyage expenses
=
Expected voyage economics
```

---

# 16. Cargo Fit Score

The system evaluates how well the vessel capacity matches the cargo quantity.

The score considers cargo utilization.

For example:

```text
Cargo = 70,000 MT
Vessel DWT = 75,000 MT

Utilization ≈ 93.3%
```

This represents a strong cargo fit.

A vessel with:

```text
DWT = 120,000 MT
Cargo = 70,000 MT
```

would have much lower utilization and may therefore be less attractive for the same parcel.

Cargo-fit scoring remains configurable because the ideal utilization depends on commercial and operational conditions.

---

# 17. Port Compatibility Score

The model calculates a:

```text
Port Compatibility Score
```

based on dimensional compatibility with the destination port.

The score considers available checks such as:

* LOA
* Beam
* Draft
* Berth length

A vessel with larger positive safety margins receives a stronger compatibility assessment.

---

# 18. Vessel Suitability Score

The final:

```text
Vessel Suitability Score
```

combines multiple dimensions.

The current prototype uses approximately:

```text
30%  Port Compatibility
25%  Cargo Fit
20%  Operational Risk
25%  Economic Suitability
```

Operational risk is reversed in the final score:

```text
Lower risk → Higher contribution
Higher risk → Lower contribution
```

The result is normalized to:

```text
0–100
```

Interpretation:

```text
0–40      Poor
40–60     Moderate
60–75     Good
75–90     Very Good
90–100    Excellent
```

These weights are configurable prototype assumptions and should be calibrated with operational outcomes as more real data becomes available.

---

# 19. Vessel Ranking

After feasibility and scoring, vessels are ranked using:

1. Feasibility
2. Suitability score
3. Predicted waiting time

The first priority is always feasibility.

Therefore:

```text
Eligible vessel
```

always ranks above:

```text
Ineligible vessel
```

regardless of the ML prediction.

The system can return the:

```text
Top 5 recommended vessels
```

for a selected cargo, route, destination and date.

---

# 20. Example Use Case

Example request:

```text
Cargo:
70,000 MT

Commodity:
Coal

Origin:
Indonesia

Destination:
Paradip

Decision date:
Latest available date
```

The system evaluates candidate vessels.

For every vessel it calculates:

```text
Vessel capability
Cargo utilization
Port compatibility
Draft margin
LOA margin
Beam margin
DWT margin
Predicted waiting time
Operational risk
Economic score
Suitability score
```

The output may look like:

```text
Rank 1
Vessel A
Suitability: 92
Predicted waiting: 16 hours
Port compatibility: 96
Cargo fit: 91
Economic score: 88

Rank 2
Vessel B
Suitability: 87
Predicted waiting: 22 hours
Port compatibility: 90
Cargo fit: 94
Economic score: 82

Rank 3
Vessel C
Suitability: 81
...
```

The actual ranking depends entirely on the supplied data and model outputs.

---

# 21. Model Evaluation

The waiting-time model is evaluated using:

### MAE — Mean Absolute Error

Measures the average absolute prediction error in hours.

Example:

```text
MAE = 12 hours
```

means predictions are, on average, approximately 12 hours away from the observed waiting time.

### RMSE — Root Mean Squared Error

Penalizes larger prediction errors more heavily than MAE.

### R² — Coefficient of Determination

Measures how much variation in observed waiting time is explained by the model relative to a baseline.

---

# 22. Validation Strategy

Because vessel waiting time is time-dependent, the model uses chronological validation.

The data is divided into:

```text
TRAIN
     ↓
VALIDATION
     ↓
TEST
```

rather than randomly shuffling historical observations.

This prevents information from future periods from being mixed into earlier training periods.

The model selection is performed using validation performance.

The test period remains unseen until final evaluation.

---

# 23. Data Leakage Prevention

The system explicitly prevents the following information from becoming model inputs:

* Future freight
* Future freight returns
* Future outcome fields
* Prototype suitability scores
* Prototype eligibility labels
* Recommendation labels
* Scenario-generated feasibility fields
* Target-derived fields

This ensures that the waiting-time prediction is based on information that could reasonably have been available at the time of prediction.

---

# 24. Explainability

The model provides feature-importance information to identify which inputs are most influential for waiting-time prediction.

Where supported, SHAP-based analysis can additionally provide explanations of model behavior.

The purpose is to help answer:

> "Why is this vessel considered more suitable than another vessel?"

Examples of possible factors include:

* Lower predicted waiting time
* Stronger port compatibility
* Better cargo utilization
* Lower operational risk
* Better relative economic conditions

---

# 25. Model Outputs

The Vessel Intelligence output contains information such as:

```text
Vessel name
IMO
Vessel class
Origin
Destination
Cargo type
Cargo quantity

Feasible
Rejection reason

DWT
LOA
Beam
Draft
Vessel age

Cargo utilization
DWT margin
LOA margin
Beam margin
Draft margin
Berth margin

Predicted waiting hours
Operational risk score
Economic score
Cargo fit score
Port compatibility score

Overall suitability score
Recommendation
```

---

# 26. Decision Output

The model classifies candidate vessels into:

```text
TOP_RECOMMENDATION
```

```text
ELIGIBLE_ALTERNATIVE
```

or:

```text
REJECT
```

The final recommended vessels are the highest-ranking feasible candidates.

---

# 27. Relationship With Other Project Models

Vessel Intelligence is one module of the larger freight-chartering platform.

The intended architecture is:

```text
Market Intelligence
        ↓
Freight Forecasting
        ↓
Port Congestion / Waiting Prediction
        ↓
Vessel Intelligence
        ↓
Voyage Economics
        ↓
Chartering Recommendation
```

The modules have different purposes.

### Market Intelligence

Determines:

> What is happening in the freight market?

### Freight Forecasting

Determines:

> What freight rate is expected in the future?

### Port Intelligence

Determines:

> How much congestion or waiting is expected?

### Vessel Intelligence

Determines:

> Which vessels are operationally and economically suitable?

### Chartering Decision Engine

Determines:

> Given all available information, what chartering strategy should be considered?

---

# 28. Relationship With Market Intelligence

The Vessel Intelligence model can later use the Market Intelligence model's output.

For example:

```text
Market regime:
BULLISH

Freight forecast:
RISING

Bunker pressure:
MODERATE

FFA signal:
POSITIVE
```

This can become an additional market-fit component in vessel ranking.

The future architecture is therefore:

```text
Vessel Intelligence
        +
Market Intelligence
        +
Freight Forecast
        +
Port Congestion
        ↓
Chartering Decision
```

---

# 29. Relationship With Freight Forecasting

The freight forecasting model predicts:

```text
7-day freight
30-day freight
60-day freight
90-day freight
```

The Vessel Intelligence system can use those forecasts to determine which vessel is better positioned for the expected market environment.

For example, a vessel class may become more attractive if the corresponding freight market is strengthening.

---

# 30. Current Model Scope

The current model is best considered:

> **A Vessel Feasibility, Waiting-Time Prediction and Suitability Ranking prototype.**

It is already suitable for:

* SIH demonstration
* Research
* Prototype dashboards
* Model experimentation
* Vessel screening
* Port-feasibility analysis
* Comparative vessel ranking

---

# 31. Current Limitations

The current system has several limitations.

### Loading-port limitations

The current master dataset may not contain a specific loading-port identifier for every origin.

Therefore loading-port feasibility can be:

```text
UNKNOWN
```

until detailed origin-port constraints are added.

### Real vessel availability

The model does not yet provide a complete real-time open-tonnage or vessel-availability prediction system.

### Voyage economics

The current economic component may rely on a proxy rather than a complete voyage-margin calculation.

### Historical decision labels

Historical vessel selection is not treated as proof of optimality.

### Market data

Where synthetic or proxy market fields are used, they must be clearly identified and eventually replaced by reliable market observations.

---

# 32. Recommended Future Enhancements

The next development stages should include:

### 1. Exact loading-port data

Add:

```text
loading_port
loading_port_id
loading_port_constraints
```

so both ends of the voyage can be evaluated.

### 2. Real vessel availability

Add:

* Open tonnage
* Position
* ETA
* Next employment
* Ballast status
* Geographic availability

### 3. Better voyage economics

Calculate:

```text
Expected freight revenue
+
Bunker cost
+
Port cost
+
Waiting cost
+
Other voyage expenses
```

to estimate:

```text
Expected voyage margin
Expected TCE
```

### 4. Market integration

Add:

```text
BDI
BPI
BSI
BHSI
BCI
FFA
Bunker
Commodity
```

from the Market Intelligence layer.

### 5. Real-time inference

Connect AIS and port information to continuously update vessel recommendations.

---

# 33. Intended Business Value

The Vessel Intelligence Model helps move the organization from:

```text
Daily manual vessel searching
        ↓
Reactive spot fixture
```

toward:

```text
Predictive analysis
        ↓
Candidate vessel screening
        ↓
Operational risk evaluation
        ↓
Economic comparison
        ↓
Planned chartering decision
```

This can support the broader objective of reducing dependence on repeated individual spot fixtures and evaluating more structured short-term or medium-term multiple-voyage chartering strategies.

---

# 34. Final Interpretation

The Vessel Intelligence Model should be understood as a **decision-support and ranking system**, not as an autonomous chartering system.

Its main question is:

> **"For this cargo, route, port and decision date, which available candidate vessels are physically feasible and comparatively attractive after considering cargo fit, port compatibility, expected waiting time, operational risk and economic suitability?"**

The model therefore combines:

```text
PHYSICAL FEASIBILITY
        +
OPERATIONAL PREDICTION
        +
ECONOMIC ASSESSMENT
        +
VESSEL RANKING
```

to produce a practical shortlist for chartering teams.

---

# 35. One-Line Model Definition

> **Vessel Intelligence predicts expected vessel waiting time and combines it with vessel characteristics, cargo requirements, port constraints, operational conditions and economic indicators to identify and rank the most suitable feasible vessels for a bulk cargo voyage.**
