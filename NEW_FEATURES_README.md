# New Features Specification: Blockchain Anchoring, Counterfactuals & Bid Collusion Detection

This document provides a comprehensive technical guide to the major capability suites introduced to the **Freight Chartering Intelligence Platform**:

1. **[External Blockchain Audit Anchoring (Polygon Amoy Testnet)](#1-external-blockchain-audit-anchoring-polygon-amoy-testnet)**: Cryptographic Merkle tree anchoring of decision hash chains onto the Polygon Amoy blockchain for external, tamper-evident governance verification.
2. **[Counterfactual Explanations & Sensitivity Hub (Layer 6)](#2-counterfactual-explanations--sensitivity-hub-layer-6)**: Systematic algorithmic perturbation search answering *"What is the smallest operational or market change that flips a charter decision or de-risks a route?"*
3. **[Bid Anomaly & Collusion Detection (Anti-Rigging Engine)](#3-bid-anomaly--collusion-detection-anti-rigging-engine)**: XGBoost rare-event detection and SHAP TreeExplainer attributions identifying bid-rigging, cover bidding, and uncompetitive broker collusion in public tenders.


---

## High-Level Architecture & End-to-End Flow

```mermaid
flowchart TD
    subgraph Layer1to5["Core Intelligence & Optimization Layers"]
        A[Cargo & Route Tender Specs] --> B[ML Freight Rate Forecasting\nXGBoost / LightGBM]
        A --> C[Route Risk Assessment Engine\n6 Risk Dimensions]
        B & C --> D[Charter Strategy Optimizer\nHiGHS Linear Programming]
    end

    subgraph Layer6["Layer 6: Explainability & What-If Hub (New Feature 2)"]
        C --> E[Risk Counterfactual Engine\nSystematic Factor Perturbation]
        D --> F[Charter Cost Sensitivity Engine\nBunker, Congestion, Spot Shifts]
        E & F --> G[Interactive What-If Sandbox\nReal-Time Dynamic Simulation]
    end

    subgraph Governance["Dual-Officer CVC Governance (Pillar 3)"]
        D & G --> H[Decision Timeline Event Chain\nSHA-256 Chained decision_events]
        H --> I[Dual Officer Authorization\nReviewer 1 & Reviewer 2 Sign-off]
    end

    subgraph Blockchain["External Blockchain Anchoring (New Feature 1)"]
        H --> J[Batch Unanchored Events]
        J --> K[Compute 32-Byte Merkle Root]
        K --> L[0-Value Transaction on Polygon Amoy\nChain ID 80002]
        L --> M[PolygonScan Public Verification\nImmutable External Audit Proof]
    end
```

---

## 1. External Blockchain Audit Anchoring (Polygon Amoy Testnet)

### 1.1 Objective & Governance Scope
In public procurement and maritime chartering under Central Vigilance Commission (CVC) and Comptroller and Auditor General (CAG) guidelines, maintaining an immutable, tamper-evident audit trail is critical. While internal database logs can be manipulated by privileged database administrators, **External Blockchain Anchoring** provides mathematical certainty that historical decision records have not been altered.

> [!IMPORTANT]
> **Governance Scope:**
> Anchoring covers exclusively the hash-chained `decision_events` table (the Pillar 3 decision lifecycle: `CREATED` $\rightarrow$ `ANALYSED` $\rightarrow$ `SUBMITTED_FOR_REVIEW` $\rightarrow$ `APPROVED` / `RETURNED` / `REJECTED`).
> It deliberately does **not** cover the legacy `AuditLogRecord` table (`/audit/logs`), which is not hash-chained.

### 1.2 Cryptographic Pipeline & Design Principles

```mermaid
sequenceDiagram
    autonumber
    participant UI as CVC Governance UI (AnchorStatus.tsx)
    participant API as FastAPI Backend (/api/audit/anchor)
    participant DB as SQLite DB (decision_events)
    participant Poly as Polygon Amoy Testnet (RPC)
    participant Explorer as PolygonScan Explorer

    UI->>API: POST /api/audit/anchor ("Anchor now")
    API->>DB: Query unanchored decision_events (event_id > last_anchor)
    DB-->>API: Return batch of events (up to 1,000)
    API->>API: Extract SHA-256 current_hash leaves
    API->>API: Compute pairwise SHA-256 Merkle Root (32 bytes)
    API->>Poly: Broadcast 0-value transaction (Data = 0x<merkle_root>)
    Poly-->>API: Transaction Hash + Block Confirmation
    API->>DB: Record in audit_anchors (tx_hash, block, root, status)
    API-->>UI: Return HTTP 200 with AnchorStatus (CONFIRMED / PENDING)
    UI->>Explorer: View On-Chain (Verify input data matches local root)
```

1. **Local Hash Chain Leaves**: Each event row in `decision_events` carries a SHA-256 hash chaining its predecessor:
   $$\text{current\_hash} = \text{SHA256}(\text{decision\_id} \,\|\, \text{event\_type} \,\|\, \text{actor} \,\|\, \text{role} \,\|\, \text{prev\_hash} \,\|\, \text{payload\_json})$$
2. **Merkle Tree Aggregation**: All unanchored leaves are aggregated into a binary Merkle tree. If the number of leaves is odd, the last leaf is duplicated to balance the pair:
   $$\text{Parent} = \text{SHA256}(\text{Left} \,\|\, \text{Right})$$
   The root is reduced to a single 32-byte hexadecimal string.
3. **Zero-Value On-Chain Transaction**: The backend signs a transaction from a configured wallet to itself on the Polygon Amoy testnet (`chainId: 80002`). The 32-byte Merkle root is attached directly as the transaction input `data`. No expensive smart contract deployment or maintenance is needed; the transaction itself serves as an immutable public timestamp.
4. **Local Audit Ledger**: The transaction metadata (`anchor_id`, `merkle_root`, `first_event_id`, `last_event_id`, `event_count`, `tx_hash`, `block_number`, `status`) is recorded in the local SQLite table `audit_anchors`.

### 1.3 Air-Gapped & Offline-First Resilience

The system adheres strictly to the offline / air-gapped specification:
- **Zero Runtime Interruption**: Core forecasting, optimization, and local audit logging never import or await the blockchain module.
- **Lazy Web3 Initialization**: `web3` is imported dynamically. If `web3` is uninstalled, internet is disconnected, or no wallet private key is supplied, the backend starts without failure.
- **Fail-Safe Statuses**: The endpoint always returns HTTP 200 with explicit statuses: `ANCHORED`, `PENDING`, `OFFLINE`, `NOT_CONFIGURED`, `NOTHING_TO_ANCHOR`, or `BUSY`.

### 1.4 API Endpoints Reference

#### `GET /api/audit/anchor-status`
Returns the current blockchain anchoring state, unanchored count, and the latest transaction link. Operates entirely against the local database, working 100% offline.

**Response (HTTP 200):**
```json
{
  "network": "Polygon Amoy Testnet",
  "state": "ANCHORED",
  "configured": true,
  "web3_installed": true,
  "unanchored_events": 0,
  "latest_anchor": {
    "anchor_id": 1,
    "merkle_root": "8f3b2a1c7d...",
    "event_count": 5,
    "tx_hash": "0x4b7c89f...",
    "block_number": 14298123,
    "status": "CONFIRMED",
    "error": null,
    "created_at": "2026-09-20T14:30:00Z",
    "explorer_url": "https://amoy.polygonscan.com/tx/0x4b7c89f..."
  },
  "last_attempt": null,
  "scope_note": "Anchoring covers ONLY the hash-chained decision_events (Pillar 3 decision timeline)."
}
```

#### `POST /api/audit/anchor`
Triggers an immediate batch anchor. Always returns HTTP 200 with a detailed message and status.

**Response (HTTP 200):**
```json
{
  "status": "ANCHORED",
  "message": "Anchored 5 events in tx 0x4b7c89f... (block 14298123)",
  "unanchored_events": 0
}
```

#### `GET /api/audit/anchor/{anchor_id}/verify?onchain=false`
Verifies that local database events have not been tampered with by recomputing the Merkle root over the original event ID range and comparing it with `merkle_root`. Passing `?onchain=true` additionally contacts Polygon Amoy RPC to ensure the on-chain input data matches the local Merkle root.

**Response (HTTP 200):**
```json
{
  "anchor_id": 1,
  "event_count": 5,
  "stored_root": "8f3b2a1c7d...",
  "recomputed_root": "8f3b2a1c7d...",
  "local_match": true,
  "onchain_checked": true,
  "onchain_match": true,
  "tx_hash": "0x4b7c89f..."
}
```

### 1.5 Frontend Component
- **Component File**: [AnchorStatus.tsx](file:///c:/trash/sih/freight-chartering-v4/frontend/src/components/AnchorStatus.tsx)
- **Location in App**: Mounted inside the **CVC Governance** tab below the SHA-256 Decision Timeline.
- **UI Capabilities**:
  - Displays dynamic badges (`OPTIONAL · requires internet`, `ANCHORED`, `OFFLINE`).
  - Displays unanchored event count in real time.
  - One-click **"Anchor now"** action with loading spinners and error handling.
  - Direct hyperlink to PolygonScan testnet explorer (`https://amoy.polygonscan.com/tx/...`).

### 1.6 Configuration & Setup
1. **Dependencies**: `pip install web3 eth-account` (included in `backend/requirements.txt`).
2. **Create throwaway wallet**:
   ```bash
   python -c "from eth_account import Account; a=Account.create(); print('Address:', a.address); print('Key:', a.key.hex())"
   ```
3. **Get Free Testnet POL**: Obtain test POL from [Polygon Faucet](https://faucet.polygon.technology/) (Select *Polygon Amoy*).
4. **Environment Variables** (`.env`):
   ```env
   AMOY_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   ANCHOR_INTERVAL_MINUTES=0  # 0 = manual UI button only; >0 = periodic background anchor
   ```

---

## 2. Counterfactual Explanations & Sensitivity Hub (Layer 6)

### 2.1 Objective: Beyond Black-Box Predictions
Standard AI models output point estimates or static allocations (e.g., *"Overall risk is 64/100"* or *"Charter recommendation is 60% Spot / 40% COA"*). They fail to answer operational questions required by government committees:
- *"What specific operational change would flip this route from High Risk to Low Risk?"*
- *"If bunker prices increase by 10%, does our contract strategy break?"*
- *"What is our single biggest lever for capital savings?"*

**Layer 6 Counterfactual Explanations** implements systematic perturbation search on top of the **Route Risk Engine** and the **HiGHS Linear Programming Charter Optimizer**, discovering minimal input changes that alter outcomes.

---

### 2.2 Route Risk Counterfactual Explainer

#### Algorithmic Logic
The Route Risk Engine evaluates 6 composite dimensions:
1. `market` (FFA volatility, freight swings)
2. `port` (draft, beam constraints, terminal congestion)
3. `weather` (cyclone season, wave heights, adverse currents)
4. `geopolitical` (sanctions, regional conflict, choke point exposure)
5. `supply` (vessel availability, deadweight tonnage supply in region)
6. `contract` (counterparty default risk, laytime dispute terms)

To identify actionable de-risking levers, the explainer executes a systematic perturbation:
1. Computes baseline multi-factor risk scores.
2. For each factor $i \in \{1 \dots 6\}$, creates a counterfactual hypothetical where factor $i$ resolves to the baseline low-risk floor ($10.0$).
3. Re-evaluates composite overall risk: $\Delta_i = \text{Overall}_{\text{baseline}} - \text{Overall}_{\text{hypothetical}}$.
4. Sorts factors in descending order of $\Delta_i$. The factor with the highest drop is flagged as the **Biggest Lever**.

#### API Request & Response Example
- **Endpoint**: `POST /api/counterfactual/risk`
- **Source**: [counterfactual.py](file:///c:/trash/sih/freight-chartering-v4/backend/app/api/counterfactual.py), [counterfactual_service.py](file:///c:/trash/sih/freight-chartering-v4/backend/app/services/counterfactual_service.py)

**Request:**
```json
{
  "route_id": "RUS_PAR_PAN",
  "origin_country": "Russia",
  "destination_port": "PAR",
  "date": "2022-06-19"
}
```

**Response:**
```json
{
  "baseline": {
    "route_id": "RUS_PAR_PAN",
    "origin_country": "Russia",
    "destination_port": "PAR",
    "date": "2022-06-19",
    "overall": 65.5,
    "market": 42.0,
    "port": 35.0,
    "weather": 15.0,
    "geopolitical": 88.0,
    "supply": 50.0,
    "contract": 70.0
  },
  "biggest_lever": "geopolitical",
  "counterfactuals": [
    {
      "factor": "geopolitical",
      "current_score": 88.0,
      "if_resolved_overall_becomes": 43.1,
      "overall_drops_by": 22.4
    },
    {
      "factor": "contract",
      "current_score": 70.0,
      "if_resolved_overall_becomes": 51.2,
      "overall_drops_by": 14.3
    },
    {
      "factor": "supply",
      "current_score": 50.0,
      "if_resolved_overall_becomes": 56.7,
      "overall_drops_by": 8.8
    },
    {
      "factor": "market",
      "current_score": 42.0,
      "if_resolved_overall_becomes": 58.9,
      "overall_drops_by": 6.6
    },
    {
      "factor": "port",
      "current_score": 35.0,
      "if_resolved_overall_becomes": 60.3,
      "overall_drops_by": 5.2
    },
    {
      "factor": "weather",
      "current_score": 15.0,
      "if_resolved_overall_becomes": 64.2,
      "overall_drops_by": 1.3
    }
  ],
  "summary_insight": "Primary risk lever is 'GEOPOLITICAL'. Resolving this factor to baseline (10.0) drops overall route risk from 65.5 down to 43.1 (-22.4 pts)."
}
```

---

### 2.3 Charter Strategy Cost Sensitivity Explainer

#### Algorithmic Logic
The Charter Strategy optimizer employs the **HiGHS Mixed-Integer / Linear Programming solver** to determine the cost-minimal distribution across Spot fixtures, Contract of Affreightment (COA), and Period Time Charters.

The counterfactual engine performs sensitivity grid searches across three primary market variables:
1. **Bunker Fuel Price Shifts**: $\{-2\%, -5\%, -8\%, -12\%, -20\%\}$
2. **Port Waiting / Congestion Delays**: $\{-0.5\text{ days}, -1.0\text{ days}, -1.5\text{ days}, -2.0\text{ days}, -3.0\text{ days}\}$
3. **Spot Freight Softening**: $\{-2\%, -5\%, -8\%, -12\%, -20\%\}$

For each perturbation step, it calculates:
- `new_cost_usd`: Re-optimized procurement expenditure.
- `saving_usd`: Absolute capital expenditure reduction ($\text{Baseline Cost} - \text{New Cost}$).
- `mix_changed`: Boolean flag indicating if any contract type share moved by $>5$ percentage points.

> [!NOTE]
> **Structural Design Insight**:
> In standard cost models where contract discounts are fixed percentages and demurrage/bunker costs apply proportionally, contract mix rankings remain robust against minor price fluctuations; cargo parcel volume relative to voyage caps is the primary driver of contract mix switches. Therefore, the engine highlights **exact dollar savings** as the authentic, honest sensitivity metric.

#### API Request & Response Example
- **Endpoint**: `POST /api/counterfactual/charter`

**Request:**
```json
{
  "origin_port": "Gladstone",
  "destination_port": "PAR",
  "vessel_class": "Panamax",
  "cargo_quantity_mt": 480000,
  "delivery_date": "2024-06-15"
}
```

**Response:**
```json
{
  "baseline": {
    "origin_port": "Gladstone",
    "destination_port": "PAR",
    "vessel_class": "Panamax",
    "cargo_quantity_mt": 480000.0,
    "optimized_cost_usd": 12840000.0,
    "recommended_mix_pct": { "spot": 60.0, "coa": 40.0, "time_charter": 0.0 }
  },
  "biggest_lever": "spot_rate",
  "cost_sensitivity": [
    { "lever": "bunker_price", "change": "-2%", "new_cost_usd": 12795000.0, "saving_usd": 45000.0, "mix_changed": false },
    { "lever": "bunker_price", "change": "-20%", "new_cost_usd": 12390000.0, "saving_usd": 450000.0, "mix_changed": false },
    { "lever": "congestion", "change": "-1.0 days", "new_cost_usd": 12720000.0, "saving_usd": 120000.0, "mix_changed": false },
    { "lever": "congestion", "change": "-3.0 days", "new_cost_usd": 12480000.0, "saving_usd": 360000.0, "mix_changed": false },
    { "lever": "spot_rate", "change": "-2%", "new_cost_usd": 12690000.0, "saving_usd": 150000.0, "mix_changed": false },
    { "lever": "spot_rate", "change": "-20%", "new_cost_usd": 11340000.0, "saving_usd": 1500000.0, "mix_changed": false }
  ],
  "note": "Contract mix is stable under these levers in the current cost model...",
  "summary_insight": "The single most impactful cost lever is 'SPOT RATE', unlocking up to $1,500,000 in capital savings under tested market shifts."
}
```

---

### 2.4 Interactive What-If Simulation Sandbox

For custom scenario analysis, chartering officers can manipulate simulation parameters directly:

#### 1. Custom Risk What-If (`POST /api/counterfactual/risk/simulate`)
Simulates custom overrides for any combination of the 6 sub-scores.
```json
// Request
{
  "route_id": "AUS_PAR_PAN",
  "origin_country": "Australia",
  "destination_port": "PAR",
  "date": "2024-06-15",
  "overrides": { "weather": 10.0, "port": 15.0 }
}
```

#### 2. Custom Charter What-If (`POST /api/counterfactual/charter/simulate`)
Simulates real-time percentage shifts in fuel, port congestion days, and freight rates.
```json
// Request
{
  "origin_port": "Gladstone",
  "destination_port": "PAR",
  "vessel_class": "Panamax",
  "cargo_quantity_mt": 480000,
  "delivery_date": "2024-06-15",
  "bunker_pct_change": -8.5,
  "congestion_days_delta": -1.2,
  "spot_rate_pct_change": -4.0
}
```

---

### 2.5 Frontend UI Components
- **Page Component**: [CounterfactualPage.tsx](file:///c:/trash/sih/freight-chartering-v4/frontend/src/components/pages/CounterfactualPage.tsx)
- **Navigation**:
  - Accessible via Sidebar (`Counterfactuals (L6)` with `GitBranch` icon).
  - Quick launch via Command Palette (`Ctrl + K` $\rightarrow$ `Counterfactuals (Layer 6)`).
  - Linked directly from [RiskIntelligencePage.tsx](file:///c:/trash/sih/freight-chartering-v4/frontend/src/components/pages/RiskIntelligencePage.tsx) via the *"Inspect Counterfactual De-risking Levers"* callout.
- **UI Highlights**:
  - Mode Switcher: Toggle between **Risk Decision Explainer**, **Charter Cost Sensitivity**, and **Interactive Sandbox**.
  - Dynamic KPI cards showing maximum points dropped and maximum capital saved.
  - Interactive range sliders for Bunker Fuel, Congestion Days, and Spot Rates with instant recalculation.

---

## 3. Verification & Automated Test Suite

Both new features include dedicated pytest unit and integration suites verifying deterministic computation, error boundaries, and offline safety.

### 3.1 Test Files
- [test_anchoring.py](file:///c:/trash/sih/freight-chartering-v4/tests/test_anchoring.py): Tests Merkle tree ordering, unanchored counting, mock transaction generation, offline fallbacks, and local verification.
- [test_counterfactual_endpoints.py](file:///c:/trash/sih/freight-chartering-v4/tests/backend/test_counterfactual_endpoints.py): Tests risk perturbation ranking, port name normalizations, charter sensitivity matrix, and custom what-if simulation endpoints.

### 3.2 Executing the Tests
Run pytest using the local virtual environment:

```powershell
.venv\Scripts\python -m pytest tests/test_anchoring.py tests/backend/test_counterfactual_endpoints.py -v
```

**Expected Test Output:**
```text
collected 16 items

tests/test_anchoring.py::test_merkle_root_is_deterministic_and_order_sensitive PASSED   [  6%]
tests/test_anchoring.py::test_not_configured_without_key PASSED                         [ 12%]
tests/test_anchoring.py::test_nothing_to_anchor_when_empty PASSED                       [ 18%]
tests/test_anchoring.py::test_anchor_covers_batch_then_only_new_events PASSED          [ 25%]
tests/test_anchoring.py::test_anchor_offline_error_handling PASSED                      [ 31%]
tests/test_anchoring.py::test_verify_anchor_local_tamper_detection PASSED               [ 37%]
tests/test_anchoring.py::test_api_anchor_status_endpoint PASSED                         [ 43%]
tests/test_anchoring.py::test_api_anchor_now_endpoint PASSED                            [ 50%]
tests/test_anchoring.py::test_api_verify_endpoint PASSED                                [ 56%]
tests/backend/test_counterfactual_endpoints.py::test_risk_counterfactual_endpoint PASSED  [ 62%]
tests/backend/test_counterfactual_endpoints.py::test_risk_counterfactual_with_full_port_name PASSED [ 68%]
tests/backend/test_counterfactual_endpoints.py::test_charter_counterfactual_endpoint PASSED [ 75%]
tests/backend/test_counterfactual_endpoints.py::test_custom_risk_simulation_endpoint PASSED [ 81%]
tests/backend/test_counterfactual_endpoints.py::test_custom_charter_simulation_endpoint PASSED [ 87%]
tests/backend/test_counterfactual_endpoints.py::test_risk_counterfactual_invalid_route PASSED [ 93%]
tests/backend/test_counterfactual_endpoints.py::test_charter_counterfactual_invalid_cargo PASSED [100%]

============================== 16 passed in 10.66s ==============================
```

---

## 3. Bid Anomaly & Collusion Detection (Anti-Rigging Engine)

### 3.1 Objective & Anti-Collusion Governance
In public freight procurement under Central Vigilance Commission (CVC) and Competition Commission of India (CCI) guidelines, cartels frequently deploy **bid-rigging schemes**:
- **Cover Bidding / Courtesy Bidding**: Conspiring brokers submit deliberately inflated quotes (e.g. 20% to 35% above fair value) to create an illusion of genuine competition while protecting a designated winning bidder.
- **Bid Suppression & Rotation**: Brokers take turns submitting competitive quotes on certain routes while submitting uncompetitive bids on others.
- **Artificial Premium Spreads**: Uncompetitive pricing clusters outside fair-value corridors.

The **Bid Anomaly & Collusion Detection Engine** (`bid_anomaly_detection_v1`) provides machine-learning screening and **SHAP TreeExplainer attributions** to audit tender submissions, identify statistical collusion anomalies, and dramatically reduce false alarms for human vigilance officers.

### 3.2 Machine Learning Architecture
- **Model Type**: XGBoost Classifier (`XGBClassifier`) with rare-event class balancing (`scale_pos_weight: 36.9`).
- **Feature Pipeline**:
  - **Categorical (OneHotEncoded)**: `origin`, `destination_port`, `cargo_type`, `vessel_class`, `route_id`.
  - **Numerical (20 Features)**: `quantity_mt`, `quoted_freight_usd_mt`, `bid_rank`, `winner`, `contract_duration_days`, `market_freight_usd_mt`, `predicted_fair_value_usd_mt`, `fair_value_lower_usd_mt`, `fair_value_upper_usd_mt`, `bid_deviation_pct`, `bunker_price_usd_mt`, `congestion_index`, `predicted_waiting_hours`, `broker_historical_bid_count`, `broker_historical_premium_pct`, `vessel_historical_bid_count`, `broker_vessel_historical_frequency`, `bid_spread_pct`, `fair_value_band_breach`, `high_positive_deviation_flag`.
- **Explainability**: SHAP TreeExplainer decomposing bid anomaly probabilities into exact log-odds contributions (`toward_suspicious` vs `toward_normal`) and human-readable natural language narratives.
- **Benchmarking vs Naive Rule-of-Thumb**: While naive band breach rules flag ~128 bids in test splits (with high false alarm rates and only 26.6% precision), the XGBoost model achieves **100% precision and 100% recall** on true anomalies, reducing false alarms by **73.4%**.

### 3.3 API Endpoints Reference
- `GET /api/collusion/tenders`: Lists historical and active procurement tenders with summary integrity badges.
- `GET /api/collusion/tenders/{tender_id}`: Retrieves full tender details, broker bids, fair-value bands, and individual anomaly risk meters.
- `POST /api/collusion/score-bid`: Scores an individual bid payload.
- `POST /api/collusion/score-tender`: Batch scores all bids in a tender, logging flagged collusion events to `audit_logs`.
- `POST /api/collusion/explain-bid`: Generates SHAP TreeExplainer waterfall feature contributions and natural language audit narrative.
- `POST /api/collusion/simulate`: Interactive what-if simulation on custom bid quotes and market spreads.
- `GET /api/collusion/performance`: Returns model evaluation metrics, confusion matrix, and feature importances.

### 3.4 Frontend UI & Integration
- **Page Component**: [`frontend/src/components/pages/BidAnomalyPage.tsx`](file:///c:/trash/sih/freight-chartering-v4/frontend/src/components/pages/BidAnomalyPage.tsx)
- **Navigation**: Mounted in `GovSidebar.tsx` under **Pillar 3: Governance & Assurance** (`Bid Anomaly & Collusion`) and searchable in `CommandPalette.tsx`.
- **Capabilities**:
  - **Tender Anomaly Inspector**: Interactive broker submissions table with live anomaly risk meters and SHAP drawers.
  - **Interactive Bid Simulator**: Sliders to test quote deviations, broker premiums, and congestion against the trained XGBoost model.
  - **Model Benchmark & Governance**: Live metrics comparing ML precision vs naive rule of thumb.

---

## 4. Verification & Automated Test Suite

All three feature modules include automated pytest suites:
- [`tests/test_anchoring.py`](file:///c:/trash/sih/freight-chartering-v4/tests/test_anchoring.py): Merkle tree ordering, offline fallbacks, and local verification.
- [`tests/backend/test_counterfactual_endpoints.py`](file:///c:/trash/sih/freight-chartering-v4/tests/backend/test_counterfactual_endpoints.py): Risk perturbation ranking, LP sensitivity, and custom what-if simulation.
- [`tests/backend/test_collusion_endpoints.py`](file:///c:/trash/sih/freight-chartering-v4/tests/backend/test_collusion_endpoints.py): Tender listing, bid scoring, SHAP explainability, and what-if bid simulation.

### Executing the Tests
```powershell
.venv\Scripts\python -m pytest tests/test_anchoring.py tests/backend/test_counterfactual_endpoints.py tests/backend/test_collusion_endpoints.py -v
```

**Result:** `22 passed in 7.78s`

---

## 5. SIH Jury & Hackathon Demonstration Guide (3-Minute Script)

When showcasing the system to evaluators or tender review committees, follow this script:

### Step 1: Explainability with Layer 6 Counterfactuals (60 Seconds)
1. Open **Counterfactuals (L6)**.
2. Select a high-risk route (`RUS_PAR_PAN`) and run systematic counterfactual search.
3. Show how mitigating Geopolitical Risk drops composite route risk by 22.4 points.
4. Show Charter Cost Sensitivity: a 3-day congestion mitigation saves $360,000.

### Step 2: Bid Anomaly & Collusion Detection (60 Seconds)
1. Navigate to **Bid Anomaly & Collusion** under Pillar 3.
2. Select an anomalous tender (e.g. `TND-2023-0019`).
3. Show the **Broker Submissions Table**: point out the `FLAGGED` cover bids with 99.9% anomaly risk.
4. Click **SHAP**: show the visual TreeExplainer attribution proving that deviation from fair value (+5.59) and tight artificial spread (+1.55) pushed the bid into the suspicious category.
5. Open **Interactive Bid Simulator**: move quoted freight up and down to show real-time probability recalculation.
6. Open **Model Benchmark**: highlight that ML flags 73.4% fewer false alarms than naive band-breach rules.

### Step 3: CVC Dual Authorization & External Blockchain Anchoring (60 Seconds)
1. Open **CVC Governance**.
2. Create and approve a decision through two-officer sign-off.
3. Click **"Anchor now"** to compute the 32-byte Merkle root and post it to Polygon Amoy testnet.
4. Click **"View on-chain"** to show the live PolygonScan transaction and immutable timestamp.

