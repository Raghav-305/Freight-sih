"""
BIMCO Standard Charterparty Contract Service.
Generates, validates, and formats BIMCO GENCON 1994 (Voyage Charter)
and BIMCO NYPE 2015 (Time Charter) contracts for Indian PSU dry bulk freight.
"""
from __future__ import annotations

import datetime
from typing import Any

from backend.app.schemas.charterparty import (
    CharterpartyContractType,
    CharterpartyGenerateRequest,
    CharterpartyGenerateResponse,
    ContractBoxPartI,
    ContractTemplateSummary,
    ContractTemplatesResponse,
    ContractValidateRequest,
    ContractValidationResponse,
    RiderClauseItem,
    RiderClauseToggles,
    StandardClauseItem,
)


GENCON_1994_CLAUSES = [
    {
        "clause_number": 1,
        "clause_title": "Preamble and Vessel Warranty",
        "clause_text": (
            "It is this day mutually agreed between the Owners indicated in Box 3 of the Vessel named in Box 5, "
            "being tight, staunch and strong, and in every way fitted for the voyage, and the Charterers indicated "
            "in Box 4, that the said Vessel shall with all convenient speed proceed to the loading port(s) indicated "
            "in Box 10 or so near thereunto as she may safely get and lie always afloat, and there load a full and "
            "complete cargo as described in Box 12, which the Charterers bind themselves to supply, and being so "
            "loaded shall proceed to the discharging port(s) indicated in Box 11 and there deliver the cargo."
        ),
    },
    {
        "clause_number": 2,
        "clause_title": "Owners' Responsibility Clause",
        "clause_text": (
            "The Owners shall be responsible for loss of or damage to the goods or for delay in delivery thereof only "
            "in case the loss, damage or delay has been caused by personal want of due diligence on the part of the "
            "Owners or their Manager to make the Vessel in all respects seaworthy and to secure that she is properly "
            "manned, equipped and supplied, or by the personal act or default of the Owners or their Manager. And the "
            "Owners shall not be responsible for loss, damage or delay arising from any other cause whatsoever."
        ),
    },
    {
        "clause_number": 3,
        "clause_title": "Deviation Clause",
        "clause_text": (
            "The Vessel has liberty to call at any port or ports in any order, for any purpose, to sail without "
            "pilots, to tow and/or assist Vessels in all situations, and to deviate for the purpose of saving life "
            "and/or property, or for bunkering."
        ),
    },
    {
        "clause_number": 4,
        "clause_title": "Payment of Freight",
        "clause_text": (
            "The freight shall be paid at the rate stipulated in Box 19 per metric ton of cargo loaded on gross intaken "
            "bill of lading weight. The freight shall be deemed earned upon shipment and shall be non-returnable, Vessel "
            "and/or cargo lost or not lost. Payment shall be made via telegraphic transfer in freely transferable US Dollars "
            "to the Owners' nominated bank account within three (3) banking days of signing and releasing clean bills of lading."
        ),
    },
    {
        "clause_number": 5,
        "clause_title": "Loading / Discharging Costs & Laytime Allowance",
        "clause_text": (
            "The cargo shall be brought into the holds, loaded, stowed, trimmed and discharged by the Charterers or their "
            "agents, free of any risk, liability and expense to the Owners. Laytime for loading and discharging shall be "
            "the total hours specified in Box 23, calculated per weather working day of 24 consecutive hours, Sundays and "
            "Holidays Included (SHINC) unless otherwise stipulated in Box 24. Notice of Readiness (NOR) shall be tendered "
            "in writing upon arrival at each port during official office hours."
        ),
    },
    {
        "clause_number": 6,
        "clause_title": "Laydays / Cancelling Date (Laycan)",
        "clause_text": (
            "Laytime shall not commence before the date stated in Box 17 unless Charterers consent. If the Vessel has not "
            "tendered valid Notice of Readiness by 23:59 hours on the cancelling date stated in Box 18, the Charterers "
            "shall have the option of cancelling this Charterparty by written notice within 24 hours of expiry."
        ),
    },
    {
        "clause_number": 7,
        "clause_title": "Demurrage and Despatch Money",
        "clause_text": (
            "Demurrage at the loading and discharging port(s) is payable by the Charterers at the rate stated in Box 21 "
            "per running day or pro rata for any part of a day. Demurrage shall be settled within thirty (30) days of receipt "
            "of Owners' properly supported invoice and statement of facts. Despatch money shall be paid by the Owners to "
            "the Charterers at half the demurrage rate (Box 22) for all laytime saved in loading and discharging."
        ),
    },
    {
        "clause_number": 8,
        "clause_title": "Lien Clause",
        "clause_text": (
            "The Owners shall have a lien on the cargo and on all sub-freights payable in respect of the cargo for freight, "
            "deadfreight, demurrage, claims for damages and for all other amounts due under this Charterparty, including "
            "costs of recovering the same."
        ),
    },
    {
        "clause_number": 9,
        "clause_title": "Bills of Lading",
        "clause_text": (
            "Bills of Lading shall be presented and signed according to the standard Congenbill 1994 form. The Charterers "
            "shall indemnify the Owners against all consequences or liabilities that may arise from the Master or Agents "
            "signing Bills of Lading in accordance with the directions of the Charterers."
        ),
    },
    {
        "clause_number": 10,
        "clause_title": "Both-to-Blame Collision Clause",
        "clause_text": (
            "If the Vessel comes into collision with another ship as a result of the negligence of the other ship and any "
            "act, neglect or default of the Master, Mariner, Pilot or the servants of the Carrier in the navigation or in "
            "the management of the Vessel, the owners of the goods carried hereunder will indemnify the Carrier against all "
            "loss or liability to the other or non-carrying ship."
        ),
    },
    {
        "clause_number": 11,
        "clause_title": "General Average and New Jason Clause",
        "clause_text": (
            "General Average shall be adjusted in accordance with the York-Antwerp Rules 1994 or any subsequent modification "
            "thereof. The New Jason Clause as approved by BIMCO shall be deemed incorporated herein."
        ),
    },
    {
        "clause_number": 12,
        "clause_title": "Taxes and Dues Clause",
        "clause_text": (
            "The Charterers shall pay all taxes, dues, duties and charges levied on the cargo at both loading and discharging "
            "ports. The Owners shall pay all port dues, pilotage, tug charges, and canal tolls customarily levied on the "
            "Vessel's tonnage."
        ),
    },
    {
        "clause_number": 13,
        "clause_title": "Brokerage Commission",
        "clause_text": (
            "A brokerage commission at the rate stated in Box 25 on the gross amount of freight earned is payable by the "
            "Owners to the brokers named in Box 3 upon settlement of freight."
        ),
    },
    {
        "clause_number": 14,
        "clause_title": "Law and Arbitration Clause",
        "clause_text": (
            "This Charterparty shall be governed by and construed in accordance with the laws of India. Any dispute arising "
            "out of or in connection with this Charterparty shall be referred to arbitration in New Delhi under the Indian "
            "Arbitration and Conciliation Act 1996, before a tribunal of three arbitrators, one appointed by each party and "
            "the third presiding arbitrator nominated by the Indian Council of Arbitration (ICA)."
        ),
    },
]


