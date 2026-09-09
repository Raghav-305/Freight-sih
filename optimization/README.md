# Optimization Layer

This directory contains the decision and optimization layer that runs after the ML inference layer. ML models estimate market, freight, congestion, vessel, or risk values. The optimization code then converts those estimates into an operational recommendation such as a contract mix, vessel choice, positioning action, or scenario impact.

The frontend does not solve the optimization problem. It submits inputs to the FastAPI backend, and the backend calls these Python modules.

## 1. ML-to-optimization flow

```text
User inputs
    |
    v
ML inference and reference data
    - freight forecast / current freight
    - market regime
    - waiting-time or congestion estimate
    - vessel suitability and port constraints
    |
    v
Optimization and decision rules
    - charter portfolio LP
    - vessel feasibility and ranking
    - ballast positioning / laycan checks
    - what-if cost calculations
    |
    v
Human-reviewable recommendation
    - allocation or vessel choice
    - expected cost and savings
    - risk and constraint notes
```

The optimizer does not retrain or change the ML model. It consumes model outputs as parameters and applies explicit commercial, operational, and governance constraints.

## 2. Exact linear programming model

The exact charter strategy optimizer is implemented in [charter_strategy.py](charter_strategy.py) in `get_charter_recommendation()`.

### Decision variables

For each contract structure, the LP creates a variable representing the number of voyages allocated to that structure:

- `x_spot`: spot voyages
- `x_3`: 3-voyage contract voyages
- `x_6`: 6-voyage COA voyages
- `x_12`: 12-voyage COA voyages

These variables are non-negative. The current implementation uses `scipy.optimize.linprog`, so they are **continuous variables**, not integer variables. The result is rounded for presentation, but the solve itself is a continuous LP rather than a mixed-integer program.

### Objective function

The solver minimizes total expected cost:

```text
minimize
    c_spot * x_spot
  + c_3    * x_3
  + c_6    * x_6
  + c_12   * x_12
```

The per-voyage coefficient for each contract type is:

```text
contract freight cost
+ bunker cost
+ congestion cost
+ idle cost
+ deadhead cost
+ risk penalty
```

Contract freight cost applies the structure-specific discount to the date-aware spot rate:

```text
contract freight cost = spot_rate * (1 - contract_discount) * cargo_per_voyage
```

Current discounts are:

| Contract structure | Discount |
|---|---:|
| Spot | 0% |
| 3-voyage contract | 3% |
| 6-voyage COA | 6% |
| 12-voyage COA | 9% |

The other cost components are calculated before solving from vessel specifications, route distance, bunker price, port waiting time, voyage duration, and the risk penalty assumption.

### Constraints

#### 1. Cargo demand coverage

The allocation must cover at least the number of voyages needed for the cargo commitment:

```text
x_spot + x_3 + x_6 + x_12 >= voyages_needed
```

`voyages_needed` is calculated as:

```text
ceil(cargo_quantity_mt / cargo_per_voyage_mt)
```

where:

```text
cargo_per_voyage_mt = vessel_dwt * 0.92
```

The 0.92 factor represents the usable cargo portion of vessel DWT in this model.

#### 2. Non-negativity and contract caps

Every allocation is bounded below by zero and above by the smaller of:

```text
contract-specific maximum voyages
and
voyages_needed * max_share
```

The current contract-specific maximums are:

- Spot: `voyages_needed`
- 3-voyage contract: `3`
- 6-voyage COA: `6`
- 12-voyage COA: `12`

#### 3. Diversification cap

`max_share` prevents one contract structure from taking the entire portfolio. With the default `max_share = 0.5`, no single contract type can exceed 50% of the required voyage count.

This is implemented through the upper bounds of each LP variable rather than a separate constraint row.

### Solver

The implementation calls:

```python
scipy.optimize.linprog(
    c_coef,
    A_ub=[[-1.0, -1.0, -1.0, -1.0]],
    b_ub=[-voyages_needed],
    bounds=bounds,
    method="highs",
)
```

The negative inequality is equivalent to the demand constraint:

```text
sum(contract allocations) >= voyages_needed
```

HiGHS returns the optimal continuous allocation when the problem is feasible. The response identifies the result with:

```json
{
  "linear_programming_status": "OPTIMAL",
  "solver": "scipy.optimize.linprog:highs"
}
```

If the solver fails or the model is infeasible, the code uses a fallback plan consisting of the required number of spot voyages and reports:

```json
{
  "linear_programming_status": "FALLBACK"
}
```

## 3. Inputs used by the LP

Before solving, `charter_strategy.py` derives or loads these values:

