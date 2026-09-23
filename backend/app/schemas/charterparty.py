"""
Pydantic schemas for BIMCO Standard Charterparty Contract Studio.
Supports BIMCO GENCON 1994 (Voyage Charter) & BIMCO NYPE 2015 (Time Charter).
"""
from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


CharterpartyContractType = Literal["GENCON_1994", "NYPE_2015"]


class ContractBoxPartI(BaseModel):
    contract_number: str = "CIL/FREIGHT/2026/CP-0442"
    contract_date: str = "2026-09-24"
    place_of_agreement: str = "New Delhi, India"
    charterer_name: str = "Coal India Limited (CIL) / Central Coalfields Ltd"
    charterer_address: str = "Coal Bhawan, Premise No-04 MAR, Plot No-AF-III, Action Area-1A, Newtown, Kolkata 700156, India"
    owner_broker_name: str = "Transworld Bulk Carriers Pte Ltd / Eastern Maritime Brokers"
    owner_broker_address: str = "80 Robinson Road #14-02, Singapore 068898"
    vessel_name: str = "M/V BHARAT SAMUDRIC"
    imo_number: str = "9842104"
    vessel_flag: str = "India (IN)"
    built_year: int = 2019
    vessel_class: str = "Panamax"
    vessel_dwt: int = 75000
    loading_port: str = "Gladstone Port (RGT), Australia"
    discharging_port: str = "Paradip Port (PICT Coal Berth), India"
    cargo_description: str = "Non-Coking Thermal Coal in Bulk, GCV 4200-4800 kcal/kg"
    cargo_quantity_mt: float = 75000.0
    quantity_tolerance_pct: float = 5.0
    laydays_cancelling_start: str = "2026-10-10"
    laydays_cancelling_end: str = "2026-10-18"
    freight_rate_usd_mt: float = 24.50
    daily_hire_usd_day: float = 18500.00
    demurrage_usd_day: float = 16000.00
    despatch_usd_day: float = 8000.00
    laytime_hours: float = 96.0
    laytime_terms: str = "SHINC (Sundays & Holidays Included), 24 Consecutive Hours Weather Permitting"
    brokerage_commission_pct: float = 1.25
    governing_law_and_arbitration: str = "Indian Arbitration and Conciliation Act 1996, Seat of Arbitration New Delhi"


class RiderClauseToggles(BaseModel):
    include_cvc_integrity_pact: bool = Field(True, description="Mandatory CVC Anti-Bribery & Integrity Clause (GFR Rule 144)")
    include_conwartime_war_risk: bool = Field(True, description="BIMCO CONWARTIME 2004 War Risk & Transit Detour Clause")
    include_piracy_clause: bool = Field(True, description="BIMCO Piracy Clause for Time / Voyage Charter Parties 2013")
    include_bunker_escalation: bool = Field(True, description="Bunker Fuel Price Volatility Escalation Cap (10% ceiling)")
    include_imo_carbon_clause: bool = Field(True, description="BIMCO Carbon Intensity Indicator (CII) & FuelEU Compliance")
    include_cyber_security: bool = Field(True, description="BIMCO Cyber Security Clause 2019")
    include_sanctions_clause: bool = Field(True, description="BIMCO Sanctions Clause for Voyage and Time Charters")


class CharterpartyGenerateRequest(BaseModel):
    contract_type: CharterpartyContractType = "GENCON_1994"
    box: ContractBoxPartI
    riders: RiderClauseToggles = RiderClauseToggles()
    custom_clauses: list[str] = Field(default_factory=list)


class StandardClauseItem(BaseModel):
    clause_number: int
    clause_title: str
    clause_text: str


class RiderClauseItem(BaseModel):
    clause_code: str
    title: str
    text: str
    mandatory_cvc: bool


class CharterpartyGenerateResponse(BaseModel):
    contract_id: str
    contract_type: CharterpartyContractType
    generated_at: str
    title: str
    box_summary: dict[str, Any]
    part_i_box_text: str
    part_ii_standard_clauses: list[StandardClauseItem]
    part_iii_protective_riders: list[RiderClauseItem]
    full_contract_markdown: str
    compliance_status: Literal["COMPLIANT", "OBSERVATION", "NON_COMPLIANT"]
    compliance_notes: list[str]
    model_version: str = "bimco-gencon-nype-v1"


class ContractTemplateSummary(BaseModel):
    template_id: CharterpartyContractType
    name: str
    association: str = "BIMCO"
    edition: str
    primary_use: str
    standard_clauses_count: int
    supported_riders: list[str]


class ContractTemplatesResponse(BaseModel):
    templates: list[ContractTemplateSummary]


class ContractValidateRequest(BaseModel):
    contract_type: CharterpartyContractType
    box: ContractBoxPartI
    riders: RiderClauseToggles


class ContractValidationResponse(BaseModel):
    is_cvc_compliant: bool
    compliance_score: int
    passed_checks: list[str]
    failed_checks: list[str]
    recommended_amendments: list[str]
