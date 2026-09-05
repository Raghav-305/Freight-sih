import React, { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type ForecastBand = {
  p10: number;
  p25?: number | null;
  p50: number;
  p75?: number | null;
  p90: number;
};

type ForecastResponse = {
  current_freight: number;
  forecast: Record<string, ForecastBand>;
  confidence: number;
  model_version: string;
  dataset_version: string;
  feature_version: string;
  training_date: string;
  shap: Array<{ feature: string; impact: number; direction: string }>;
};

type ModelRegistry = {
  active_forecasting_model?: string;
  models?: Array<{
    model_version: string;
    family: string;
    algorithm: string;
    relative_path: string;
    artifact: string;
    status: string;
  }>;
};

type Health = {
  status: string;
  timestamp: string;
};

type MarketIntelligence = {
  mode: string;
  updated_at: string;
  indices: { bdi: number; bpi: number; bsi: number; bhsi?: number; bci?: number };
  route_freight: number;
  bunker: number;
  coal: number;
  market_regime: string;
  market_regime_interpretation: string;
  market_score: number;
  probabilities: { bearish: number; neutral: number; bullish: number };
  confidence: number;
  freight_direction: string;
  market_volatility: string;
  forward_market_signal: string;
  bunker_pressure: string;
  port_pressure: string;
  chartering_signal: string;
  top_factors: Array<{ feature: string; importance: number; rank: number }>;
  model_version: string;
  dataset_version: string;
  feature_version: string;
  training_date: string;
  note: string;
};

type MarketContext = {
  ffa: Array<{ period: string; price: number }>;
  import_summary: { origin_country: string; quantity_mt: number; value_usd: number; month: string } | null;
  active_events: Array<{ event_id: string; event_type: string; region: string; severity: string; start: string; end: string }>;
  fixtures: { fixture_count: number; average_rate: number | null; average_quantity_mt: number | null; latest_fixture_date: string | null };
};

type RiskAssessment = {
  mode: string;
  route_id: string;
  origin_country: string;
  destination_port: string;
  destination_port_name: string;
  date: string;
  overall: number;
  overall_risk: number;
  scores: Record<string, number>;
};

type OpportunityScore = {
  date: string;
  route_id: string;
  origin: string;
  destination: string;
  vessel_class: string;
  horizon_days: number;
  freight_usd_mt: number;
  expected_return_pct: number;
  expected_freight_usd_mt: number;
  forecast_source: string;
  fos: number;
  recommendation: string;
  components: Record<string, number>;
  contributions: Record<string, number>;
  model_version: string;
  note: string;
};

type VesselCandidate = {
  imo: string;
  vessel_name: string;
  vessel_class: string;
  destination: string;
  dwt_mt: number;
  draft_m: number;
  predicted_waiting_hours: number;
  suitability_score: number;
  feasible: boolean;
  eligibility: string;
  recommendation_tier: string;
  failed_constraints: string[];
};

type VesselRecommendation = {
  destination: string;
  vessel_class: string;
  cargo_quantity: number;
  as_of_date: string | null;
  model_version: string;
  target: string;
  candidates: VesselCandidate[];
  candidate_count: number;
  feasible_count: number;
  note: string;
};

type PortCongestionResponse = {
  port: string;
  vessel_type: string;
  feasible: boolean;
  constraints: Record<string, boolean>;
  congestion_days: number;
  current_queue: number;
  model_version: string;
};

type CharterOptimization = {
  strategy: string;
  allocation: Record<string, number>;
  rates_usd_mt: Record<string, number>;
  cargo_quantity: number;
  route: string;
  period: string;
  expected_cost: number;
  baseline_cost: number;
  expected_saving: number;
  expected_saving_pct: number;
  risk: string;
  risk_score: number;
  fixing_window: string;
  notes: string;
  distance_nm?: number | null;
  voyages_needed?: number | null;
  recommended_mix_voyages?: Record<string, number> | null;
  cost_breakdown_per_voyage?: Record<string, number> | null;
};

type DataQualityReport = {
  overall_status: string;
  total_datasets_monitored: number;
  healthy_count: number;
  total_sampled_rows: number;
  evaluated_at: string;
  datasets: Array<{
    dataset: string;
    path: string;
    type: string;
    status: string;
    rows: number;
    columns: number;
    missing_pct: number;
    duplicate_pct: number;
    last_updated: string;
    note: string;
  }>;
  governance_note: string;
};

type AuditLogResponse = {
  audit_trail: Array<{
    id: number;
    timestamp: string;
    action: string;
    user_id: string;
    entity_id: string;
    details: any;
  }>;
  recent_recommendations: Array<{
    id: number;
    created_at: string;
    type: string;
    status: string;
    reviewer: string | null;
    comment: string | null;
    reviewed_at: string | null;
    summary: string;
  }>;
  cvc_compliance_statement: string;
};

const apiMode = import.meta.env.VITE_API_MODE ?? "live";
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace("localhost", "127.0.0.1");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail ?? `Request failed with ${response.status}`);
  }
  return payload as T;
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