- Cargo quantity
- Origin and destination, normalized to known ports
- Vessel class and vessel DWT
- Delivery date
- Date-nearest freight rate for the route
- Date-nearest VLSFO bunker price
- Port waiting hours and congestion days
- Laden and ballast distance and duration
- Vessel fuel consumption
- Maximum contract share

The ML layer can provide forecast/current freight and market information. The exact LP currently uses the date-aware freight and bunker/reference tables in `data/charter_strategy/` to construct its cost coefficients.

## 4. Contract optimizer endpoint

The main charter endpoint is:

```text
POST /charter/optimize
POST /api/charter/optimize
```

It is implemented in [backend/app/api/charter.py](../backend/app/api/charter.py) and calls [contract_optimizer.py](contract_optimizer.py).

`contract_optimizer.py` first creates a market-regime-based allocation heuristic:

- Bullish: COA-heavy forward hedge
- Bearish: spot-dominant floating exposure
- Neutral or volatile: balanced multi-tier portfolio

It calculates indicative spot, short-term, multi-voyage, and COA rates, then attempts to enrich the result with the exact HiGHS LP from `charter_strategy.py`. When the LP succeeds and produces savings, its optimized cost, baseline cost, savings, voyage count, and cost breakdown replace the heuristic cost figures.

This wrapper is therefore a **hybrid decision path**:

1. Market-regime rules choose the displayed strategic label and percentage allocation.
2. The exact LP can provide the rigorous voyage-level cost and savings figures.
3. If the LP cannot run, the wrapper returns the heuristic calculation instead.

The separate exact LP endpoint is:

```text
POST /charter/strategy
POST /api/charter/strategy
```

Use this endpoint when the caller needs the direct LP result and solver status.

## 5. Other optimization and decision techniques

Not every module is a linear program in the current implementation.

### Vessel selection: feasibility filtering and ranking

[vessel_selection.py](vessel_selection.py) calls the vessel intelligence inference function, then returns candidates with:

- Port and vessel physical constraint checks
- Predicted waiting time
- Suitability score
- Feasibility flag
- Failed-constraint explanations

This is constraint-based ranking, not LP. It also has a heuristic fallback candidate if the data lookup fails.

### Vessel positioning: deterministic ETA and laycan logic

[positioning.py](positioning.py) calculates ballast distance, steaming time, ETA, and a one-day sea-margin allowance. It then applies rule-based branches:

- Early arrival: recommend eco-steaming
- Arrival inside laycan: maintain positioning
- Late arrival: increase speed or use an alternative vessel

This is a feasibility and rule engine, not LP.

### What-if analysis: deterministic sensitivity calculations

[scenario_engine.py](scenario_engine.py) applies user-specified shocks to:

- Freight rate
- Bunker price
- Port congestion days
- Coverage percentage

It compares baseline and stressed costs and calculates hedging shield savings. This is scenario analysis, not an optimization solver.

## 6. Current limitations and interpretation

- The charter LP is continuous. It does not enforce whole-voyage integer allocations. Use MILP if integer voyages are mandatory.
- The LP currently has one aggregate cargo-coverage constraint and variable upper bounds. It does not yet model detailed time windows, vessel availability, berth capacity, route-specific contract eligibility, or multi-period inventory balance.
- The risk penalty is a fixed coefficient assumption (`2%` of spot freight per voyage), not a learned stochastic optimization term.
- The current COA and contract discounts are deterministic assumptions.
- The LP is cost-minimizing. Market regime and strategic hedge labels are handled by the wrapper's rule-based logic.
- Optimization outputs are recommendations for authorized human review, not autonomous procurement decisions.

## 7. Testing

The LP behavior is covered by:

```text
tests/optimization/test_charter_strategy.py
```

The tests check:

- Feasible and non-increasing optimized cost
- Positive or zero savings
- Required voyage coverage
- Diversification cap compliance
- Port and vessel normalization
- Cost component calculation
- Panamax and Capesize scenarios

Run the focused tests with:

```powershell
python -m pytest tests/optimization/test_charter_strategy.py
```

## 8. If integer or richer optimization is needed later

The next modeling step would be a MILP with integer voyage variables, for example using SciPy's `milp`, OR-Tools, or another approved solver. Candidate additions include:

- Integer voyage counts
- Separate loading and discharge time periods
- Vessel availability and assignment constraints
- Berth and port capacity constraints
- Contract minimum take-or-pay quantities
- Route and vessel compatibility constraints
- Scenario-based or stochastic freight costs
- Explicit risk-budget constraints

Those additions should be made in the optimization layer while keeping ML inference responsible for predictions and uncertainty estimates.
