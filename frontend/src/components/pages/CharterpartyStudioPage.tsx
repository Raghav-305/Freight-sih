import React, { useEffect, useState } from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Printer,
  Sparkles,
  Sliders,
  Scale,
  Anchor,
  Ship,
  Info,
  Check,
} from "lucide-react";
import {
  generateCharterparty,
  getCharterpartyTemplates,
  validateCharterparty,
} from "../../api";

interface BoxFormState {
  contract_number: string;
  contract_date: string;
  place_of_agreement: string;
  charterer_name: string;
  charterer_address: string;
  owner_broker_name: string;
  owner_broker_address: string;
  vessel_name: string;
  imo_number: string;
  vessel_flag: string;
  built_year: number;
  vessel_class: string;
  vessel_dwt: number;
  loading_port: string;
  discharging_port: string;
  cargo_description: string;
  cargo_quantity_mt: number;
  quantity_tolerance_pct: number;
  laydays_cancelling_start: string;
  laydays_cancelling_end: string;
  freight_rate_usd_mt: number;
  daily_hire_usd_day: number;
  demurrage_usd_day: number;
  despatch_usd_day: number;
  laytime_hours: number;
  laytime_terms: string;
  brokerage_commission_pct: number;
  governing_law_and_arbitration: string;
}

interface RidersState {
  include_cvc_integrity_pact: boolean;
  include_conwartime_war_risk: boolean;
  include_piracy_clause: boolean;
  include_bunker_escalation: boolean;
  include_imo_carbon_clause: boolean;
  include_cyber_security: boolean;
  include_sanctions_clause: boolean;
}

const PRESET_CIL_IMPORT: { type: "GENCON_1994"; box: BoxFormState } = {
  type: "GENCON_1994",
  box: {
    contract_number: "CIL/FREIGHT/2026/CP-0442",
    contract_date: new Date().toISOString().slice(0, 10),
    place_of_agreement: "New Delhi, India",
    charterer_name: "Coal India Limited (CIL) / Central Coalfields Ltd",
    charterer_address: "Coal Bhawan, Premise No-04 MAR, Plot No-AF-III, Action Area-1A, Newtown, Kolkata 700156",
    owner_broker_name: "Transworld Bulk Carriers Pte Ltd / Eastern Maritime Brokers",
    owner_broker_address: "80 Robinson Road #14-02, Singapore 068898",
    vessel_name: "M/V BHARAT SAMUDRIC",
    imo_number: "9842104",
    vessel_flag: "India (IN)",
    built_year: 2019,
    vessel_class: "Panamax",
    vessel_dwt: 75000,
    loading_port: "Gladstone Port (RGT), Australia",
    discharging_port: "Paradip Port (PICT Coal Berth), India",
    cargo_description: "Non-Coking Thermal Coal in Bulk, GCV 4200-4800 kcal/kg",
    cargo_quantity_mt: 75000,
    quantity_tolerance_pct: 5.0,
    laydays_cancelling_start: "2026-10-10",
    laydays_cancelling_end: "2026-10-18",
    freight_rate_usd_mt: 24.50,
    daily_hire_usd_day: 18500.00,
    demurrage_usd_day: 16000.00,
    despatch_usd_day: 8000.00,
    laytime_hours: 96.0,
    laytime_terms: "SHINC (Sundays & Holidays Included), 24 Consecutive Hours Weather Permitting",
    brokerage_commission_pct: 1.25,
    governing_law_and_arbitration: "Indian Arbitration and Conciliation Act 1996, Seat of Arbitration New Delhi",
  },
};

