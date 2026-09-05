Data model:
PortConstraint(
port_id, berth_id, commodity, max_loa_m, max_beam_m,
base_max_draft_m, conditional_draft_m, condition_type,
effective_from, effective_to, source_url, source_version, verified_at)

POST /api/ports/eligibility
POST /api/delay/exposure
POST /api/demurrage/estimate

Return:
status
reasons[]
checks[]
evidence[]
warnings[]
freshness

Priority:
berth-specific rule > current port notice > generic port reference