NYPE_2015_CLAUSES = [
    {
        "clause_number": 1,
        "clause_title": "Vessel Description & Condition on Delivery",
        "clause_text": (
            "The Owners warrant that on delivery and throughout the duration of this Charterparty the Vessel shall be tight, "
            "staunch, strong, in every way fitted for service, with cargo holds clean and suitable for bulk cargo, and "
            "maintaining speed and fuel consumption warranties as set forth in the Vessel Description Schedule."
        ),
    },
    {
        "clause_number": 2,
        "clause_title": "Trade Limits & Safe Ports",
        "clause_text": (
            "The Vessel shall be employed in lawful trades between safe ports and berths where she can always lie safely "
            "afloat, within the trading limits of Institute Warranty Limits (IWL) or as mutually agreed."
        ),
    },
    {
        "clause_number": 3,
        "clause_title": "Owners and Charterers Responsibilities for Operating Expenses",
        "clause_text": (
            "The Owners shall provide and pay for all crew wages, provisions, vessel insurance, lubricants, and technical "
            "maintenance. The Charterers shall provide and pay for all marine fuel (VLSFO / LSMGO), port charges, pilotage, "
            "canal tolls, agencies, and cargo loading and discharging expenses."
        ),
    },
    {
        "clause_number": 4,
        "clause_title": "Hire Rate and Method of Payment",
        "clause_text": (
            "The Charterers shall pay for the hire of the Vessel at the daily rate stipulated in Box 20 in US Dollars "
            "semi-monthly in advance by bank transfer. Failure to pay punctually entitles the Owners to withdraw the Vessel "
            "after giving three (3) banking days written grace notice."
        ),
    },
    {
        "clause_number": 5,
        "clause_title": "Off-Hire Clause",
        "clause_text": (
            "In the event of loss of time from breakdown of machinery, hull damage, deficiency of men, groundings, strike "
            "of crew, or any other detention hindering the full working of the Vessel for more than twelve (12) consecutive "
            "hours, the payment of hire shall cease for the time thereby lost until the Vessel is again in an efficient state."
        ),
    },
    {
        "clause_number": 6,
        "clause_title": "Employment of Master and Cargo Indemnity",
        "clause_text": (
            "The Master shall be under the orders and directions of the Charterers as regards employment and agency. "
            "The Charterers shall perform all cargo handling under the supervision of the Master, who shall sign bills of "
            "lading as presented."
        ),
    },
    {
        "clause_number": 7,
        "clause_title": "Law and Arbitration",
        "clause_text": (
            "This Charterparty shall be governed by Indian Maritime Law. Any dispute shall be settled by arbitration in "
            "New Delhi in accordance with the rules of the Indian Council of Arbitration (ICA)."
        ),
    },
]


