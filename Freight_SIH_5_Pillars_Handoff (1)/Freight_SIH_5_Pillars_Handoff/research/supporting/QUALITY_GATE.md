## v2 note
`11_REFERENCE_IMPLEMENTATION/` was checked against every line of this gate
before packaging: all features map to one of the five pillars, source
fact vs engineering inference stays distinguishable in code comments,
no live data is faked (IMD adapter mocked and clearly labelled
DEMO_SIMULATION), no port constraints beyond Paradip are invented,
provenance/timestamp handling exists in every response, every endpoint
here has a matching IMPLEMENTATION_SPEC.md contract, failure states are
defined (map adapter failure, illegal decision transitions, missing GCV),
and acceptance tests exist and pass (21/21).

A feature passes only if:
[ ] belongs to one of the five pillars
[ ] source fact and engineering inference are distinguishable
[ ] no fake live data
[ ] no invented port constraints
[ ] provenance/timestamp behavior is defined
[ ] API contract exists
[ ] failure state is defined
[ ] acceptance test exists

Explicitly excluded:
- unrelated sixth pillar
- paid dependency required for core demo
- fake AIS
- fake operational queue
- automatic procurement approval