const PRESET_NTPC_VOYAGE: { type: "GENCON_1994"; box: BoxFormState } = {
  type: "GENCON_1994",
  box: {
    contract_number: "NTPC/BULK/2026/CP-0891",
    contract_date: new Date().toISOString().slice(0, 10),
    place_of_agreement: "New Delhi, India",
    charterer_name: "NTPC Limited (Fuel Management Group)",
    charterer_address: "NTPC Bhawan, SCOPE Complex, 7 Institutional Area, Lodhi Road, New Delhi 110003",
    owner_broker_name: "Pacific Bulk Shipping Ltd / Clarksons Platou India",
    owner_broker_address: "Bandra Kurla Complex, Mumbai 400051",
    vessel_name: "M/V NTPC GAURAV",
    imo_number: "9781102",
    vessel_flag: "India (IN)",
    built_year: 2020,
    vessel_class: "Panamax",
    vessel_dwt: 78000,
    loading_port: "Richards Bay Coal Terminal (RBCT), South Africa",
    discharging_port: "Kamarajar Port (Ennore Coal Berth CB2), India",
    cargo_description: "Steam Coal in Bulk, GCV 5500 kcal/kg NAR",
    cargo_quantity_mt: 75000,
    quantity_tolerance_pct: 5.0,
    laydays_cancelling_start: "2026-11-01",
    laydays_cancelling_end: "2026-11-10",
    freight_rate_usd_mt: 26.20,
    daily_hire_usd_day: 19000.00,
    demurrage_usd_day: 17500.00,
    despatch_usd_day: 8750.00,
    laytime_hours: 96.0,
    laytime_terms: "SHINC (Sundays & Holidays Included), 24 Hours",
    brokerage_commission_pct: 1.25,
    governing_law_and_arbitration: "Indian Arbitration and Conciliation Act 1996, Venue New Delhi",
  },
};

const PRESET_TIME_CHARTER: { type: "NYPE_2015"; box: BoxFormState } = {
  type: "NYPE_2015",
  box: {
    contract_number: "TANGEDCO/TIME/2026/TC-004",
    contract_date: new Date().toISOString().slice(0, 10),
    place_of_agreement: "Chennai, India",
    charterer_name: "TANGEDCO (Tamil Nadu Generation and Distribution Corp)",
    charterer_address: "NPKRR Maaligai, 144 Anna Salai, Chennai 600002, India",
    owner_broker_name: "Shipping Corporation of India (SCI)",
    owner_broker_address: "Shipping House, 245 Madame Cama Road, Mumbai 400021",
    vessel_name: "M/V CHOLA PROSPERITY",
    imo_number: "9652230",
    vessel_flag: "India (IN)",
    built_year: 2021,
    vessel_class: "Panamax",
    vessel_dwt: 76000,
    loading_port: "Paradip Port, India (Coastal Loading)",
    discharging_port: "V.O. Chidambaranar Port (Tuticorin), India",
    cargo_description: "Indigenous Thermal Coal (Talcher / IB Valley Mines)",
    cargo_quantity_mt: 72000,
    quantity_tolerance_pct: 5.0,
    laydays_cancelling_start: "2026-10-15",
    laydays_cancelling_end: "2026-10-22",
    freight_rate_usd_mt: 0.0,
    daily_hire_usd_day: 17800.00,
    demurrage_usd_day: 15500.00,
    despatch_usd_day: 7750.00,
    laytime_hours: 96.0,
    laytime_terms: "SHINC 24 Hours Weather Permitting",
    brokerage_commission_pct: 1.25,
    governing_law_and_arbitration: "Indian Arbitration Act 1996, Seat: New Delhi",
  },
};

