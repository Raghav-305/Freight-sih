"""
Tests for BIMCO Standard Charterparty Contract Studio endpoints
and All 12 Major Indian Ports expansion.
"""
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_templates_returns_gencon_and_nype():
    res = client.get("/api/charterparty/templates")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "templates" in data
    assert len(data["templates"]) == 2
    template_ids = [t["template_id"] for t in data["templates"]]
    assert "GENCON_1994" in template_ids
    assert "NYPE_2015" in template_ids


def test_generate_gencon_contract_returns_valid_box_and_clauses():
    payload = {
        "contract_type": "GENCON_1994",
        "box": {
            "contract_number": "CIL/FREIGHT/2026/CP-9901",
            "contract_date": "2026-09-24",
            "place_of_agreement": "New Delhi, India",
            "charterer_name": "Coal India Limited",
            "charterer_address": "Kolkata, India",
            "owner_broker_name": "Eastern Maritime Carriers",
            "owner_broker_address": "Singapore",
            "vessel_name": "M/V SHAKTI VOYAGER",
            "imo_number": "9741205",
            "vessel_flag": "India (IN)",
            "built_year": 2020,
            "vessel_class": "Panamax",
            "vessel_dwt": 75000,
            "loading_port": "Gladstone, Australia",
            "discharging_port": "Paradip, India",
            "cargo_description": "Coking Coal in Bulk",
            "cargo_quantity_mt": 75000.0,
            "quantity_tolerance_pct": 5.0,
            "laydays_cancelling_start": "2026-10-10",
            "laydays_cancelling_end": "2026-10-18",
            "freight_rate_usd_mt": 24.50,
            "daily_hire_usd_day": 18000.00,
            "demurrage_usd_day": 16000.00,
            "despatch_usd_day": 8000.00,
            "laytime_hours": 96.0,
            "laytime_terms": "SHINC 24 consecutive hours",
            "brokerage_commission_pct": 1.25,
            "governing_law_and_arbitration": "Indian Arbitration Act 1996, New Delhi",
        },
        "riders": {
            "include_cvc_integrity_pact": True,
            "include_conwartime_war_risk": True,
            "include_piracy_clause": True,
            "include_bunker_escalation": True,
            "include_imo_carbon_clause": True,
            "include_cyber_security": True,
            "include_sanctions_clause": True,
        },
    }

    res = client.post("/api/charterparty/generate", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["contract_id"] == "CIL-FREIGHT-2026-CP-9901"
    assert data["contract_type"] == "GENCON_1994"
    assert "M/V SHAKTI VOYAGER" in data["part_i_box_text"]
    assert len(data["part_ii_standard_clauses"]) >= 14
    assert len(data["part_iii_protective_riders"]) == 7
    assert data["compliance_status"] == "COMPLIANT"
    assert "CVC Anti-Corruption" in data["full_contract_markdown"]


def test_generate_nype_contract_returns_hire_and_off_hire():
    payload = {
        "contract_type": "NYPE_2015",
        "box": {
            "contract_number": "NTPC/TIME/2026/TC-0114",
            "contract_date": "2026-09-24",
            "place_of_agreement": "New Delhi, India",
            "charterer_name": "NTPC Limited",
            "charterer_address": "New Delhi, India",
            "owner_broker_name": "Bharat Global Shipping",
            "owner_broker_address": "Mumbai, India",
            "vessel_name": "M/V NTPC PRIDE",
            "imo_number": "9812401",
            "vessel_flag": "India (IN)",
            "built_year": 2021,
            "vessel_class": "Panamax",
            "vessel_dwt": 78000,
            "loading_port": "Richards Bay, South Africa",
            "discharging_port": "Ennore (Kamarajar Port), India",
            "cargo_description": "Thermal Coal",
            "cargo_quantity_mt": 75000.0,
            "quantity_tolerance_pct": 5.0,
            "laydays_cancelling_start": "2026-11-01",
            "laydays_cancelling_end": "2026-11-10",
            "freight_rate_usd_mt": 0.0,
            "daily_hire_usd_day": 19500.00,
            "demurrage_usd_day": 17000.00,
            "despatch_usd_day": 8500.00,
            "laytime_hours": 96.0,
            "laytime_terms": "SHINC",
            "brokerage_commission_pct": 1.25,
            "governing_law_and_arbitration": "Indian Arbitration Act 1996, New Delhi",
        },
        "riders": {
            "include_cvc_integrity_pact": True,
            "include_conwartime_war_risk": False,
            "include_piracy_clause": False,
            "include_bunker_escalation": False,
            "include_imo_carbon_clause": True,
            "include_cyber_security": True,
            "include_sanctions_clause": True,
        },
    }

    res = client.post("/api/charterparty/generate", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["contract_type"] == "NYPE_2015"
    assert "Off-Hire Clause" in [c["clause_title"] for c in data["part_ii_standard_clauses"]]
    assert "$19,500.00 / day" in data["box_summary"]["rate"]


def test_validate_contract_detects_missing_cvc_integrity():
    payload = {
        "contract_type": "GENCON_1994",
        "box": {
            "contract_number": "TEST/001",
            "governing_law_and_arbitration": "Indian Law, New Delhi",
            "laytime_hours": 96,
            "demurrage_usd_day": 15000,
            "despatch_usd_day": 7500,
        },
        "riders": {
            "include_cvc_integrity_pact": False,  # Missing mandatory CVC pact
            "include_conwartime_war_risk": True,
            "include_piracy_clause": True,
            "include_bunker_escalation": True,
            "include_imo_carbon_clause": True,
            "include_cyber_security": True,
            "include_sanctions_clause": True,
        },
    }

    res = client.post("/api/charterparty/validate", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["is_cvc_compliant"] is False
    assert any("Missing CVC Integrity Pact" in f for f in data["failed_checks"])


def test_all_sixteen_indian_ports_list_and_check():
    res = client.get("/api/ports")
    assert res.status_code == 200, res.text
    ports = res.json()["ports"]
    assert len(ports) >= 16

    port_names = [p["name"] for p in ports]
    assert "Paradip" in port_names
    assert "Dhamra" in port_names
    assert "Haldia" in port_names
    assert "Vizag" in port_names
    assert "Kamarajar (Ennore)" in port_names
    assert "Chennai" in port_names
    assert "V.O. Chidambaranar (Tuticorin)" in port_names
    assert "Cochin" in port_names
    assert "New Mangalore" in port_names
    assert "Mormugao" in port_names
    assert "Mumbai Port" in port_names
    assert "Deendayal (Kandla)" in port_names
    assert "Krishnapatnam" in port_names
    assert "Jaigarh" in port_names

    # Check that an expanded port (Ennore) checks cleanly with dual engine
    ennore_check = client.post("/api/port/check", json={
        "port": "Kamarajar (Ennore)",
        "vessel_type": "Panamax",
        "cargo_quantity": 75000,
        "vessel_dwt": 75000,
    })
    assert ennore_check.status_code == 200, ennore_check.text
    check_data = ennore_check.json()
    assert check_data["feasible"] is True
    assert check_data["model_version"] == "port_authority_operational_baseline"