RIDER_LIBRARY = {
    "CVC_INTEGRITY": {
        "clause_code": "CVC_GFR_144",
        "title": "CVC Anti-Corruption, Integrity Pact & Public Procurement Ethics (GFR Rule 144)",
        "mandatory_cvc": True,
        "text": (
            "1. The Owners, Charterers, and any Intermediary Brokers represent and warrant that they have not given, "
            "offered, or promised to give, directly or indirectly, any bribe, gift, consideration, reward, or inducement "
            "to any person or public official in connection with the award or execution of this Charterparty.\n"
            "2. Any breach of this warranty constitutes a fundamental breach of contract and an illegal corrupt practice "
            "under the Prevention of Corruption Act 1988, Central Vigilance Commission (CVC) Vigilance Manual 2021, and "
            "General Financial Rules (GFR 2017 Rule 144).\n"
            "3. Upon occurrence of such breach, the Charterer shall have the absolute right to: (a) immediately terminate "
            "this Charterparty without compensation, (b) forfeit all earnest money deposits or performance guarantees, "
            "and (c) debar and blacklist the shipowner and broker from all Indian Public Sector Undertaking (PSU) tenders "
            "for a minimum period of three (3) years."
        ),
    },
    "CONWARTIME_2004": {
        "clause_code": "BIMCO_CONWARTIME_2004",
        "title": "BIMCO CONWARTIME 2004 (Standard War Risks Clause for Voyage Charters)",
        "mandatory_cvc": False,
        "text": (
            "1. The Master and Owners shall not be required or bound to sign Bills of Lading for any blockaded port or for "
            "any port or area which may be dangerous or impossible for the Vessel to enter or reach by reason of war, acts "
            "of war, hostilities, or civil war.\n"
            "2. If the loading or discharging port is declared an excluded area by hull war risk underwriters, the Charterers "
            "shall reimburse the Owners for any additional insurance premiums or crew war bonuses necessarily incurred.\n"
            "3. If transit through Bab-el-Mandeb / Red Sea or Straits of Malacca becomes subject to active hostilities or "
            "missile hazards, the Vessel has liberty to reroute via the Cape of Good Hope, with additional steaming time and "
            "fuel consumption settled pro rata."
        ),
    },
    "PIRACY_2013": {
        "clause_code": "BIMCO_PIRACY_2013",
        "title": "BIMCO Piracy Clause for Bulk Charter Parties 2013",
        "mandatory_cvc": False,
        "text": (
            "1. If the Vessel proceeds through any area where there is reasonable likelihood of piracy attack, the Owners "
            "shall take reasonable preventative measures including transit via International Recommended Transit Corridors (IRTC) "
            "and deployment of certified Armed Maritime Security Teams (AMST).\n"
            "2. Any waiting time spent awaiting naval convoy escorts shall count as laytime or time on hire.\n"
            "3. In the event of seizure of the Vessel by pirates, the Vessel shall remain on hire / laytime shall be suspended "
            "for a maximum period of ninety (90) days, after which the parties shall review contractual remedies."
        ),
    },
    "BUNKER_ESCALATION": {
        "clause_code": "CIL_BUNKER_ESC_10",
        "title": "Bunker Price Volatility Escalation / De-escalation Mechanism",
        "mandatory_cvc": False,
        "text": (
            "1. The freight rate agreed herein is based on an agreed reference VLSFO bunker price of USD 620.00 / MT as "
            "published in the Platts Singapore Bunkerwire on the date of tender closing.\n"
            "2. If the average bunker price over the 5 days preceding Vessel arrival at the loading port differs by more than "
            "+/- 10% from the baseline, the freight rate per metric ton shall be adjusted upward or downward by USD 0.22 per "
            "each USD 10/MT movement in bunker price, reflecting verified voyage consumption."
        ),
    },
    "IMO_CARBON_CII": {
        "clause_code": "BIMCO_CII_2022",
        "title": "BIMCO Carbon Intensity Indicator (CII) & Green Chartering Clause",
        "mandatory_cvc": False,
        "text": (
            "1. The Owners warrant that the Vessel possesses a valid Statement of Compliance for Carbon Intensity Rating "
            "meeting IMO MARPOL Annex VI Regulation 28 requirements.\n"
            "2. The Charterers agree to cooperate in voyage execution to minimize carbon emissions by planning optimal "
            "cargo discharge sequences and respecting eco-steaming recommendations where berth queues allow.\n"
            "3. Owners shall provide the Charterer with a verified Carbon Emission Statement within seven (7) days of "
            "completing cargo discharge, reporting total grams of CO2 emitted per metric ton of cargo transported."
        ),
    },
    "CYBER_SECURITY": {
        "clause_code": "BIMCO_CYBER_2019",
        "title": "BIMCO Cyber Security Clause 2019",
        "mandatory_cvc": False,
        "text": (
            "1. Each party shall implement and maintain cybersecurity procedures, technical measures, and software patches "
            "reasonably designed to prevent cybersecurity incidents and unauthorized access to shipping communications.\n"
            "2. In the event of a cybersecurity breach impacting electronic notices of readiness, vessel tracking, or payment "
            "instructions, the affected party shall immediately notify the other party by telephone and authenticated "
            "alternative communication before transmitting financial authorizations."
        ),
    },
    "SANCTIONS_CLAUSE": {
        "clause_code": "BIMCO_SANCTIONS_2020",
        "title": "BIMCO Sanctions Clause for Voyage and Time Charters",
        "mandatory_cvc": False,
        "text": (
            "Neither party shall be required to perform any obligation under this Charterparty, or be liable for failure to "
            "perform, if such performance would violate, or expose the ship, its owners, or its charterers to sanctions, "
            "prohibitions, or restrictions under United Nations resolutions, Indian law, or international sanctions regimes."
        ),
    },
}


