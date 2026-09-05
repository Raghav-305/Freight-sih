# 06 — FINAL DEMO FLOW

Click-by-click script connecting all five pillars into one story. Target:
~3 minutes for the core walkthrough, with room to go deeper on Q&A. The
underlying narrative beats are preserved from the original jury-defence
research (`research/supporting/JURY_3_MINUTE_SCRIPT.md` and
`research/supporting/JURY_JUDGE_QA.md`) — this version adds the exact
screens/clicks.

## Opening line
"This is a decision-support command center for maritime coal freight, not
a black-box AI dashboard."

## Step-by-step

1. **Open Command Center → Executive Overview tab.**
   Point out the above-the-fold order: blocking constraint, recommended
   scenario, financial impact, risk, uncertainty, provenance — in that
   order, before any decorative chart.

2. **Show a logistics KPI with drill-down.**
   Click into any KPI card, show value / unit / source / observed_at /
   confidence — not just a number.

3. **Open the Scenario Comparator (Pillar 1).**
   Enter or load one IMPORT and one COASTAL coal scenario with the same
   cargo assumptions. Show the ranked comparison and open the Assumptions
   drawer — point out the cost is shown in **USD/GJ**, not the ambiguous
   "USD/GCV," with the conversion factor visible.

4. **Toggle the sensitivity grid.**
   Show how a −10% freight shock or a change in GCV moves the ranking.
   Line: "The recommendation isn't fragile — here's what would flip it."

5. **Open Vessel Eligibility & Port Constraints (Pillar 4).**
   Run the recommended scenario's vessel against Paradip. Show a case that
   returns `ELIGIBLE_WITH_CONDITION` (draft within the high-tide conditional
   limit) — explain the berth-level, tide-aware check. Then run a vessel
   against a port/berth with no data on file and show `UNKNOWN` — not a
   guessed pass. Line: "We never force a data gap into a green light."

6. **Show delay exposure vs. contractual demurrage.**
   Run `/delay/exposure` with P10/P50/P90 waiting days, then run
   `/demurrage/estimate` separately with laytime/contract-rate inputs. Line:
   "These are two different numbers on purpose — one is a forecast, one is
   a contract calculation."

7. **Open the Maritime Geospatial Visualizer (Pillar 2).**
   Show ports, corridors, and chokepoints (Malacca Strait, Bay of Bengal
   belt) on the map. Point at the freshness badge on any dynamic layer.

8. **Turn off Wi-Fi.**
   Reload or interact with the map — ports/corridors/chokepoints still
   render. Line: "A judge can switch off Wi-Fi and the reference data is
   still there. Only live layers degrade, and they degrade visibly, not
   silently."

9. **Turn Wi-Fi back on. Open Audit Log & Approval Workflow (Pillar 3).**
   Take the scenario+eligibility result from steps 3–6, create a decision.
   Submit it for review.

10. **Attempt self-approval.**
    Try to approve as the same actor who created it — show it blocked with
    `SELF_APPROVAL_BLOCKED`. Line: "The system enforces separation of duties,
    it doesn't just describe it in a policy document."

11. **Approve as a second actor.**
    Show the decision move to `APPROVED`. Open the audit trail, show the
    hash-chained event list and that `verify_chain()` confirms it's intact.

12. **Export the audit-ready evidence report.**
    Download the PDF. Flip to section 5 (explanation) and be upfront if it
    says "Not computed for this decision" — this is correct behavior, not a
    bug, and is worth explicitly calling out: "We'd rather say 'not computed'
    than fabricate a driver value."

13. **Close on the banner.**
    Point at the persistent decision-support-only banner. Line: "The value
    here isn't that an AI approves a charter — it's that economics, physical
    feasibility, risk, evidence, and accountability are connected into one
    auditable flow, and a human makes the call."

## What must work flawlessly for this flow
- Steps 5 and 10 are the two "gotcha" moments most likely to draw follow-up
  questions — rehearse both specifically, including what to say if a judge
  asks "what if the eligibility data existed for this port" (answer: it
  would show ELIGIBLE/INELIGIBLE with the same evidence structure — UNKNOWN
  only appears where data genuinely doesn't exist yet).
- Step 8 requires the static map to have zero network dependency — confirm
  this in Phase 5 testing, not for the first time during the demo.

## Fallback if something breaks live
Have PDF report and a screenshot of the audit trail saved locally from a
rehearsal run, in case a live network hiccup interrupts steps 7–12.
