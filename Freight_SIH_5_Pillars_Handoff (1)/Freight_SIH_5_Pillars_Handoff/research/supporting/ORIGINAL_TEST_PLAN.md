## v2 note
Every item below is now implemented as a passing pytest in
`11_REFERENCE_IMPLEMENTATION/tests/` (21 tests, run with
`pytest tests/ -v`). File names: test_economics.py (P1), test_map.py (P2),
test_audit.py + test_decisions.py + test_reports.py (P3), test_eligibility.py (P4).
P5 items are UI-behavioural and are left for Raghav to cover with a
frontend test pass once the components are integrated into the real shell.

P1
- zero/negative GCV rejected
- missing GCV gives landed cost but no energy-normalized cost
- sensitivity changes result

P2
- static map renders offline
- failed adapter cannot label stale data LIVE
- simulated queue has DEMO_SIMULATION tag

P3
- submitted snapshot immutable
- approval requires authorized workflow role
- audit hash detects mutation
- report reproduces snapshot

P4
- Paradip berth examples produce expected states
- missing vessel dimension => UNKNOWN
- delay exposure != contractual demurrage

P5
- stale indicator visible
- blocked eligibility visible above fold
- provenance drill-down available