class CharterpartyService:
    def list_templates(self) -> ContractTemplatesResponse:
        templates = [
            ContractTemplateSummary(
                template_id="GENCON_1994",
                name="BIMCO Uniform General Charter (GENCON 1994)",
                association="BIMCO (Baltic and International Maritime Council)",
                edition="1994 Revised Edition (As recommended for bulk coal and minerals)",
                primary_use="Spot Voyage Charters (Port-to-Port / Cargo-per-Tonne basis)",
                standard_clauses_count=len(GENCON_1994_CLAUSES),
                supported_riders=list(RIDER_LIBRARY.keys()),
            ),
            ContractTemplateSummary(
                template_id="NYPE_2015",
                name="BIMCO / ASBA New York Produce Exchange Form (NYPE 2015)",
                association="ASBA & BIMCO Joint Standard",
                edition="2015 Modern Standard Edition",
                primary_use="Period Time Charters (Daily Hire / Dedicated Fleet Tonnage basis)",
                standard_clauses_count=len(NYPE_2015_CLAUSES),
                supported_riders=list(RIDER_LIBRARY.keys()),
            ),
        ]
        return ContractTemplatesResponse(templates=templates)

    def generate_contract(self, req: CharterpartyGenerateRequest) -> CharterpartyGenerateResponse:
        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        contract_type = req.contract_type
        box = req.box
        riders = req.riders

        # 1. Select standard clauses based on contract type
        if contract_type == "GENCON_1994":
            title = f"BIMCO GENCON 1994 VOYAGE CHARTERPARTY · {box.contract_number}"
            std_clauses = [StandardClauseItem(**c) for c in GENCON_1994_CLAUSES]
        else:
            title = f"BIMCO NYPE 2015 TIME CHARTERPARTY · {box.contract_number}"
            std_clauses = [StandardClauseItem(**c) for c in NYPE_2015_CLAUSES]

        # 2. Select enabled protective rider clauses
        rider_items: list[RiderClauseItem] = []
        if riders.include_cvc_integrity_pact:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["CVC_INTEGRITY"]))
        if riders.include_conwartime_war_risk:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["CONWARTIME_2004"]))
        if riders.include_piracy_clause:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["PIRACY_2013"]))
        if riders.include_bunker_escalation:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["BUNKER_ESCALATION"]))
        if riders.include_imo_carbon_clause:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["IMO_CARBON_CII"]))
        if riders.include_cyber_security:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["CYBER_SECURITY"]))
        if riders.include_sanctions_clause:
            rider_items.append(RiderClauseItem(**RIDER_LIBRARY["SANCTIONS_CLAUSE"]))

        # 3. Format Part I Box Layout Text
        box_text = self._format_box_part_i(box, contract_type)

        # 4. Compile full contract markdown
        full_md = self._compile_markdown(title, now_str, box, box_text, std_clauses, rider_items, req.custom_clauses)

        # 5. Evaluate CVC compliance
        val = self.validate_contract(ContractValidateRequest(contract_type=contract_type, box=box, riders=riders))
        status = "COMPLIANT" if val.is_cvc_compliant else "NON_COMPLIANT"
        if val.failed_checks and val.is_cvc_compliant:
            status = "OBSERVATION"

        return CharterpartyGenerateResponse(
            contract_id=box.contract_number.replace("/", "-"),
            contract_type=contract_type,
            generated_at=now_str,
            title=title,
            box_summary={
                "vessel": f"{box.vessel_name} (IMO: {box.imo_number}, Flag: {box.vessel_flag})",
                "charterer": box.charterer_name,
                "owner_broker": box.owner_broker_name,
                "voyage": f"{box.loading_port} → {box.discharging_port}",
                "cargo": f"{box.cargo_quantity_mt:,.0f} MT ({box.cargo_description})",
                "rate": f"${box.freight_rate_usd_mt:.2f} / MT" if contract_type == "GENCON_1994" else f"${box.daily_hire_usd_day:,.2f} / day",
                "demurrage": f"${box.demurrage_usd_day:,.2f} / day",
                "laytime": f"{box.laytime_hours:.0f} hrs ({box.laytime_terms})",
            },
            part_i_box_text=box_text,
            part_ii_standard_clauses=std_clauses,
            part_iii_protective_riders=rider_items,
            full_contract_markdown=full_md,
            compliance_status=status,
            compliance_notes=val.passed_checks + [f"WARNING: {f}" for f in val.failed_checks],
        )

    def validate_contract(self, req: ContractValidateRequest) -> ContractValidationResponse:
        box = req.box
        riders = req.riders

        passed: list[str] = []
        failed: list[str] = []
        amendments: list[str] = []
        score = 100

        # Check 1: Mandatory CVC Integrity Pact
        if riders.include_cvc_integrity_pact:
            passed.append("Mandatory CVC Anti-Corruption & Integrity Pact (GFR Rule 144) is active.")
        else:
            failed.append("Missing CVC Integrity Pact. Public sector procurement tenders strictly require anti-bribery covenants.")
            amendments.append("Enable 'Rider A: CVC Anti-Corruption & Integrity Pact' to achieve statutory compliance.")
            score -= 40

        # Check 2: Indian Law and Arbitration Seat
        if "india" in box.governing_law_and_arbitration.lower() or "delhi" in box.governing_law_and_arbitration.lower():
            passed.append(f"Dispute resolution seated in India: {box.governing_law_and_arbitration}")
        else:
            failed.append("Foreign arbitration seat detected. Indian PSUs require Indian arbitration (New Delhi) under ICA / Arbitration Act 1996.")
            amendments.append("Update Box 26 to specify 'Indian Arbitration and Conciliation Act 1996, Seat: New Delhi'.")
            score -= 20

        # Check 3: Laytime Definition & Demurrage Bound
        if box.laytime_hours > 0 and box.demurrage_usd_day > 0:
            passed.append(f"Laytime ({box.laytime_hours} hrs) and Demurrage (${box.demurrage_usd_day:,.0f}/day) are clearly specified.")
        else:
            failed.append("Laytime or Demurrage terms are missing or set to zero, introducing unlimited delay liability.")
            amendments.append("Stipulate reasonable laytime hours (e.g. 72-120 hrs) and standard demurrage rate.")
            score -= 20

        # Check 4: Despatch Rate Convention (Despatch = 1/2 Demurrage)
        if box.despatch_usd_day == round(box.demurrage_usd_day / 2.0, 2):
            passed.append("Despatch rate correctly follows BIMCO convention (Despatch = 50% of Demurrage).")
        else:
            passed.append(f"Despatch rate (${box.despatch_usd_day:,.0f}) differs from standard 50% demurrage rule, but is defined.")

        # Check 5: War Risk & Geopolitical Protections
        if riders.include_conwartime_war_risk or riders.include_piracy_clause:
            passed.append("BIMCO CONWARTIME / Piracy clauses enabled for chokepoint transit security.")
        else:
            failed.append("No war risk or piracy protection clause enabled for international waters.")
            amendments.append("Enable CONWARTIME 2004 or Piracy 2013 clause for routes passing Malacca or Bab-el-Mandeb.")
            score -= 10

        # Check 6: IMO Carbon Compliance
        if riders.include_imo_carbon_clause:
            passed.append("IMO 2020 MARPOL Annex VI Carbon Intensity (CII) reporting clause enabled.")
        else:
            amendments.append("Consider enabling IMO Carbon Clause to track GHG emissions per ton-mile for ESG compliance.")

        is_compliant = score >= 70 and riders.include_cvc_integrity_pact

        return ContractValidationResponse(
            is_cvc_compliant=is_compliant,
            compliance_score=max(0, score),
            passed_checks=passed,
            failed_checks=failed,
            recommended_amendments=amendments,
        )

    def _format_box_part_i(self, box: ContractBoxPartI, contract_type: CharterpartyContractType) -> str:
        rate_line = (
            f"Box 19. Freight Rate: USD {box.freight_rate_usd_mt:.2f} per metric ton gross intaken weight\n"
            if contract_type == "GENCON_1994"
            else f"Box 19. Charter Hire: USD {box.daily_hire_usd_day:,.2f} per day or pro rata, semi-monthly in advance\n"
        )
        return (
            "========================================================================================\n"
            f"PART I: COMMERCIAL BOX LAYOUT · {contract_type}\n"
            "========================================================================================\n"
            f"Box 1.  Charterparty Reference:  {box.contract_number}\n"
            f"Box 2.  Date of Agreement:      {box.contract_date} (Place: {box.place_of_agreement})\n"
            f"Box 3.  Owners / Head Brokers:  {box.owner_broker_name}\n"
            f"        Owners' Address:        {box.owner_broker_address}\n"
            f"Box 4.  Charterers:             {box.charterer_name}\n"
            f"        Charterers' Address:    {box.charterer_address}\n"
            "----------------------------------------------------------------------------------------\n"
            f"Box 5.  Vessel Name:            {box.vessel_name}\n"
            f"Box 6.  IMO Number:             {box.imo_number} · Flag: {box.vessel_flag} · Built: {box.built_year}\n"
            f"Box 7.  Class & Dimensions:     {box.vessel_class} · {box.vessel_dwt:,} DWT\n"
            "----------------------------------------------------------------------------------------\n"
            f"Box 10. Loading Port(s):        {box.loading_port}\n"
            f"Box 11. Discharging Port(s):    {box.discharging_port}\n"
            f"Box 12. Cargo Description:      {box.cargo_description}\n"
            f"Box 13. Cargo Quantity:         {box.cargo_quantity_mt:,.0f} Metric Tons (+/- {box.quantity_tolerance_pct:.1f}% MOLOO)\n"
            f"Box 17. Laydays Date (Earliest):{box.laydays_cancelling_start}\n"
            f"Box 18. Cancelling Date:        {box.laydays_cancelling_end} (at 23:59 hrs local port time)\n"
            "----------------------------------------------------------------------------------------\n"
            + rate_line
            + f"Box 21. Demurrage Rate:         USD {box.demurrage_usd_day:,.2f} per day or pro rata\n"
            f"Box 22. Despatch Money:         USD {box.despatch_usd_day:,.2f} per day (50% of demurrage rate)\n"
            f"Box 23. Laytime Allowed:        {box.laytime_hours:.1f} Total Hours ({box.laytime_terms})\n"
            f"Box 25. Brokerage Commission:   {box.brokerage_commission_pct:.2f}% payable by Owners on gross freight\n"
            f"Box 26. Law & Arbitration:      {box.governing_law_and_arbitration}\n"
            "========================================================================================\n"
        )

    def _compile_markdown(
        self,
        title: str,
        now_str: str,
        box: ContractBoxPartI,
        box_text: str,
        std_clauses: list[StandardClauseItem],
        rider_items: list[RiderClauseItem],
        custom_clauses: list[str],
    ) -> str:
        lines: list[str] = [
            f"# {title}",
            f"*Generated by Sovereign Freight Chartering & Compliance Intelligence Suite on {now_str}*",
            "\n---\n",
            "## PART I: CONTRACT BOX PARTICULARS",
            "```text",
            box_text,
            "```",
            "\n---\n",
            "## PART II: STANDARD TERMS AND CONDITIONS",
        ]

        for sc in std_clauses:
            lines.append(f"### Clause {sc.clause_number}. {sc.clause_title}")
            lines.append(sc.clause_text)
            lines.append("")

        if rider_items:
            lines.append("\n---\n")
            lines.append("## PART III: SPECIAL PROTECTIVE RIDER CLAUSES")
            for idx, r in enumerate(rider_items, start=1):
                cvc_tag = " [MANDATORY CVC GFR RULE 144 COVENANT]" if r.mandatory_cvc else ""
                lines.append(f"### Rider Clause {idx}. {r.title}{cvc_tag}")
                lines.append(f"**Clause Identification Code:** `{r.clause_code}`\n")
                lines.append(r.text)
                lines.append("")

        if custom_clauses:
            lines.append("\n---\n")
            lines.append("## PART IV: TENDER SPECIFIC SPECIAL CONDITIONS")
            for idx, cc in enumerate(custom_clauses, start=1):
                lines.append(f"{idx}. {cc}")
                lines.append("")

        lines.append("\n---\n")
        lines.append("## SIGNATURES & OFFICIAL EXECUTION")
        lines.append(
            "IN WITNESS WHEREOF, the Charterer and the Owner have executed this Charterparty agreement through "
            "their authorized signatories on the date first above written.\n"
        )
        lines.append("| FOR AND ON BEHALF OF THE CHARTERER | FOR AND ON BEHALF OF THE OWNER / BROKER |")
        lines.append("|---|---|")
        lines.append(f"| **{box.charterer_name}** | **{box.owner_broker_name}** |")
        lines.append("| Authorised Signatory: __________________________ | Authorised Signatory: __________________________ |")
        lines.append("| Designation: General Manager (Procurement / Chartering) | Designation: Managing Director / Chartering Director |")
        lines.append(f"| Seal & Date: __________________________ | Seal & Date: __________________________ |")

        return "\n".join(lines)


charterparty_service = CharterpartyService()