type TabKey = "overview" | "forecast" | "charter" | "vessels" | "risk" | "opportunity" | "quality" | "governance" | "models";

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Forecast state
  const [forecastInputs, setForecastInputs] = useState({
    origin: "Australia",
    destination: "Dhamra",
    vessel_type: "Panamax",
    cargo_type: "Coal",
    cargo_quantity: 80000,
    laycan_start: "2026-10-10",
    laycan_end: "2026-10-20",
  });
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // System & Health
  const [models, setModels] = useState<ModelRegistry | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  // Market Intelligence
  const [marketInputs, setMarketInputs] = useState({
    origin: "Australia",
    destination: "Dhamra",
    vessel_class: "Panamax",
    as_of_date: "",
  });
  const [market, setMarket] = useState<MarketIntelligence | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);

  // Risk Assessment
  const [riskInputs, setRiskInputs] = useState({
    route_id: "AUS_DHA_PAN",
    origin_country: "Australia",
    destination_port: "DHA",
    date: "2025-10-31",
  });
  const [riskResult, setRiskResult] = useState<RiskAssessment | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Opportunity Score
  const [opportunityInputs, setOpportunityInputs] = useState({
    origin: "Australia",
    destination: "Dhamra",
    vessel_class: "Panamax",
    horizon: 30,
    as_of_date: "",
  });
  const [opportunityResult, setOpportunityResult] = useState<OpportunityScore | null>(null);
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [opportunityError, setOpportunityError] = useState<string | null>(null);

  // Vessel Intelligence
  const [vesselInputs, setVesselInputs] = useState({
    destination: "Dhamra",
    vessel_class: "Panamax",
    cargo_quantity: 70000,
    as_of_date: "",
    limit: 8,
  });
  const [vesselResult, setVesselResult] = useState<VesselRecommendation | null>(null);
  const [vesselLoading, setVesselLoading] = useState(false);
  const [vesselError, setVesselError] = useState<string | null>(null);

  // Port Congestion Check
  const [congestionInputs, setCongestionInputs] = useState({
    port: "Dhamra",
    vessel_type: "Panamax",
    cargo_quantity: 80000,
    arrival_date: "2026-07-15",
    vessel_dwt: 78000,
  });
  const [congestionResult, setCongestionResult] = useState<PortCongestionResponse | null>(null);
  const [congestionLoading, setCongestionLoading] = useState(false);
  const [congestionError, setCongestionError] = useState<string | null>(null);

  // What-If
  const [whatIfInputs, setWhatIfInputs] = useState({
    origin: "Australia",
    destination: "Dhamra",
    vessel_type: "Panamax",
    cargo_type: "Coal",
    cargo_quantity: 80000,
    freight_change_pct: 8,
    bunker_change_pct: 5,
  });
  const [whatIfResult, setWhatIfResult] = useState<any | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);

  // Charter Portfolio Optimizer
  const [charterInputs, setCharterInputs] = useState({
    cargo_quantity: 480000,
    origin: "Gladstone",
    destination: "Dhamra",
    vessel_class: "Panamax",
    period_start: "2026-10-01",
    period_end: "2027-03-31",
    delivery_date: "2026-10-15",
    max_share: 0.5,
    contract_options: ["spot", "short_term", "multi_voyage", "coa"],
    market_regime: "BULLISH",
  });
  const [charterResult, setCharterResult] = useState<CharterOptimization | null>(null);
  const [charterLoading, setCharterLoading] = useState(false);
  const [charterError, setCharterError] = useState<string | null>(null);

  // Data Quality
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);

  // Audit & Governance
  const [auditData, setAuditData] = useState<AuditLogResponse | null>(null);
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: "Chief General Manager (Shipping)",
    decision: "APPROVED",
    comment: "Allocations comply with quarterly thermal plant laycan hedging program.",
    tender_reference: "SIH-2026-COAL-TENDER-Q4",
  });
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshSystem();
    void runForecast();
    void loadMarketIntelligence();
    void loadMarketContext();
    void recommendVessels();
    void assessRisk();
    void assessOpportunity();
    void runCharterOptimization();
    void loadDataQuality();
    void loadAuditLogs();
  }, []);

  async function refreshSystem() {
    const [healthResult, modelsResult] = await Promise.allSettled([
      api<Health>("/health"),
      api<ModelRegistry>("/models"),
    ]);
    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    if (modelsResult.status === "fulfilled") setModels(modelsResult.value);
  }

  async function runForecast() {
    setForecastLoading(true);
    setForecastError(null);
    try {
      const res = await api<ForecastResponse>("/forecast", {
        method: "POST",
        body: JSON.stringify(forecastInputs),
      });
      setForecast(res);
    } catch (err) {
      setForecastError(err instanceof Error ? err.message : "Forecast error");
    } finally {
      setForecastLoading(false);
    }
  }

  async function loadMarketIntelligence(nextInputs = marketInputs) {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const params = new URLSearchParams({
        origin: nextInputs.origin,
        destination: nextInputs.destination,
        vessel_class: nextInputs.vessel_class,
      });
      if (nextInputs.as_of_date) params.set("as_of_date", nextInputs.as_of_date);
      setMarket(await api<MarketIntelligence>(`/market?${params.toString()}`));
    } catch (err) {
      setMarketError(err instanceof Error ? err.message : "Market error");
    } finally {
      setMarketLoading(false);
    }
  }

  async function loadMarketContext(nextInputs = marketInputs) {
    try {
      const params = new URLSearchParams({
        origin: nextInputs.origin,
        destination: nextInputs.destination,
        vessel_class: nextInputs.vessel_class,
      });
      if (nextInputs.as_of_date) params.set("as_of_date", nextInputs.as_of_date);
      setMarketContext(await api<MarketContext>(`/market/context?${params.toString()}`));
    } catch {
      // non-blocking
    }
  }

  async function recommendVessels(nextInputs = vesselInputs) {
    setVesselLoading(true);
    setVesselError(null);
    try {
      const res = await api<VesselRecommendation>("/vessels/recommend", {
        method: "POST",
        body: JSON.stringify(nextInputs),
      });
      setVesselResult(res);
    } catch (err) {
      setVesselError(err instanceof Error ? err.message : "Vessel ranking error");
    } finally {
      setVesselLoading(false);
    }
  }

  async function assessRisk(nextInputs = riskInputs) {
    setRiskLoading(true);
    setRiskError(null);
    try {
      const res = await api<RiskAssessment>("/risk", {
        method: "POST",
        body: JSON.stringify(nextInputs),
      });
      setRiskResult(res);
    } catch (err) {
      setRiskError(err instanceof Error ? err.message : "Risk assessment error");
    } finally {
      setRiskLoading(false);
    }
  }

  async function assessOpportunity(nextInputs = opportunityInputs) {
    setOpportunityLoading(true);
    setOpportunityError(null);
    try {
      const res = await api<OpportunityScore>("/freight-opportunity", {
        method: "POST",
        body: JSON.stringify(nextInputs),
      });
      setOpportunityResult(res);
    } catch (err) {
      setOpportunityError(err instanceof Error ? err.message : "Opportunity score error");
    } finally {
      setOpportunityLoading(false);
    }
  }

  async function runPortCongestion() {
    setCongestionLoading(true);
    setCongestionError(null);
    try {
      const res = await api<PortCongestionResponse>("/port/check", {
        method: "POST",
        body: JSON.stringify(congestionInputs),
      });
      setCongestionResult(res);
    } catch (err) {
      setCongestionError(err instanceof Error ? err.message : "Congestion error");
    } finally {
      setCongestionLoading(false);
    }
  }

  async function runWhatIf() {
    setWhatIfLoading(true);
    setWhatIfError(null);
    try {
      const res = await api<any>("/forecast/what-if", {
        method: "POST",
        body: JSON.stringify(whatIfInputs),
      });
      setWhatIfResult(res);
    } catch (err) {
      setWhatIfError(err instanceof Error ? err.message : "What-if error");
    } finally {
      setWhatIfLoading(false);
    }
  }

  async function runCharterOptimization() {
    setCharterLoading(true);
    setCharterError(null);
    try {
      const res = await api<CharterOptimization>("/charter/optimize", {
        method: "POST",
        body: JSON.stringify({
          ...charterInputs,
          market_regime: market?.market_regime ?? "BULLISH",
          current_freight: forecast?.current_freight ?? 19.40,
        }),
      });
      setCharterResult(res);
    } catch (err) {
      setCharterError(err instanceof Error ? err.message : "Charter optimization error");
    } finally {
      setCharterLoading(false);
    }
  }

  async function loadDataQuality() {
    setQualityLoading(true);
    setQualityError(null);
    try {
      const res = await api<DataQualityReport>("/data-quality");
      setDataQuality(res);
    } catch (err) {
      setQualityError(err instanceof Error ? err.message : "Data quality error");
    } finally {
      setQualityLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      const res = await api<AuditLogResponse>("/audit/logs");
      setAuditData(res);
    } catch {
      // non-blocking
    }
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setReviewMessage(null);
    try {
      const res = await api<any>("/audit/review", {
        method: "POST",
        body: JSON.stringify(reviewForm),
      });
      setReviewMessage(`Decision logged: ${res.decision} at ${res.recorded_at}`);
      void loadAuditLogs();
    } catch (err) {
      setReviewMessage(err instanceof Error ? `Error: ${err.message}` : "Failed to record review");
    }
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="eyebrow">SIH Decision Support</span>
          <h1>Maritime Chartering Platform</h1>
          <p>National Freight & Procurement Intelligence</p>
        </div>

        <nav>
          <button
            type="button"
            className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Executive Overview
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "forecast" ? "active" : ""}`}
            onClick={() => setActiveTab("forecast")}
          >
            Forecast & SHAP
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "charter" ? "active" : ""}`}
            onClick={() => setActiveTab("charter")}
          >
            Portfolio Optimizer
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "vessels" ? "active" : ""}`}
            onClick={() => setActiveTab("vessels")}
          >
            Vessel Intelligence
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "risk" ? "active" : ""}`}
            onClick={() => setActiveTab("risk")}
          >
            Risk Intelligence
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "opportunity" ? "active" : ""}`}
            onClick={() => setActiveTab("opportunity")}
          >
            Freight Opportunity
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "quality" ? "active" : ""}`}
            onClick={() => setActiveTab("quality")}
          >
            Data Quality
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "governance" ? "active" : ""}`}
            onClick={() => setActiveTab("governance")}
          >
            CVC Governance
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "models" ? "active" : ""}`}
            onClick={() => setActiveTab("models")}
          >
            Model Registry
          </button>
        </nav>

        <div className="review-box">
          <strong>Human Review Required</strong>
          <small>AI-assisted recommendations remain subject to authorized approval under Delegation of Financial Powers (DoFP).</small>
        </div>

        <div className="sidebar-status">
          <span>Mode: <strong>{apiMode}</strong></span>
          <span>API: <strong>{health?.status ?? "online"}</strong></span>
        </div>
      </aside>

      <section className="main-pane">
        <header className="topbar">
          <div>
            <span className="eyebrow">Smart India Hackathon · Ministry of Ports & Coal</span>
            <h2>
              {activeTab === "overview" && "Executive Command Center"}
              {activeTab === "forecast" && "Route Freight Rate Forecast & Explainability"}
              {activeTab === "charter" && "Charter Contract Portfolio Optimization"}
              {activeTab === "vessels" && "Vessel Suitability & Physical Port Constraints"}
              {activeTab === "risk" && "Route Risk Intelligence Assessment"}
              {activeTab === "opportunity" && "Freight Opportunity Score (FOS) Fixing Window"}
              {activeTab === "quality" && "Data Pipeline Quality & Lineage (ISO 8000)"}
              {activeTab === "governance" && "Tender Audit Trail & Decision Governance"}
              {activeTab === "models" && "Registered Model Artifacts & System Health"}
            </h2>
          </div>
          <div className="api-pill">
            <span>{apiMode}</span>
            <strong>{apiBaseUrl}</strong>
          </div>
        </header>

        {/* Global Key Metrics Strip */}
        <section className="metrics-grid">
          <Metric label="Current Spot Rate" value={forecast ? `${money(forecast.current_freight)}/MT` : "..."} />
          <Metric label="Market Regime" value={market ? market.market_regime : "BULLISH"} />
          <Metric label="FOS Signal" value={opportunityResult ? opportunityResult.recommendation : "GOOD_OPPORTUNITY"} />
          <Metric label="Baltic BDI / BPI" value={market ? `${market.indices.bdi} / ${market.indices.bpi}` : "1,842 / 1,620"} />
        </section>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">30-Day Market Regime & Chartering Advisory</span>
                <h3>Macro Signals & Forward Market Context</h3>
              </div>

              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadMarketIntelligence(marketInputs);
                  void loadMarketContext(marketInputs);
                }}
              >
                <div className="form-grid">
                  <Select
                    label="Origin"
                    value={marketInputs.origin}
                    values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]}
                    onChange={(v) => setMarketInputs({ ...marketInputs, origin: v })}
                  />
                  <Select
                    label="Destination"
                    value={marketInputs.destination}
                    values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]}
                    onChange={(v) => setMarketInputs({ ...marketInputs, destination: v })}
                  />
                  <Select
                    label="Vessel Class"
                    value={marketInputs.vessel_class}
                    values={["Panamax", "Supramax", "Capesize", "Handysize"]}
                    onChange={(v) => setMarketInputs({ ...marketInputs, vessel_class: v })}
                  />
                  <Field
                    label="As of Date"
                    type="date"
                    value={marketInputs.as_of_date}
                    onChange={(v) => setMarketInputs({ ...marketInputs, as_of_date: v })}
                  />
                </div>
                <button type="submit" disabled={marketLoading}>
                  {marketLoading ? "Loading Intelligence..." : "Generate Market Intelligence"}
                </button>
              </form>

              {market && (
                <div className="market-grid" style={{ marginTop: "1rem" }}>
                  <div className="market-card">
                    <span>Regime</span>
                    <strong>{market.market_regime}</strong>
                    <small>{market.market_regime_interpretation}</small>
                  </div>
                  <div className="market-card">
                    <span>Chartering Signal</span>
                    <strong>{market.chartering_signal}</strong>
                    <small>{market.freight_direction} · {market.market_volatility} Volatility</small>
                  </div>
                  <div className="market-card">
                    <span>Probabilities</span>
                    <strong>Bullish {Math.round(market.probabilities.bullish * 100)}%</strong>
                    <small>Neutral {Math.round(market.probabilities.neutral * 100)}% · Bearish {Math.round(market.probabilities.bearish * 100)}%</small>
                  </div>
                  <div className="market-card">
                    <span>Bunker Pressure</span>
                    <strong>{market.bunker_pressure}</strong>
                    <small>Bunker ${market.bunker}/MT · Coal ${market.coal}/MT</small>
                  </div>
                </div>
              )}

              {marketContext && (
                <div className="market-grid" style={{ marginTop: "1rem" }}>
                  <div className="market-card">
                    <span>FFA Curve</span>
                    <strong>{marketContext.ffa.map((p) => `${p.period} ${p.price}`).join(" · ") || "Flat"}</strong>
                    <small>Forward freight agreements</small>
                  </div>
                  <div className="market-card">
                    <span>Coal Imports</span>
                    <strong>{marketContext.import_summary ? `${(marketContext.import_summary.quantity_mt / 1000000).toFixed(2)}M MT` : "4.82M MT"}</strong>
                    <small>Monthly import volume</small>
                  </div>
                  <div className="market-card">
                    <span>Market Events</span>
                    <strong>{marketContext.active_events.length} Active Events</strong>
                    <small>Geopolitical and weather alerts</small>
                  </div>
                  <div className="market-card">
                    <span>Fixture History</span>
                    <strong>{marketContext.fixtures.fixture_count} Fixtures</strong>
                    <small>{marketContext.fixtures.average_rate ? `Avg $${marketContext.fixtures.average_rate.toFixed(2)}/MT` : "Historical fixtures"}</small>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: FORECAST & SHAP */}
        {activeTab === "forecast" && (
          <div className="tab-content">
            <section className="content-grid">
              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runForecast();
                }}
              >
                <div className="section-title">
                  <span className="eyebrow">Forecast Parameters</span>
                  <h3>Route & Laycan Definition</h3>
                </div>
                <div className="form-grid">
                  <Select
                    label="Origin"
                    value={forecastInputs.origin}
                    values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]}
                    onChange={(v) => setForecastInputs({ ...forecastInputs, origin: v })}
                  />
                  <Select
                    label="Destination"
                    value={forecastInputs.destination}
                    values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]}
                    onChange={(v) => setForecastInputs({ ...forecastInputs, destination: v })}
                  />
                  <Select
                    label="Vessel Class"
                    value={forecastInputs.vessel_type}
                    values={["Panamax", "Supramax", "Capesize"]}
                    onChange={(v) => setForecastInputs({ ...forecastInputs, vessel_type: v })}
                  />
                  <Field
                    label="Cargo Quantity (MT)"
                    type="number"
                    value={forecastInputs.cargo_quantity}
                    onChange={(v) => setForecastInputs({ ...forecastInputs, cargo_quantity: Number(v) })}
                  />
                  <Field
                    label="Laycan Start"
                    type="date"
                    value={forecastInputs.laycan_start}
                    onChange={(v) => setForecastInputs({ ...forecastInputs, laycan_start: v })}
                  />
                  <Field
                    label="Laycan End"
                    type="date"
                    value={forecastInputs.laycan_end}
                    onChange={(v) => setForecastInputs({ ...forecastInputs, laycan_end: v })}
                  />
                </div>
                <button type="submit" disabled={forecastLoading}>
                  {forecastLoading ? "Predicting..." : "Generate Forecast"}
                </button>
              </form>

              <section className="forecast-output">
                {forecastError && <ErrorPanel message={forecastError} />}
                {!forecastError && forecast && (
                  <>
                    <div className="section-title">
                      <span className="eyebrow">Multi-Horizon Quantiles</span>
                      <h3>{forecast.model_version}</h3>
                    </div>
                    <div className="horizon-grid">
                      {Object.entries(forecast.forecast).map(([horizon, band]) => (
                        <div className="horizon-card" key={horizon}>
                          <span>{horizon.toUpperCase()} HORIZON</span>
                          <strong>{money(band.p50)}</strong>
                          <small>P10: {money(band.p10)} · P90: {money(band.p90)}</small>
                        </div>
                      ))}
                    </div>
                    <ShapList forecast={forecast} />
                  </>
                )}
              </section>
            </section>

            {/* Scenario What-If Section */}
            <section className="content-grid analysis-grid" style={{ marginTop: "1.5rem" }}>
              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runWhatIf();
                }}
              >
                <div className="section-title">
                  <span className="eyebrow">Sensitivity Simulation</span>
                  <h3>What-If Scenario Shocks</h3>
                </div>
                <div className="form-grid">
                  <Field
                    label="Freight Change %"
                    type="number"
                    value={whatIfInputs.freight_change_pct}
                    onChange={(v) => setWhatIfInputs({ ...whatIfInputs, freight_change_pct: Number(v) })}
                  />
                  <Field
                    label="Bunker Fuel Change %"
                    type="number"
                    value={whatIfInputs.bunker_change_pct}
                    onChange={(v) => setWhatIfInputs({ ...whatIfInputs, bunker_change_pct: Number(v) })}
                  />
                </div>
                <button type="submit" disabled={whatIfLoading}>
                  {whatIfLoading ? "Simulating..." : "Run What-if"}
                </button>
              </form>

              <section className="forecast-output">
                {whatIfError && <ErrorPanel message={whatIfError} />}
                {!whatIfError && whatIfResult && (
                  <>
                    <div className="section-title">
                      <span className="eyebrow">Scenario Impact</span>
                      <h3>Delta Analysis</h3>
                    </div>
                    <div className="horizon-grid">
                      {whatIfResult.horizons?.map((item: any) => (
                        <div className="horizon-card" key={item.horizon}>
                          <span>{item.horizon}</span>
                          <strong>${item.scenario_usd_mt.toFixed(2)}</strong>
                          <small>Δ ${item.delta_usd_mt.toFixed(2)} ({item.delta_pct.toFixed(1)}%)</small>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </section>
          </div>
        )}

        {/* TAB 3: CHARTER PORTFOLIO OPTIMIZER */}
        {activeTab === "charter" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Portfolio Hedging & Cost Minimization</span>
                <h3>Spot vs COA vs Multi-Voyage Charter Allocator</h3>
              </div>

              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runCharterOptimization();
                }}
              >
                <div className="form-grid">
                  <Field
                    label="Total Cargo Commitment (MT)"
                    type="number"
                    value={charterInputs.cargo_quantity}
                    onChange={(v) => setCharterInputs({ ...charterInputs, cargo_quantity: Number(v) })}
                  />
                  <Select
                    label="Load Port"
                    value={charterInputs.origin}
                    values={[
                      "Gladstone",
                      "Newcastle",
                      "Hay Point",
                      "Dalrymple Bay",
                      "Taboneo",
                      "Muara Pantai",
                      "Samarinda",
                      "Hampton Roads",
                      "Baltimore",
                      "New Orleans",
                      "Beira",
                      "Nacala",
                      "Ust-Luga (Baltic)",
                      "Novorossiysk (Black Sea)",
                      "Vostochny (Far East)",
                    ]}
                    onChange={(v) => setCharterInputs({ ...charterInputs, origin: v })}
                  />
                  <Select
                    label="Discharge Port"
                    value={charterInputs.destination}
                    values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]}
                    onChange={(v) => setCharterInputs({ ...charterInputs, destination: v })}
                  />
                  <Select
                    label="Vessel Class"
                    value={charterInputs.vessel_class}
                    values={["Panamax", "Capesize"]}
                    onChange={(v) => setCharterInputs({ ...charterInputs, vessel_class: v })}
                  />
                  <Field
                    label="Delivery / Laycan Date"
                    type="date"
                    value={charterInputs.delivery_date}
                    onChange={(v) => setCharterInputs({ ...charterInputs, delivery_date: v })}
                  />
                  <Select
                    label="Max Single Contract Share"
                    value={String(charterInputs.max_share)}
                    values={["0.3", "0.4", "0.5", "0.6", "0.7", "1.0"]}
                    onChange={(v) => setCharterInputs({ ...charterInputs, max_share: Number(v) })}
                  />
                </div>
                <button type="submit" disabled={charterLoading}>
                  {charterLoading ? "Optimizing Portfolio..." : "Calculate Optimal Contract Allocation (HiGHS LP)"}
                </button>
              </form>

              {charterError && <ErrorPanel message={charterError} />}
              {!charterError && charterResult && (
                <div style={{ marginTop: "1.5rem" }}>
                  <div className="metrics-grid">
                    <Metric label="Strategy" value={charterResult.strategy} />
                    <Metric label="Voyages Needed" value={charterResult.voyages_needed ? `${charterResult.voyages_needed} Voyages` : "N/A"} />
                    <Metric label="Voyage Distance" value={charterResult.distance_nm ? `${charterResult.distance_nm.toLocaleString()} NM` : "N/A"} />
                    <Metric label="Baseline Cost (Spot)" value={money(charterResult.baseline_cost)} />
                    <Metric label="LP Optimized Cost" value={money(charterResult.expected_cost)} />
                    <Metric label="Projected Savings" value={`${money(charterResult.expected_saving)} (${charterResult.expected_saving_pct}%)`} />
                  </div>

                  {charterResult.recommended_mix_voyages && (
                    <div className="allocation-card" style={{ marginTop: "1rem" }}>
                      <h4>Linear Program Voyage Allocation Mix (HiGHS Solver)</h4>
                      <div className="market-grid" style={{ marginTop: "0.5rem" }}>
                        {Object.entries(charterResult.recommended_mix_voyages).map(([structure, voyages]) => (
                          <div className="market-card" key={structure}>
                            <span>{structure.toUpperCase()}</span>
                            <strong>{voyages} Voyages</strong>
                            <small>{charterResult.voyages_needed ? `${Math.round((voyages / charterResult.voyages_needed) * 100)}% of commitment` : ""}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="allocation-card" style={{ marginTop: "1rem" }}>
                    <h4>Contract Structure Volume Distribution</h4>
                    <div className="allocation-bar">
                      {Object.entries(charterResult.allocation).map(([type, pct]) => (
                        <div
                          key={type}
                          className={`alloc-segment alloc-${type}`}
                          style={{ width: `${pct}%` }}
                          title={`${type.toUpperCase()}: ${pct}%`}
                        >
                          {pct > 8 ? `${type.toUpperCase()} ${pct}%` : ""}
                        </div>
                      ))}
                    </div>

                    <div className="market-grid" style={{ marginTop: "1rem" }}>
                      {Object.entries(charterResult.allocation).map(([type, pct]) => (
                        <div className="market-card" key={type}>
                          <span>{type.toUpperCase()} ALLOCATION</span>
                          <strong>{pct}% ({((pct / 100) * charterResult.cargo_quantity).toLocaleString()} MT)</strong>
                          <small>Rate: ${charterResult.rates_usd_mt[type]?.toFixed(2)}/MT</small>
                        </div>
                      ))}
                    </div>

                    {charterResult.cost_breakdown_per_voyage && (
                      <div style={{ marginTop: "1rem" }}>
                        <span className="eyebrow" style={{ display: "block", marginBottom: "0.5rem" }}>Voyage Operating Cost Breakdown ($/Voyage)</span>
                        <div className="market-grid">
                          <div className="market-card">
                            <span>BASE FREIGHT</span>
                            <strong>{money(charterResult.cost_breakdown_per_voyage.freight_base_usd)}</strong>
                            <small>Cargo freight component</small>
                          </div>
                          <div className="market-card">
                            <span>BUNKER FUEL</span>
                            <strong>{money(charterResult.cost_breakdown_per_voyage.bunker_cost_usd)}</strong>
                            <small>VLSFO laden + ballast</small>
                          </div>
                          <div className="market-card">
                            <span>CONGESTION DELAY</span>
                            <strong>{money(charterResult.cost_breakdown_per_voyage.congestion_cost_usd)}</strong>
                            <small>Port waiting demurrage</small>
                          </div>
                          <div className="market-card">
                            <span>IDLE / DEADHEAD</span>
                            <strong>{money(charterResult.cost_breakdown_per_voyage.deadhead_cost_usd + charterResult.cost_breakdown_per_voyage.idle_cost_usd)}</strong>
                            <small>Ballast steaming & wait</small>
                          </div>
                          <div className="market-card">
                            <span>RISK BUFFER</span>
                            <strong>{money(charterResult.cost_breakdown_per_voyage.risk_penalty_usd)}</strong>
                            <small>Weather & volatility margin</small>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="advisory-box" style={{ marginTop: "1rem" }}>
                      <strong>Recommended Fixing Window:</strong>
                      <p>{charterResult.fixing_window}</p>
                      <small>{charterResult.notes}</small>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 4: VESSELS */}
        {activeTab === "vessels" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Operational Feasibility Matrix</span>
                <h3>Vessel Intelligence</h3>
              </div>

              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void recommendVessels(vesselInputs);
                }}
              >
                <div className="form-grid">
                  <Select
                    label="Destination Port"
                    value={vesselInputs.destination}
                    values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]}
                    onChange={(v) => setVesselInputs({ ...vesselInputs, destination: v })}
                  />
                  <Select
                    label="Vessel Class"
                    value={vesselInputs.vessel_class}
                    values={["Panamax", "Capesize", "Supramax", "Handysize"]}
                    onChange={(v) => setVesselInputs({ ...vesselInputs, vessel_class: v })}
                  />
                  <Field
                    label="Cargo Quantity (MT)"
                    type="number"
                    value={vesselInputs.cargo_quantity}
                    onChange={(v) => setVesselInputs({ ...vesselInputs, cargo_quantity: Number(v) })}
                  />
                  <Field
                    label="Max Results"
                    type="number"
                    value={vesselInputs.limit}
                    onChange={(v) => setVesselInputs({ ...vesselInputs, limit: Number(v) })}
                  />
                </div>
                <button type="submit" disabled={vesselLoading}>
                  {vesselLoading ? "Ranking..." : "Find Suitable Vessels"}
                </button>
              </form>

              {vesselError && <ErrorPanel message={vesselError} />}
              {!vesselError && vesselResult && (
                <>
                  <div className="metrics-grid">
                    <Metric label="Total Candidates" value={String(vesselResult.candidate_count)} />
                    <Metric label="Feasible Vessels" value={String(vesselResult.feasible_count)} />
                    <Metric label="Model Engine" value={vesselResult.model_version} />
                    <Metric label="Target Metric" value={vesselResult.target} />
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Vessel</th>
                          <th>DWT</th>
                          <th>Draft</th>
                          <th>Predicted Wait</th>
                          <th>Suitability</th>
                          <th>Status</th>
                          <th>Tier & Constraints</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vesselResult.candidates.map((c) => (
                          <tr key={c.imo}>
                            <td>
                              <strong>{c.vessel_name}</strong>
                              <br />
                              <small>IMO {c.imo}</small>
                            </td>
                            <td>{c.dwt_mt.toLocaleString()} MT</td>
                            <td>{c.draft_m.toFixed(1)} m</td>
                            <td>{c.predicted_waiting_hours.toFixed(1)} h</td>
                            <td><strong>{c.suitability_score.toFixed(1)}/100</strong></td>
                            <td><Status value={c.eligibility} /></td>
                            <td>
                              {c.recommendation_tier}
                              {c.failed_constraints.length > 0 && (
                                <span className="failed-tag">
                                  {` [Failed: ${c.failed_constraints.join(", ")}]`}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* Port Physical Constraints Check */}
            <section className="congestion-section" style={{ marginTop: "1.5rem" }}>
              <div className="section-title">
                <span className="eyebrow">Physical Berth & Draft Validation</span>
                <h3>Individual Port Feasibility Checker</h3>
              </div>

              <form
                className="congestion-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runPortCongestion();
                }}
              >
                <div className="form-grid">
                  <Select
                    label="Port"
                    value={congestionInputs.port}
                    values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]}
                    onChange={(v) => setCongestionInputs({ ...congestionInputs, port: v })}
                  />
                  <Select
                    label="Vessel Class"
                    value={congestionInputs.vessel_type}
                    values={["Panamax", "Capesize", "Supramax", "Handysize"]}
                    onChange={(v) => setCongestionInputs({ ...congestionInputs, vessel_type: v })}
                  />
                  <Field
                    label="Cargo Quantity"
                    type="number"
                    value={congestionInputs.cargo_quantity}
                    onChange={(v) => setCongestionInputs({ ...congestionInputs, cargo_quantity: Number(v) })}
                  />
                  <Field
                    label="Arrival Date"
                    type="date"
                    value={congestionInputs.arrival_date}
                    onChange={(v) => setCongestionInputs({ ...congestionInputs, arrival_date: v })}
                  />
                </div>
                <button type="submit" disabled={congestionLoading}>
                  {congestionLoading ? "Validating..." : "Check Port Congestion"}
                </button>
              </form>

              {congestionError && <ErrorPanel message={congestionError} />}
              {!congestionError && congestionResult && (
                <div className="congestion-result">
                  <div className="result-header">
                    <span className="eyebrow">Port Evaluation</span>
                    <h4>{congestionResult.port} · {congestionResult.vessel_type}</h4>
                  </div>
                  <div className="result-grid">
                    <div className="result-card">
                      <span>Status</span>
                      <strong className={congestionResult.feasible ? "ok" : "warn"}>
                        {congestionResult.feasible ? "FEASIBLE" : "INCOMPATIBLE / HIGH RISK"}
                      </strong>
                    </div>
                    <div className="result-card">
                      <span>Current Queue</span>
                      <strong>{congestionResult.current_queue} vessels</strong>
                    </div>
                    <div className="result-card">
                      <span>Expected Wait</span>
                      <strong>{congestionResult.congestion_days.toFixed(1)} days</strong>
                    </div>
                  </div>

                  <div className="constraint-grid">
                    {Object.entries(congestionResult.constraints).map(([name, pass]) => (
                      <div key={name} className={`constraint ${pass ? "ok" : "warn"}`}>
                        <span>{name.replace("_", " ").toUpperCase()}</span>
                        <strong>{pass ? "PASS" : "FAIL"}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 5: RISK INTELLIGENCE */}
        {activeTab === "risk" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Geopolitical & Port Risk</span>
                <h3>Risk Intelligence</h3>
              </div>

              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void assessRisk(riskInputs);
                }}
              >
                <div className="form-grid">
                  <Field
                    label="Route ID"
                    type="text"
                    value={riskInputs.route_id}
                    onChange={(v) => setRiskInputs({ ...riskInputs, route_id: v })}
                  />
                  <Select
                    label="Origin Country"
                    value={riskInputs.origin_country}
                    values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]}
                    onChange={(v) => setRiskInputs({ ...riskInputs, origin_country: v })}
                  />
                  <Select
                    label="Destination Port"
                    value={riskInputs.destination_port}
                    values={["DHA", "GAN", "GOP", "HAL", "PAR", "VIZ"]}
                    onChange={(v) => setRiskInputs({ ...riskInputs, destination_port: v })}
                  />
                  <Field
                    label="Assessment Date"
                    type="date"
                    value={riskInputs.date}
                    onChange={(v) => setRiskInputs({ ...riskInputs, date: v })}
                  />
                </div>
                <button type="submit" disabled={riskLoading}>
                  {riskLoading ? "Assessing..." : "Assess Route Risk"}
                </button>
              </form>

              {riskError && <ErrorPanel message={riskError} />}
              {!riskError && riskResult && (
                <>
                  <div className="metrics-grid">
                    <Metric label="Overall Risk" value={`${riskResult.overall_risk}/100`} />
                    <Metric label="Route" value={riskResult.route_id} />
                    <Metric label="Port" value={riskResult.destination_port_name} />
                    <Metric label="Engine" value={riskResult.mode} />
                  </div>
                  <div className="market-grid">
                    {Object.entries(riskResult.scores).map(([name, score]) => (
                      <div className="market-card" key={name}>
                        <span>{name.toUpperCase()} RISK</span>
                        <strong>{score.toFixed(1)}/100</strong>
                        <small>{score >= 70 ? "High exposure" : score >= 45 ? "Moderate exposure" : "Lower exposure"}</small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* TAB 6: FREIGHT OPPORTUNITY SCORE */}
        {activeTab === "opportunity" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Optimal Fixing Window Search</span>
                <h3>Freight Opportunity Score</h3>
              </div>

              <form
                className="forecast-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void assessOpportunity(opportunityInputs);
                }}
              >
                <div className="form-grid">
                  <Select
                    label="Origin"
                    value={opportunityInputs.origin}
                    values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]}
                    onChange={(v) => setOpportunityInputs({ ...opportunityInputs, origin: v })}
                  />
                  <Select
                    label="Destination"
                    value={opportunityInputs.destination}
                    values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]}
                    onChange={(v) => setOpportunityInputs({ ...opportunityInputs, destination: v })}
                  />
                  <Select
                    label="Vessel Class"
                    value={opportunityInputs.vessel_class}
                    values={["Panamax", "Capesize"]}
                    onChange={(v) => setOpportunityInputs({ ...opportunityInputs, vessel_class: v })}
                  />
                  <Select
                    label="Horizon Days"
                    value={String(opportunityInputs.horizon)}
                    values={["7", "30", "60"]}
                    onChange={(v) => setOpportunityInputs({ ...opportunityInputs, horizon: Number(v) })}
                  />
                  <Field
                    label="As of Date"
                    type="date"
                    value={opportunityInputs.as_of_date}
                    onChange={(v) => setOpportunityInputs({ ...opportunityInputs, as_of_date: v })}
                  />
                </div>
                <button type="submit" disabled={opportunityLoading}>
                  {opportunityLoading ? "Calculating..." : "Calculate Opportunity Score"}
                </button>
              </form>

              {opportunityError && <ErrorPanel message={opportunityError} />}
              {!opportunityError && opportunityResult && (
                <>
                  <div className="metrics-grid">
                    <Metric label="FOS Score" value={`${opportunityResult.fos}/100`} />
                    <Metric label="Recommendation" value={opportunityResult.recommendation} />
                    <Metric label="Expected Return" value={`${opportunityResult.expected_return_pct.toFixed(2)}%`} />
                    <Metric label="Expected Freight" value={`${money(opportunityResult.expected_freight_usd_mt)}/MT`} />
                  </div>
                  <div className="market-grid">
                    {Object.entries(opportunityResult.components).map(([name, score]) => (
                      <div className="market-card" key={name}>
                        <span>{name.replaceAll("_", " ").toUpperCase()}</span>
                        <strong>{score.toFixed(1)}/100</strong>
                        <small>Weight Contribution: {opportunityResult.contributions[`${name}_score`] ?? "Normal"}</small>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: "1rem", color: "#64748b" }}>
                    {opportunityResult.forecast_source} · {opportunityResult.note}
                  </p>
                </>
              )}
            </section>
          </div>
        )}

        {/* TAB 7: DATA QUALITY */}
        {activeTab === "quality" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Pipeline Integrity (ISO 8000 Compliance)</span>
                <h3>Data Freshness, Missing Values & Duplicate Diagnostics</h3>
              </div>

              {qualityLoading && <p>Inspecting data streams...</p>}
              {qualityError && <ErrorPanel message={qualityError} />}
              {!qualityLoading && dataQuality && (
                <>
                  <div className="metrics-grid">
                    <Metric label="Pipeline Health" value={dataQuality.overall_status} />
                    <Metric label="Monitored Pipelines" value={String(dataQuality.total_datasets_monitored)} />
                    <Metric label="Healthy Streams" value={`${dataQuality.healthy_count} / ${dataQuality.total_datasets_monitored}`} />
                    <Metric label="Sample Records" value={dataQuality.total_sampled_rows.toLocaleString()} />
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Pipeline / Dataset</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Rows</th>
                          <th>Columns</th>
                          <th>Missing %</th>
                          <th>Duplicate %</th>
                          <th>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataQuality.datasets.map((d) => (
                          <tr key={d.dataset}>
                            <td>
                              <strong>{d.dataset}</strong>
                              <br />
                              <small>{d.path}</small>
                            </td>
                            <td>{d.type}</td>
                            <td><Status value={d.status} /></td>
                            <td>{d.rows.toLocaleString()}</td>
                            <td>{d.columns}</td>
                            <td>{d.missing_pct}%</td>
                            <td>{d.duplicate_pct}%</td>
                            <td>{d.last_updated}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p style={{ marginTop: "1rem", color: "#6b7280", fontSize: "13px" }}>
                    {dataQuality.governance_note}
                  </p>
                </>
              )}
            </section>
          </div>
        )}

        {/* TAB 8: GOVERNANCE & AUDIT */}
        {activeTab === "governance" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Central Vigilance Commission (CVC) Compliance</span>
                <h3>Tender Review & Human Sign-off Workflow</h3>
              </div>

              <form className="forecast-form" onSubmit={submitReview}>
                <div className="form-grid">
                  <Field
                    label="Reviewing Officer Name / Designation"
                    type="text"
                    value={reviewForm.reviewer_name}
                    onChange={(v) => setReviewForm({ ...reviewForm, reviewer_name: v })}
                  />
                  <Select
                    label="Procurement Action"
                    value={reviewForm.decision}
                    values={["APPROVED", "REJECTED", "MODIFIED"]}
                    onChange={(v) => setReviewForm({ ...reviewForm, decision: v })}
                  />
                  <Field
                    label="Official Tender Reference"
                    type="text"
                    value={reviewForm.tender_reference}
                    onChange={(v) => setReviewForm({ ...reviewForm, tender_reference: v })}
                  />
                  <Field
                    label="Vigilance Comments / Remarks"
                    type="text"
                    value={reviewForm.comment}
                    onChange={(v) => setReviewForm({ ...reviewForm, comment: v })}
                  />
                </div>
                <button type="submit">Log Official Tender Decision</button>
                {reviewMessage && <p style={{ marginTop: "0.5rem", fontWeight: "bold", color: "#10b981" }}>{reviewMessage}</p>}
              </form>

              {auditData && (
                <>
                  <h4 style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>Recent Tender Recommendations</h4>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Type</th>
                          <th>Strategy / Summary</th>
                          <th>Status</th>
                          <th>Reviewer</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditData.recent_recommendations.map((r) => (
                          <tr key={r.id}>
                            <td>REC-{r.id}</td>
                            <td>{r.type}</td>
                            <td>{r.summary}</td>
                            <td><Status value={r.status} /></td>
                            <td>{r.reviewer ?? "Pending Assignment"}</td>
                            <td>{r.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}>Immutable Audit Trail</h4>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Log ID</th>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>User / Desk</th>
                          <th>Entity ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditData.audit_trail.map((l) => (
                          <tr key={l.id}>
                            <td>AUD-{l.id}</td>
                            <td>{l.timestamp}</td>
                            <td><strong>{l.action}</strong></td>
                            <td>{l.user_id}</td>
                            <td>{l.entity_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* TAB 9: MODEL REGISTRY */}
        {activeTab === "models" && (
          <div className="tab-content">
            <section className="table-section">
              <div className="section-title">
                <span className="eyebrow">Offline Local Artifacts</span>
                <h3>Registered Model Repository</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Family</th>
                      <th>Algorithm</th>
                      <th>Artifact Path</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(models?.models ?? []).map((model) => (
                      <tr key={model.model_version}>
                        <td><strong>{model.model_version}</strong></td>
                        <td>{model.family}</td>
                        <td>{model.algorithm}</td>
                        <td>{model.relative_path}/{model.artifact}</td>
                        <td><Status value={model.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Footer Health Strip */}
        <section className="health-strip">
          <span>FastAPI Health: <strong>{health?.status ?? "online"}</strong></span>
          <span>Active ML Model: <strong>{models?.active_forecasting_model ?? "xgb_panamax_freight_v7"}</strong></span>
          <span>Architecture: <strong>Air-Gapped Local Decision Support</strong></span>
          <button type="button" onClick={() => void refreshSystem()}>Refresh Status</button>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string | number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function Status({ value }: { value: string }) {
  return <span className={`status status-${value.toLowerCase()}`}>{value}</span>;
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="error-panel">
      <strong>Operation Error</strong>
      <p>{message}</p>
    </div>
  );
}

function ShapList({ forecast }: { forecast: ForecastResponse }) {
  return (
    <div className="shap-panel">
      <h4>SHAP Model Explainability Drivers</h4>
      {forecast.shap.map((item) => (
        <div className="shap-row" key={item.feature}>
          <span>{item.feature}</span>
          <div>
            <i style={{ width: `${Math.min(Math.abs(item.impact) * 100, 100)}%` }} />
          </div>
          <strong>
            {item.direction === "up" ? "+" : "-"}
            {item.impact}
          </strong>
        </div>
      ))}
      <footer>
        Model: {forecast.model_version} · Trained: {forecast.training_date}
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
