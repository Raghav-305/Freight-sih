# Optional External Audit Anchoring (Polygon Amoy testnet)

> **Scope - please read.** Anchoring covers **only the hash-chained `decision_events`**
> (the Pillar 3 decision timeline: CREATED -> ANALYSED -> SUBMITTED_FOR_REVIEW ->
> APPROVED / RETURNED / REJECTED, implemented in `backend/app/services/audit.py`).
> It does **not** cover the legacy `AuditLogRecord` table (the "Immutable Audit Trail"
> table on the CVC Governance tab, served by `/audit/logs` and written by `/audit/review`).
> That legacy table is **not hash-chained** and is **not anchored**.

## What it does

The local SHA-256 hash chain proves tampering *internally*. Anchoring makes it *externally verifiable*:

1. Take all `decision_events` created since the last anchor (across all decisions).
2. Build a Merkle tree over their existing `current_hash` values -> one 32-byte **Merkle root**.
3. Send one 0-value transaction on Polygon Amoy (testnet) with that root as the transaction data.
4. Save `tx_hash`, block number, timestamp and the covered `event_id` range in the local
   table `audit_anchors`.

Anyone can later recompute the root from the local events and compare it with the root visible
in the "Input Data" field of the transaction on Amoy PolygonScan. If any covered event was
altered or deleted, the roots no longer match. The anchor proves the batch existed unchanged at
the block time - it does not prove anything about events written after it, or about the legacy table.

## Why it is optional

The platform is designed to run fully offline. Anchoring is the only feature that needs internet.
Nothing else imports it: forecasting, recommendations, and audit logging never call it and never
wait for it. Without a key, without `web3`, or without internet, the rest of the system behaves
exactly as before and the UI simply shows "Not anchored / offline".

## Setup (5 steps)

1. `pip install -r backend/requirements.txt` (adds `web3`).
2. Create a **throwaway** wallet:
   `python -c "from eth_account import Account; a=Account.create(); print(a.address); print(a.key.hex())"`
3. Get free test POL for that address from the Polygon faucet (https://faucet.polygon.technology/, choose
   *Polygon Amoy*). The faucet is rate-limited (roughly one request per 24 h), so **do this a day
   before a demo**. The Alchemy or Chainlink Amoy faucets are fallbacks. One anchor costs a tiny
   fraction of a POL.
4. Copy `.env.example` to `.env` and set `AMOY_PRIVATE_KEY=0x...` (optionally `AMOY_RPC_URL`,
   `ANCHOR_INTERVAL_MINUTES`). `.env` is git-ignored.
5. Start the backend and open **CVC Governance**. Click **Anchor now**.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/audit/anchor-status` | Latest anchor, explorer link, unanchored count. Local DB only, works offline. |
| POST | `/audit/anchor` | "Anchor now". Always HTTP 200 with a `status` field. |
| GET | `/audit/anchor/{id}/verify` | Recompute root locally and compare. `?onchain=true` also checks the tx (needs internet). |

`status` values: `ANCHORED`, `PENDING`, `OFFLINE`, `FAILED`, `NOT_CONFIGURED`, `NOTHING_TO_ANCHOR`, `BUSY`.

## Demo script (about 2 minutes)

1. *Say first:* "This anchors the **decision_events hash chain** - the decision workflow timeline. The older
   'Immutable Audit Trail' table above it is a plain log and is **not** hash-chained or anchored."
2. Open **CVC Governance**, scroll to the SHA-256 timeline, click **+ Create New Decision Case**, then
   walk it through Mark Analysed -> Submit For Review -> Approve (with the second officer).
3. Scroll to **External Blockchain Anchor**. Point out the **OPTIONAL - requires internet** badge and the
   "N new events" counter.
4. Click **Anchor now**. Wait ~10-40 s. The line changes to "Last anchored externally: ... - View on-chain".
5. Click **View on-chain**: show the transaction on Amoy PolygonScan and the Merkle root in Input Data.
6. Optional tamper story: open `GET /audit/anchor/1/verify` -> `local_match: true`.
7. Optional offline story: disconnect Wi-Fi, click **Anchor now** -> red "Not anchored - offline";
   create/approve another decision to show the core system keeps working. Reconnect and anchor again.

## Limits to state honestly

- Testnet only: no legal or financial weight. It demonstrates the mechanism.
- Only `decision_events` are covered (see the scope note above).
- Events created after the last anchor are not covered until the next anchor.
- Public RPC endpoints can be rate-limited; set `AMOY_RPC_URL` to another provider if needed.