export const CharterpartyStudioPage: React.FC = () => {
  const [contractType, setContractType] = useState<"GENCON_1994" | "NYPE_2015">("GENCON_1994");
  const [box, setBox] = useState<BoxFormState>(PRESET_CIL_IMPORT.box);
  const [riders, setRiders] = useState<RidersState>({
    include_cvc_integrity_pact: true,
    include_conwartime_war_risk: true,
    include_piracy_clause: true,
    include_bunker_escalation: true,
    include_imo_carbon_clause: true,
    include_cyber_security: true,
    include_sanctions_clause: true,
  });

  const [activeTab, setActiveTab] = useState<"box" | "riders" | "audit">("box");
  const [contractResponse, setContractResponse] = useState<any>(null);
  const [validationResponse, setValidationResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate on initial load
  useEffect(() => {
    void handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateCharterparty({
        contract_type: contractType,
        box,
        riders,
      });
      setContractResponse(res);

      const val = await validateCharterparty({
        contract_type: contractType,
        box,
        riders,
      });
      setValidationResponse(val);
    } catch (err) {
      console.error("Failed to generate charterparty contract:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_CIL_IMPORT) => {
    setContractType(preset.type);
    setBox(preset.box);
  };

  const handleCopyMarkdown = () => {
    if (contractResponse?.full_contract_markdown) {
      void navigator.clipboard.writeText(contractResponse.full_contract_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Page Hero */}
      <PageHero
        pillar="Governance & Assurance"
        title="BIMCO Charterparty Contract Studio & Legal Clause Engine"
        purpose="Automated contract compilation for public bulk freight chartering under CVC & General Financial Rules (GFR Rule 144). Converts approved tender specifications into official, legally binding BIMCO GENCON 1994 (Voyage Charter) or NYPE 2015 (Time Charter) agreements with protective riders."
        questionsAnswered={[
          "How do tender award parameters map into standardized BIMCO Box Layouts (Part I)?",
          "Are all mandatory CVC anti-bribery covenants and Indian arbitration clauses active?",
          "Which protective riders (CONWARTIME 2004, Piracy 2013, IMO Carbon, Bunker Escalation) protect public sector funds during international voyages?",
        ]}
        truthClass="Official Sovereign Contract Drafting"
        lastUpdated="2026-09-24"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Select BIMCO Form & Fill Commercial Box Particulars (Rate, Cargo, Ports, Laycan)"
        step2="Configure Special Protective Riders (CVC Integrity Pact, CONWARTIME, Bunker Escalation)"
        step3="Audit Legal Compliance & Export Ready-to-Sign Official Contract Document"
        onLoadExample={() => handleApplyPreset(PRESET_CIL_IMPORT)}
        exampleLabel="Load Coal India Coking Coal Import Contract (GENCON 94)"
      />

      {/* 3. Operational Guide */}
      <ResultGuide
        title="BIMCO Standard Charterparty & CVC Public Procurement Guidelines"
        items={[
          {
            term: "BIMCO GENCON 1994",
            explanation:
              "The global standard voyage charterparty form for dry bulk cargoes (coal, iron ore, grains). Characterized by a 26-box commercial summary (Part I) and standardized liability, laytime, and demurrage clauses (Part II).",
          },
          {
            term: "BIMCO NYPE 2015",
            explanation:
              "The modern standard time charterparty form published jointly by ASBA and BIMCO. Used when hiring dedicated vessel capacity on a daily hire basis ($/day) where the charterer provides marine fuel and directs voyages.",
          },
          {
            term: "CVC Integrity Pact & GFR Rule 144",
            explanation:
              "Mandatory sovereign anti-corruption covenant required in all Indian PSU commercial tenders. Incorporates immediate termination, deposit forfeiture, and debarment/blacklisting upon any corrupt practice.",
          },
          {
            term: "BIMCO CONWARTIME 2004",
            explanation:
              "Standard war risk clause giving the Master and Owners liberty to refuse transit through active hostilities and entitling rerouting around the Cape of Good Hope if chokepoints (e.g. Bab-el-Mandeb / Red Sea) are attacked.",
          },
        ]}
        rules={[
          "Rule 1 (Arbitration Venue): Under Indian PSU procurement rules, all dispute resolution must specify Indian Law with the seat of arbitration in New Delhi under the Indian Arbitration and Conciliation Act 1996.",
          "Rule 2 (Despatch Convention): Standard public chartering requires Despatch Money to be fixed at exactly 50% of the daily Demurrage rate for laytime saved.",
          "Rule 3 (Mandatory CVC Rider): No contract may be finalized or executed without Rider A (CVC Integrity Pact) active and acknowledged by the shipowner.",
        ]}
        cautions={[
          "Review freight tax and port dues allocation (Box 12) to ensure Indian customs duties are assigned to the charterer and vessel tonnage dues to the owner.",
          "Ensure vessel RightShip safety clearance and age (< 20 years) have been verified in Pillar 4 before signing.",
        ]}
      />

      {/* Preset Fast-Loader Bar */}
      <section className="market-section" style={{ padding: "14px 18px", backgroundColor: "var(--paper)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} style={{ color: "var(--khaki-500)" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>Load Operational Template Preset:</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="mode-btn"
              style={{ fontSize: "11.5px", padding: "5px 12px" }}
              onClick={() => handleApplyPreset(PRESET_CIL_IMPORT)}
            >
              CIL Gladstone Import (GENCON 94)
            </button>
            <button
              type="button"
              className="mode-btn"
              style={{ fontSize: "11.5px", padding: "5px 12px" }}
              onClick={() => handleApplyPreset(PRESET_NTPC_VOYAGE)}
            >
              NTPC Richards Bay Import (GENCON 94)
            </button>
            <button
              type="button"
              className="mode-btn"
              style={{ fontSize: "11.5px", padding: "5px 12px" }}
              onClick={() => handleApplyPreset(PRESET_TIME_CHARTER)}
            >
              TANGEDCO Coastal Time Charter (NYPE 2015)
            </button>
          </div>
        </div>
      </section>

      {/* Main Studio Grid: Left Configuration & Right Live Legal Viewer */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 480px) minmax(400px, 1fr)", gap: "20px" }}>
        {/* =========================================================================
            LEFT COLUMN: CONTRACT CONTROLS & RIDER TOGGLES
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Template & Form Tabs */}
          <div className="mode-switcher" style={{ margin: 0 }}>
            <button
              type="button"
              className={`mode-btn ${activeTab === "box" ? "active" : ""}`}
              onClick={() => setActiveTab("box")}
              style={{ flex: 1, padding: "8px", fontSize: "12px" }}
            >
              <FileText size={14} /> 1. Box Terms (Part I)
            </button>
            <button
              type="button"
              className={`mode-btn ${activeTab === "riders" ? "active" : ""}`}
              onClick={() => setActiveTab("riders")}
              style={{ flex: 1, padding: "8px", fontSize: "12px" }}
            >
              <ShieldCheck size={14} /> 2. Riders (Part III)
            </button>
            <button
              type="button"
              className={`mode-btn ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
              style={{ flex: 1, padding: "8px", fontSize: "12px" }}
            >
              <Scale size={14} /> 3. CVC Compliance
            </button>
          </div>

          {/* TAB 1: COMMERCIAL BOX PARTICULAR INPUTS */}
          {activeTab === "box" && (
            <section className="market-section" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="eyebrow">Part I Particulars</span>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as any)}
                  style={{ fontSize: "12px", padding: "4px 8px", width: "auto" }}
                >
                  <option value="GENCON_1994">BIMCO GENCON 1994 (Voyage Charter)</option>
                  <option value="NYPE_2015">BIMCO NYPE 2015 (Time Charter)</option>
                </select>
              </div>

              {/* Form Inputs Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Contract Ref:</label>
                    <input
                      type="text"
                      value={box.contract_number}
                      onChange={(e) => setBox({ ...box, contract_number: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Date of Agreement:</label>
                    <input
                      type="date"
                      value={box.contract_date}
                      onChange={(e) => setBox({ ...box, contract_date: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Charterer Entity:</label>
                  <input
                    type="text"
                    value={box.charterer_name}
                    onChange={(e) => setBox({ ...box, charterer_name: e.target.value })}
                    style={{ width: "100%", padding: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Shipowner / Head Broker:</label>
                  <input
                    type="text"
                    value={box.owner_broker_name}
                    onChange={(e) => setBox({ ...box, owner_broker_name: e.target.value })}
                    style={{ width: "100%", padding: "6px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Nominated Vessel:</label>
                    <input
                      type="text"
                      value={box.vessel_name}
                      onChange={(e) => setBox({ ...box, vessel_name: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>IMO Number:</label>
                    <input
                      type="text"
                      value={box.imo_number}
                      onChange={(e) => setBox({ ...box, imo_number: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Loading Port:</label>
                    <input
                      type="text"
                      value={box.loading_port}
                      onChange={(e) => setBox({ ...box, loading_port: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Discharging Port:</label>
                    <input
                      type="text"
                      value={box.discharging_port}
                      onChange={(e) => setBox({ ...box, discharging_port: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Cargo Parcel (MT):</label>
                    <input
                      type="number"
                      value={box.cargo_quantity_mt}
                      onChange={(e) => setBox({ ...box, cargo_quantity_mt: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Tolerance (+/- %):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={box.quantity_tolerance_pct}
                      onChange={(e) => setBox({ ...box, quantity_tolerance_pct: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                </div>

                {/* Financial Rates */}
                {contractType === "GENCON_1994" ? (
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Freight Rate (USD / MT):</label>
                    <input
                      type="number"
                      step="0.10"
                      value={box.freight_rate_usd_mt}
                      onChange={(e) => setBox({ ...box, freight_rate_usd_mt: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Daily Hire Rate (USD / Day):</label>
                    <input
                      type="number"
                      step="100"
                      value={box.daily_hire_usd_day}
                      onChange={(e) => setBox({ ...box, daily_hire_usd_day: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Demurrage ($/Day):</label>
                    <input
                      type="number"
                      value={box.demurrage_usd_day}
                      onChange={(e) => {
                        const dem = parseFloat(e.target.value) || 0;
                        setBox({ ...box, demurrage_usd_day: dem, despatch_usd_day: round(dem / 2, 2) });
                      }}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Despatch (50% Dem):</label>
                    <input
                      type="number"
                      value={box.despatch_usd_day}
                      onChange={(e) => setBox({ ...box, despatch_usd_day: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Laytime (Hours):</label>
                    <input
                      type="number"
                      value={box.laytime_hours}
                      onChange={(e) => setBox({ ...box, laytime_hours: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Laytime Terms:</label>
                    <input
                      type="text"
                      value={box.laytime_terms}
                      onChange={(e) => setBox({ ...box, laytime_terms: e.target.value })}
                      style={{ width: "100%", padding: "6px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>Law & Arbitration Clause:</label>
                  <input
                    type="text"
                    value={box.governing_law_and_arbitration}
                    onChange={(e) => setBox({ ...box, governing_law_and_arbitration: e.target.value })}
                    style={{ width: "100%", padding: "6px" }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
                style={{ marginTop: "10px" }}
              >
                {loading ? "Compiling Contract..." : "Compile & Validate Contract"}
              </button>
            </section>
          )}

          {/* TAB 2: PROTECTIVE RIDER CLAUSE TOGGLES */}
          {activeTab === "riders" && (
            <section className="market-section" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "18px" }}>
              <span className="eyebrow">Part III Special Protective Riders</span>
              <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: "0 0 8px 0" }}>
                Toggle standard BIMCO and sovereign CVC clauses to append to the contract:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Rider 1: CVC Integrity Pact */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    backgroundColor: riders.include_cvc_integrity_pact ? "var(--olive-bg)" : "var(--white)",
                    border: riders.include_cvc_integrity_pact ? "1px solid var(--olive-border)" : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={riders.include_cvc_integrity_pact}
                    onChange={(e) => setRiders({ ...riders, include_cvc_integrity_pact: e.target.checked })}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--ink)" }}>
                      Rider A: CVC Anti-Corruption & Integrity Pact (GFR 144)
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                      Mandatory under Indian public procurement rules. Grants immediate termination & blacklisting upon corruption.
                    </small>
                  </div>
                </label>

                {/* Rider 2: CONWARTIME 2004 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    backgroundColor: riders.include_conwartime_war_risk ? "var(--paper)" : "var(--white)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={riders.include_conwartime_war_risk}
                    onChange={(e) => setRiders({ ...riders, include_conwartime_war_risk: e.target.checked })}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--ink)" }}>
                      Rider B: BIMCO CONWARTIME 2004 (War Risks)
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                      Standard war risks, hostile area deviation, and Cape of Good Hope rerouting provisions.
                    </small>
                  </div>
                </label>

                {/* Rider 3: Piracy 2013 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    backgroundColor: riders.include_piracy_clause ? "var(--paper)" : "var(--white)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={riders.include_piracy_clause}
                    onChange={(e) => setRiders({ ...riders, include_piracy_clause: e.target.checked })}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--ink)" }}>
                      Rider C: BIMCO Piracy Clause for Bulk Charters 2013
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                      Naval escort transit (IRTC), armed security guidelines, and laytime suspension rules.
                    </small>
                  </div>
                </label>

                {/* Rider 4: Bunker Escalation */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    backgroundColor: riders.include_bunker_escalation ? "var(--paper)" : "var(--white)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={riders.include_bunker_escalation}
                    onChange={(e) => setRiders({ ...riders, include_bunker_escalation: e.target.checked })}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--ink)" }}>
                      Rider D: Bunker Fuel Price Volatility Escalation Cap
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                      Adjusts freight rate if VLSFO market prices shift by more than +/- 10% from USD 620/MT benchmark.
                    </small>
                  </div>
                </label>

                {/* Rider 5: IMO Carbon CII */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    backgroundColor: riders.include_imo_carbon_clause ? "var(--paper)" : "var(--white)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={riders.include_imo_carbon_clause}
                    onChange={(e) => setRiders({ ...riders, include_imo_carbon_clause: e.target.checked })}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--ink)" }}>
                      Rider E: BIMCO Carbon Intensity Indicator (CII) & ESG
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                      Requires verified carbon emission reporting per metric ton-mile under IMO MEPC 76 regulations.
                    </small>
                  </div>
                </label>

                {/* Rider 6: Cyber Security */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "var(--radius)",
                    backgroundColor: riders.include_cyber_security ? "var(--paper)" : "var(--white)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={riders.include_cyber_security}
                    onChange={(e) => setRiders({ ...riders, include_cyber_security: e.target.checked })}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--ink)" }}>
                      Rider F: BIMCO Cyber Security Clause 2019
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                      Protocols for secure digital transmission of Notice of Readiness, bills of lading, and payments.
                    </small>
                  </div>
                </label>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
                style={{ marginTop: "10px" }}
              >
                {loading ? "Re-compiling Contract..." : "Re-compile Contract with Riders"}
              </button>
            </section>
          )}

          {/* TAB 3: CVC COMPLIANCE AUDIT SCORECARD */}
          {activeTab === "audit" && validationResponse && (
            <section className="market-section" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "18px" }}>
              <span className="eyebrow">CVC & GFR Rule 144 Compliance Audit</span>
              
              <div
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius)",
                  backgroundColor: validationResponse.is_cvc_compliant ? "var(--olive-bg)" : "var(--brick-bg)",
                  border: validationResponse.is_cvc_compliant ? "1px solid var(--olive-border)" : "1px solid var(--brick-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: validationResponse.is_cvc_compliant ? "var(--olive)" : "var(--brick)" }}>
                    AUDIT COMPLIANCE VERDICT
                  </div>
                  <strong style={{ fontSize: "1.3rem", color: validationResponse.is_cvc_compliant ? "var(--olive)" : "var(--brick)" }}>
                    {validationResponse.is_cvc_compliant ? "100% CVC & GFR COMPLIANT" : "NON-COMPLIANT / AMENDMENTS REQUIRED"}
                  </strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "var(--charcoal)" }}>Integrity Score:</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>
                    {validationResponse.compliance_score} / 100
                  </div>
                </div>
              </div>

              {/* Passed Checks */}
              <div>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "var(--olive)" }}>
                  Verified Regulatory Compliances ({validationResponse.passed_checks.length}):
                </h5>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "11.5px", color: "var(--ink)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {validationResponse.passed_checks.map((p: string, idx: number) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* Failed Checks */}
              {validationResponse.failed_checks.length > 0 && (
                <div>
                  <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "var(--brick)" }}>
                    Regulatory Observations ({validationResponse.failed_checks.length}):
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "11.5px", color: "var(--brick)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {validationResponse.failed_checks.map((f: string, idx: number) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Amendments */}
              {validationResponse.recommended_amendments.length > 0 && (
                <div style={{ padding: "10px", backgroundColor: "var(--paper)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)" }}>Recommended CVC Amendments:</span>
                  <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "11px", color: "var(--charcoal)" }}>
                    {validationResponse.recommended_amendments.map((a: string, idx: number) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Quick Summary Pill Card */}
          {contractResponse && (
            <div style={{ padding: "14px", backgroundColor: "var(--white)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "11.5px" }}>
              <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>Contract Summary:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", color: "var(--charcoal)" }}>
                <div><strong>Vessel:</strong> {box.vessel_name}</div>
                <div><strong>Class:</strong> {box.vessel_class}</div>
                <div><strong>Quantity:</strong> {box.cargo_quantity_mt.toLocaleString()} MT</div>
                <div><strong>Laytime:</strong> {box.laytime_hours} hrs</div>
                <div><strong>Demurrage:</strong> ${box.demurrage_usd_day.toLocaleString()} / day</div>
                <div><strong>Despatch:</strong> ${box.despatch_usd_day.toLocaleString()} / day</div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            RIGHT COLUMN: LIVE LEGAL DOCUMENT VIEWER (PREVIEW & EXPORT)
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Header Controls for Legal Viewer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="eyebrow">Legal Document Viewer</span>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "1.1rem" }}>
                {contractResponse ? contractResponse.title : "Compiling BIMCO Charterparty..."}
              </h3>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="mode-btn"
                onClick={handleCopyMarkdown}
                style={{ fontSize: "11.5px", padding: "6px 12px" }}
              >
                {copied ? <Check size={14} style={{ color: "var(--olive)" }} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Legal Text"}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrint}
                style={{ fontSize: "11.5px", padding: "6px 14px" }}
              >
                <Printer size={14} /> Print / Export Official Contract
              </button>
            </div>
          </div>

          {/* Full Legal Text Container (Styled Document View) */}
          <div
            id="printable-contract-document"
            style={{
              backgroundColor: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "24px 28px",
              boxShadow: "var(--shadow-subtle)",
              maxHeight: "780px",
              overflowY: "auto",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
              lineHeight: 1.6,
              color: "var(--ink)",
            }}
          >
            {contractResponse ? (
              <div>
                {/* Formal Document Title */}
                <div style={{ textAlign: "center", borderBottom: "2px solid var(--ink)", paddingBottom: "14px", marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--charcoal)" }}>
                    THE BALTIC AND INTERNATIONAL MARITIME COUNCIL (BIMCO) STANDARD FORM
                  </div>
                  <h2 style={{ fontSize: "1.3rem", margin: "4px 0", fontFamily: "var(--font-serif, serif)" }}>
                    {contractResponse.contract_type === "GENCON_1994" ? "UNIFORM GENERAL CHARTER (GENCON 1994)" : "NEW YORK PRODUCE EXCHANGE (NYPE 2015)"}
                  </h2>
                  <div style={{ fontSize: "11px", color: "var(--charcoal)" }}>
                    Document Reference: <strong>{box.contract_number}</strong> · Date: <strong>{box.contract_date}</strong>
                  </div>
                  <div style={{ display: "inline-block", marginTop: "6px", padding: "2px 8px", backgroundColor: contractResponse.compliance_status === "COMPLIANT" ? "var(--olive-bg)" : "var(--brick-bg)", border: contractResponse.compliance_status === "COMPLIANT" ? "1px solid var(--olive-border)" : "1px solid var(--brick-border)", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, color: contractResponse.compliance_status === "COMPLIANT" ? "var(--olive)" : "var(--brick)" }}>
                    STATUS: {contractResponse.compliance_status} (CVC GFR RULE 144 AUDITED)
                  </div>
                </div>

                {/* Part I Box Text */}
                <h4 style={{ margin: "14px 0 6px 0", fontSize: "13px", borderBottom: "1px solid var(--sand-200)", paddingBottom: "4px" }}>
                  PART I: COMMERCIAL BOX PARTICULARS
                </h4>
                <pre style={{ margin: 0, padding: "12px", backgroundColor: "var(--paper)", borderRadius: "4px", overflowX: "auto", fontSize: "11px" }}>
                  {contractResponse.part_i_box_text}
                </pre>

                {/* Part II Standard Clauses */}
                <h4 style={{ margin: "20px 0 8px 0", fontSize: "13px", borderBottom: "1px solid var(--sand-200)", paddingBottom: "4px" }}>
                  PART II: STANDARD TERMS AND CONDITIONS ({contractResponse.part_ii_standard_clauses.length} CLAUSES)
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {contractResponse.part_ii_standard_clauses.map((sc: any) => (
                    <div key={sc.clause_number} style={{ padding: "8px 0" }}>
                      <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                        Clause {sc.clause_number}. {sc.clause_title}
                      </div>
                      <div style={{ color: "var(--charcoal)", fontSize: "11.5px", textAlign: "justify" }}>
                        {sc.clause_text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Part III Protective Riders */}
                {contractResponse.part_iii_protective_riders.length > 0 && (
                  <div>
                    <h4 style={{ margin: "24px 0 8px 0", fontSize: "13px", borderBottom: "1px solid var(--sand-200)", paddingBottom: "4px" }}>
                      PART III: SPECIAL PROTECTIVE RIDER CLAUSES ({contractResponse.part_iii_protective_riders.length} RIDERS)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {contractResponse.part_iii_protective_riders.map((r: any, idx: number) => (
                        <div
                          key={r.clause_code}
                          style={{
                            padding: "10px 14px",
                            backgroundColor: r.mandatory_cvc ? "var(--olive-bg)" : "var(--paper)",
                            border: r.mandatory_cvc ? "1px solid var(--olive-border)" : "1px solid var(--border)",
                            borderRadius: "4px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                              Rider {idx + 1}. {r.title}
                            </span>
                            {r.mandatory_cvc && (
                              <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "2px 6px", backgroundColor: "var(--olive)", color: "var(--white)", borderRadius: "3px" }}>
                                MANDATORY CVC GFR RULE 144
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--graphite)", marginBottom: "6px" }}>
                            BIMCO Identification Code: <code>{r.clause_code}</code>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--charcoal)", whiteSpace: "pre-line", textAlign: "justify" }}>
                            {r.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatures & Execution */}
                <div style={{ marginTop: "30px", borderTop: "2px solid var(--ink)", paddingTop: "16px" }}>
                  <div style={{ fontWeight: 700, fontSize: "12px", textAlign: "center", marginBottom: "14px" }}>
                    IN WITNESS WHEREOF, THE PARTIES HAVE EXECUTED THIS CHARTERPARTY BY THEIR DULY AUTHORIZED OFFICERS
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", fontSize: "11px" }}>
                    <div style={{ padding: "12px", border: "1px dashed var(--border)", borderRadius: "4px" }}>
                      <strong>FOR AND ON BEHALF OF THE CHARTERER:</strong>
                      <div style={{ marginTop: "4px", color: "var(--charcoal)" }}>{box.charterer_name}</div>
                      <div style={{ marginTop: "25px", borderBottom: "1px solid var(--ink)" }}></div>
                      <div style={{ marginTop: "4px", fontSize: "10px" }}>Authorized Signatory / Chartering Officer</div>
                      <div style={{ fontSize: "10px", color: "var(--charcoal)" }}>Official Seal & Date</div>
                    </div>

                    <div style={{ padding: "12px", border: "1px dashed var(--border)", borderRadius: "4px" }}>
                      <strong>FOR AND ON BEHALF OF THE SHIPOWNER / BROKER:</strong>
                      <div style={{ marginTop: "4px", color: "var(--charcoal)" }}>{box.owner_broker_name}</div>
                      <div style={{ marginTop: "25px", borderBottom: "1px solid var(--ink)" }}></div>
                      <div style={{ marginTop: "4px", fontSize: "10px" }}>Authorized Signatory / Managing Director</div>
                      <div style={{ fontSize: "10px", color: "var(--charcoal)" }}>Company Seal & Date</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--charcoal)" }}>
                Loading BIMCO contract template and binding parameters...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
