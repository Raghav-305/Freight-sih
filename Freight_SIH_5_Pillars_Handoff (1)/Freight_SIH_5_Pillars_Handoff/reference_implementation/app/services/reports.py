"""
Pillar 3 -- "Download Tender Brief / Justification Report" (PDF + XLSX).

Sections follow 03_PILLAR_3_GOVERNANCE/DEEP_RESEARCH.md exactly:
  1 purpose and cargo               6 vessel-port feasibility
  2 alternatives evaluated          7 route/weather/chokepoint risk
  3 economic comparison             8 data freshness and provenance
  4 forecast uncertainty P10/P50/P90  9 assumptions and exceptions
  5 explanation/SHAP (only if actually computed)  10 review/approval history

The report is generated FROM the frozen decision snapshot only -- it must be
reproducible byte-for-byte in content from the same decision_id, per
TEST_PLAN.md P3 ("report reproduces snapshot").
"""
from __future__ import annotations

import io

from openpyxl import Workbook
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.services import audit

BANNER = (
    "Decision-Support System Only. Final chartering or procurement action requires "
    "review and approval by an authorized officer under the applicable delegation "
    "and procurement framework."
)


def _sections(decision: dict) -> list[tuple[str, str]]:
    p = decision["payload"]
    chain = audit.get_chain(decision["decision_id"])
    approval_lines = "\n".join(
        f"{e['created_at']} | {e['event_type']} | {e['actor']} ({e['role']}) | reason={e['reason'] or '-'}"
        for e in chain
    )
    fq = p.get("forecast_quantiles") or {}
    return [
        ("1. Purpose and Cargo", p.get("cargo_description", "-")),
        ("2. Alternatives Evaluated", str(p.get("scenario_snapshot", {}).get("result", "See scenario snapshot"))),
        ("3. Economic Comparison", str(p.get("scenario_snapshot", {}))),
        ("4. Forecast Uncertainty (P10/P50/P90)",
         f"P10={fq.get('p10')} P50={fq.get('p50')} P90={fq.get('p90')} unit={fq.get('unit', '-')}"
         if fq else "Not computed for this decision."),
        ("5. Explanation / SHAP Drivers",
         p.get("explanation_reference") or "Not computed for this decision -- omitted per rule (do not fabricate)."),
        ("6. Vessel-Port Feasibility", str(p.get("eligibility_snapshot", {}))),
        ("7. Route / Weather / Chokepoint Risk", str(p.get("route_risk_snapshot") or "Not evaluated for this decision.")),
        ("8. Data Freshness and Provenance", str(p.get("source_versions", {}))),
        ("9. Assumptions and Exceptions",
         "All figures are decision-support estimates. Demurrage vs delay-exposure distinction applies "
         "(see Pillar 4). No live feed is claimed unless explicitly marked OFFICIAL_PERIODIC in provenance."),
        ("10. Review / Approval History", approval_lines or "No workflow events recorded yet."),
    ]


def build_pdf(decision: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(f"Tender Justification Report -- Decision {decision['decision_id']}", styles["Title"]),
        Paragraph(f"Status: {decision['status']} | Analysis version: {decision['analysis_version']}", styles["Normal"]),
        Spacer(1, 8),
        Paragraph(BANNER, styles["Italic"]),
        Spacer(1, 12),
    ]
    for title, body in _sections(decision):
        story.append(Paragraph(title, styles["Heading2"]))
        story.append(Paragraph(str(body).replace("\n", "<br/>"), styles["Normal"]))
        story.append(Spacer(1, 8))

    doc.build(story)
    return buf.getvalue()


def build_xlsx(decision: dict) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Justification Report"
    ws.append(["Tender Justification Report", decision["decision_id"]])
    ws.append(["Status", decision["status"]])
    ws.append(["Analysis version", decision["analysis_version"]])
    ws.append(["Compliance banner", BANNER])
    ws.append([])
    ws.append(["Section", "Content"])
    for title, body in _sections(decision):
        ws.append([title, str(body)])
    for col, width in zip("AB", (32, 100)):
        ws.column_dimensions[col].width = width

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
