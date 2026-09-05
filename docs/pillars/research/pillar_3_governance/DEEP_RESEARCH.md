# Pillar 3 — CVC/GFR-oriented Governance and Human-in-the-Loop

## Research conclusion
A disclaimer alone is weak. Governance must exist as workflow and evidence structure.

## Required banner
"Decision-Support System Only. Final chartering or procurement action requires review and approval by an authorized officer under the applicable delegation and procurement framework."

Do not claim that this sentence itself makes the system legally compliant.

## Workflow
DRAFT
→ ANALYSED
→ SUBMITTED_FOR_REVIEW
→ APPROVED | RETURNED | REJECTED

Rules:
- creator cannot silently convert a submitted snapshot
- approval records actor/role/time/reason
- rejection requires reason
- returned decisions preserve prior evidence
- a material input change creates a new analysis version

## Immutable decision snapshot
decision_id
analysis_version
input_hash
model_version
model_artifact_hash
forecast_quantiles
explanation_reference
physical_constraint_result
source_versions
created_at

## Audit hash chain
event.current_hash = SHA256(previous_hash + canonical_event_payload)

This is tamper-evident, not magical legal certification.

## Tender/Justification report sections
1 purpose and cargo
2 alternatives evaluated
3 economic comparison
4 forecast uncertainty P10/P50/P90
5 explanation/SHAP only if actually computed
6 vessel-port feasibility
7 route/weather/chokepoint risk
8 data freshness and provenance
9 assumptions and exceptions
10 review/approval history

## Critical wording
Use "audit-ready evidence package" rather than "CVC-compliant certificate".
