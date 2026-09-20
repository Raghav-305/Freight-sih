import React, { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { CommandHeader } from "./components/CommandHeader";
import { EligibilityMatrix } from "./components/EligibilityMatrix";
import { ScenarioComparator } from "./components/ScenarioComparator";
import { MapCanvas } from "./components/MapCanvas";
import { AuditTimeline } from "./components/AuditTimeline";
import { AnchorStatus } from "./components/AnchorStatus";
import { FreshnessBadge } from "./components/FreshnessBadge";

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

type RiskCounterfactualItem = {
  factor: string;
  current_score: number;
  if_resolved_overall_becomes: number;
  overall_drops_by: number;
};

type RiskCounterfactualResponse = {
  baseline: Record<string, any>;
  biggest_lever: string;
  counterfactuals: RiskCounterfactualItem[];
  summary_insight: string;
};

type CharterSensitivityItem = {
  lever: string;
  change: string;
  new_cost_usd: number;
  saving_usd: number;
  mix_changed: boolean;
};

type CharterCounterfactualResponse = {
  baseline: Record<string, any>;
  biggest_lever: string;
  cost_sensitivity: CharterSensitivityItem[];
  note: string;
  summary_insight: string;
};

type CustomRiskSimulation = {
  baseline: Record<string, any>;
  simulated: Record<string, any>;
  overrides_applied: Record<string, number>;
  overall_delta: number;
  impact_direction: string;
};

type CustomCharterSimulation = {
  baseline: Record<string, any>;
  simulated: Record<string, any>;
  shifts: Record<string, number>;
  saving_usd: number;
  mix_changed: boolean;
};


const apiMode = import.meta.env.VITE_API_MODE ?? "live";
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace("localhost", "127.0.0.1").replace(/\/$/, "");

function apiUrl(path: string) {
  const apiPath = path.startsWith("/api/") ? path : `/api${path}`;
  return `${apiBaseUrl}${apiPath}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON response from ${path}, but received ${contentType || "empty/HTML response"}`);
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail ?? `Request failed with ${response.status}`);
  }
  return payload as T;
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

type TabKey =
  | "overview"
  | "forecast"
  | "charter"
  | "vessels"
  | "risk"
  | "opportunity"
  | "scenarios"
  | "ports"
  | "map"
  | "quality"
  | "governance"
  | "models"
  | "counterfactual";

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

  // Layer 6: Counterfactual Explanations State
  const [cfMode, setCfMode] = useState<"risk" | "charter" | "sandbox">("risk");
  const [riskCfResult, setRiskCfResult] = useState<RiskCounterfactualResponse | null>(null);
  const [riskCfLoading, setRiskCfLoading] = useState(false);
  const [riskCfError, setRiskCfError] = useState<string | null>(null);

  const [charterCfResult, setCharterCfResult] = useState<CharterCounterfactualResponse | null>(null);
  const [charterCfLoading, setCharterCfLoading] = useState(false);
  const [charterCfError, setCharterCfError] = useState<string | null>(null);

  // Counterfactual Sandbox states
  const [riskOverrides, setRiskOverrides] = useState<Record<string, number>>({
    market: 50,
    port: 50,
    weather: 50,
    geopolitical: 50,
    supply: 50,
    contract: 50,
  });
  const [riskSimResult, setRiskSimResult] = useState<CustomRiskSimulation | null>(null);
  const [riskSimLoading, setRiskSimLoading] = useState(false);

  const [charterShifts, setCharterShifts] = useState({
    bunker_pct_change: -8,
    congestion_days_delta: -1.0,
    spot_rate_pct_change: -5,
  });
  const [charterSimResult, setCharterSimResult] = useState<CustomCharterSimulation | null>(null);
  const [charterSimLoading, setCharterSimLoading] = useState(false);

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
    void fetchRiskCounterfactuals();
    void fetchCharterCounterfactuals();
  }, []);

  async function fetchRiskCounterfactuals(nextInputs = riskInputs) {
    setRiskCfLoading(true);
    setRiskCfError(null);
    try {
      const res = await api<RiskCounterfactualResponse>("/counterfactual/risk", {
        method: "POST",
        body: JSON.stringify(nextInputs),
      });
      setRiskCfResult(res);
      if (res.baseline) {
        setRiskOverrides({
          market: res.baseline.market ?? 50,
          port: res.baseline.port ?? 50,
          weather: res.baseline.weather ?? 50,
          geopolitical: res.baseline.geopolitical ?? 50,
          supply: res.baseline.supply ?? 50,
          contract: res.baseline.contract ?? 50,
        });
      }
    } catch (err) {
      setRiskCfError(err instanceof Error ? err.message : "Risk counterfactual error");
    } finally {
      setRiskCfLoading(false);
    }
  }

  async function fetchCharterCounterfactuals(nextInputs = charterInputs) {
    setCharterCfLoading(true);
    setCharterCfError(null);
    try {
      const res = await api<CharterCounterfactualResponse>("/counterfactual/charter", {
        method: "POST",
        body: JSON.stringify({
          origin_port: nextInputs.origin,
          destination_port: nextInputs.destination,
          vessel_class: nextInputs.vessel_class,
          cargo_quantity_mt: nextInputs.cargo_quantity,
          delivery_date: nextInputs.delivery_date || "2026-10-15",
        }),
      });
      setCharterCfResult(res);
    } catch (err) {
      setCharterCfError(err instanceof Error ? err.message : "Charter sensitivity error");
    } finally {
      setCharterCfLoading(false);
    }
  }

  async function runRiskSimulation(customOverrides = riskOverrides) {
    setRiskSimLoading(true);
    try {
      const res = await api<CustomRiskSimulation>("/counterfactual/risk/simulate", {
        method: "POST",
        body: JSON.stringify({
          route_id: riskInputs.route_id,
          origin_country: riskInputs.origin_country,
          destination_port: riskInputs.destination_port,
          date: riskInputs.date,
          overrides: customOverrides,
        }),
      });
      setRiskSimResult(res);
    } catch (err) {
      console.error("Risk simulation error", err);
    } finally {
      setRiskSimLoading(false);
    }
  }

  async function runCharterSimulation(shifts = charterShifts) {
    setCharterSimLoading(true);
    try {
      const res = await api<CustomCharterSimulation>("/counterfactual/charter/simulate", {
        method: "POST",
        body: JSON.stringify({
          origin_port: charterInputs.origin,
          destination_port: charterInputs.destination,
          vessel_class: charterInputs.vessel_class,
          cargo_quantity_mt: charterInputs.cargo_quantity,
          delivery_date: charterInputs.delivery_date || "2026-10-15",
          ...shifts,
        }),
      });
      setCharterSimResult(res);
    } catch (err) {
      console.error("Charter simulation error", err);
    } finally {
      setCharterSimLoading(false);
    }
  }

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
      void fetchRiskCounterfactuals(nextInputs);
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
      void fetchCharterCounterfactuals(charterInputs);
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
            className={`nav-btn ${activeTab === "scenarios" ? "active" : ""}`}
            onClick={() => setActiveTab("scenarios")}
          >
            Policy & Economics
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "ports" ? "active" : ""}`}
            onClick={() => setActiveTab("ports")}
          >
            Port Operations
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            Maritime GIS
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
          <button
            type="button"
            className={`nav-btn ${activeTab === "counterfactual" ? "active" : ""}`}
            onClick={() => setActiveTab("counterfactual")}
            style={{
              borderColor: activeTab === "counterfactual" ? "#38bdf8" : undefined,
              fontWeight: 700,
            }}
          >
            Counterfactuals (Layer 6)
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
              {activeTab === "scenarios" && "Pillar 1 · Policy Alignment & Landed Cost Economics"}
              {activeTab === "ports" && "Pillar 4 · Port Physical Operations & Berth Constraints"}
              {activeTab === "map" && "Pillar 2 · Maritime Geospatial GIS & Chokepoints"}
              {activeTab === "quality" && "Data Pipeline Quality & Lineage (ISO 8000)"}
              {activeTab === "governance" && "Pillar 3 · CVC Vigilance Governance & Immutable Audit Trail"}
              {activeTab === "models" && "Registered Model Artifacts & System Health"}
              {activeTab === "counterfactual" && "Layer 6 · Counterfactual Explanations & Sensitivity Search"}
            </h2>
          </div>
          <div className="api-pill">
            <span>{apiMode}</span>
            <strong>{apiBaseUrl || "same origin"}</strong>
          </div>
        </header>

        {/* Unified 5-Pillar Command Header */}
        <div style={{ marginBottom: "1rem", borderRadius: "8px", overflow: "hidden" }}>
          <CommandHeader />
        </div>

        {/* Mandatory CVC / GFR Compliance Advisory Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            marginBottom: "1.25rem",
            background: "#1e293b",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#e2e8f0",
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontSize: "16px" }}>⚖️</span>
          <div>
            <strong>CVC & GFR 2017 Compliance Rule:</strong> Decision-Support System Only. Final chartering, vessel fixation, or coal procurement action requires review and approval by an authorized officer under the applicable delegation and procurement framework.
          </div>
        </div>

        {/* Global Key Metrics Strip */}
        <section className="metrics-grid">
          <Metric label="Current Spot Rate" value={forecast?.current_freight ? `${money(forecast.current_freight)}/MT` : "..."} />
          <Metric label="Market Regime" value={market?.market_regime ?? "BULLISH"} />
          <Metric label="FOS Signal" value={opportunityResult?.recommendation ?? "GOOD_OPPORTUNITY"} />
          <Metric label="Baltic BDI / BPI" value={market?.indices ? `${market.indices.bdi} / ${market.indices.bpi}` : "1,842 / 1,620"} />
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

              {market && market.market_regime && (
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
                    <strong>Bullish {market.probabilities ? Math.round(market.probabilities.bullish * 100) : 0}%</strong>
                    <small>
                      Neutral {market.probabilities ? Math.round(market.probabilities.neutral * 100) : 0}% · Bearish {market.probabilities ? Math.round(market.probabilities.bearish * 100) : 0}%
                    </small>
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

        {/* TAB 10: COUNTERFACTUAL EXPLANATIONS (LAYER 6) */}
        {activeTab === "counterfactual" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Layer 6 Explainability · Decision Flip & Sensitivity Search</span>
                <h3>Counterfactual Explanations & Systematic Sensitivity Hub</h3>
                <small style={{ color: "var(--gov-muted)" }}>
                  Answers: <em>"What is the smallest realistic change that flips this decision or saves the most procurement capital?"</em>
                </small>
              </div>

              {/* Sub-mode Switcher */}
              <div className="mode-switcher" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className={`mode-btn ${cfMode === "risk" ? "active" : ""}`}
                  onClick={() => setCfMode("risk")}
                >
                  1. Risk Decision Explainer
                </button>
                <button
                  type="button"
                  className={`mode-btn ${cfMode === "charter" ? "active" : ""}`}
                  onClick={() => setCfMode("charter")}
                >
                  2. Charter Cost Sensitivity Explainer
                </button>
                <button
                  type="button"
                  className={`mode-btn ${cfMode === "sandbox" ? "active" : ""}`}
                  onClick={() => {
                    setCfMode("sandbox");
                    void runRiskSimulation();
                    void runCharterSimulation();
                  }}
                >
                  3. Interactive What-If Sandbox
                </button>
              </div>

              {/* MODE 1: RISK EXPLAINER */}
              {cfMode === "risk" && (
                <div>
                  <form
                    className="forecast-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void fetchRiskCounterfactuals(riskInputs);
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
                    <button type="submit" disabled={riskCfLoading}>
                      {riskCfLoading ? "Searching Levers..." : "Run Systematic Risk Counterfactual Search"}
                    </button>
                  </form>

                  {riskCfError && <ErrorPanel message={riskCfError} />}

                  {!riskCfLoading && riskCfResult && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <div className="metrics-grid">
                        <Metric label="Baseline Overall Risk" value={`${riskCfResult.baseline.overall}/100`} />
                        <Metric label="Primary Risk Driver" value={riskCfResult.biggest_lever.toUpperCase()} />
                        <Metric
                          label="Max Single Factor Drop"
                          value={`-${riskCfResult.counterfactuals[0]?.overall_drops_by.toFixed(1)} pts`}
                        />
                        <Metric
                          label="Target If Resolved"
                          value={`${riskCfResult.counterfactuals[0]?.if_resolved_overall_becomes.toFixed(1)}/100`}
                        />
                      </div>

                      <div className="cf-banner" style={{ marginTop: "1rem" }}>
                        <div className="cf-banner-badge">EXECUTIVE SUMMARY</div>
                        <div className="cf-banner-text">{riskCfResult.summary_insight}</div>
                      </div>

                      <div className="table-wrap" style={{ marginTop: "1rem" }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Risk Factor Lever</th>
                              <th>Current Score</th>
                              <th>If Resolved (10.0 Floor)</th>
                              <th>Overall Risk Drops By</th>
                              <th>Impact Share</th>
                              <th>Interactive Simulation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskCfResult.counterfactuals.map((cf, idx) => (
                              <tr key={cf.factor}>
                                <td><strong>#{idx + 1}</strong></td>
                                <td>
                                  <span className={`factor-badge factor-${cf.factor}`}>
                                    {cf.factor.toUpperCase()}
                                  </span>
                                </td>
                                <td><strong>{cf.current_score.toFixed(1)}/100</strong></td>
                                <td>
                                  <strong style={{ color: "#0284c7" }}>
                                    {cf.if_resolved_overall_becomes.toFixed(1)}/100
                                  </strong>
                                </td>
                                <td>
                                  <span className="delta-drop-pill">
                                    -{cf.overall_drops_by.toFixed(1)} pts
                                  </span>
                                </td>
                                <td>
                                  <div className="progress-bar-cf">
                                    <div
                                      className="progress-fill-cf"
                                      style={{
                                        width: `${Math.min(100, Math.max(10, (cf.overall_drops_by / (riskCfResult.counterfactuals[0]?.overall_drops_by || 1)) * 100))}%`,
                                      }}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="small-action-btn"
                                    onClick={() => {
                                      setCfMode("sandbox");
                                      const newOverrides = { ...riskOverrides, [cf.factor]: 10.0 };
                                      setRiskOverrides(newOverrides);
                                      void runRiskSimulation(newOverrides);
                                    }}
                                  >
                                    Test in Sandbox →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: CHARTER EXPLAINER */}
              {cfMode === "charter" && (
                <div>
                  <form
                    className="forecast-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void fetchCharterCounterfactuals(charterInputs);
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
                    </div>
                    <button type="submit" disabled={charterCfLoading}>
                      {charterCfLoading ? "Simulating Market Shifts..." : "Run HiGHS LP Cost Sensitivity Search"}
                    </button>
                  </form>

                  {charterCfError && <ErrorPanel message={charterCfError} />}

                  {!charterCfLoading && charterCfResult && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <div className="metrics-grid">
                        <Metric label="LP Optimized Baseline" value={money(charterCfResult.baseline.optimized_cost_usd)} />
                        <Metric label="Max Sensitivity Lever" value={charterCfResult.biggest_lever.replace("_", " ").toUpperCase()} />
                        <Metric label="Route" value={`${charterCfResult.baseline.origin_port} → ${charterCfResult.baseline.destination_port_name}`} />
                        <Metric label="Voyages Needed" value={`${charterCfResult.baseline.voyages_needed} Voyages`} />
                      </div>

                      <div className="cf-banner cf-banner-blue" style={{ marginTop: "1rem" }}>
                        <div className="cf-banner-badge">COST LEVERAGE INSIGHT</div>
                        <div className="cf-banner-text">{charterCfResult.summary_insight}</div>
                      </div>

                      <div className="cf-sensitivity-grid" style={{ marginTop: "1.2rem" }}>
                        {/* Bunker Sensitivity */}
                        <div className="sensitivity-column">
                          <div className="sens-header">
                            <strong>Bunker Price Shifts</strong>
                            <small>VLSFO USD/MT shifts (-2% to -20%)</small>
                          </div>
                          <div className="sens-cards">
                            {charterCfResult.cost_sensitivity
                              .filter((s) => s.lever === "bunker_price")
                              .map((s) => (
                                <div className="sens-card" key={s.change}>
                                  <span className="sens-change">{s.change}</span>
                                  <div className="sens-cost">{money(s.new_cost_usd)}</div>
                                  <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Congestion Sensitivity */}
                        <div className="sensitivity-column">
                          <div className="sens-header">
                            <strong>Port Congestion Reduction</strong>
                            <small>Fewer berth wait days (-0.5 to -3.0 d)</small>
                          </div>
                          <div className="sens-cards">
                            {charterCfResult.cost_sensitivity
                              .filter((s) => s.lever === "congestion")
                              .map((s) => (
                                <div className="sens-card" key={s.change}>
                                  <span className="sens-change">{s.change}</span>
                                  <div className="sens-cost">{money(s.new_cost_usd)}</div>
                                  <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Spot Rate Sensitivity */}
                        <div className="sensitivity-column">
                          <div className="sens-header">
                            <strong>Spot Freight Rate Drops</strong>
                            <small>Market softening (-2% to -20%)</small>
                          </div>
                          <div className="sens-cards">
                            {charterCfResult.cost_sensitivity
                              .filter((s) => s.lever === "spot_rate")
                              .map((s) => (
                                <div className="sens-card" key={s.change}>
                                  <span className="sens-change">{s.change}</span>
                                  <div className="sens-cost">{money(s.new_cost_usd)}</div>
                                  <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="cf-note-card" style={{ marginTop: "1rem" }}>
                        <strong>Architectural Truth & Contract Allocation Stability:</strong>
                        <p>{charterCfResult.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: INTERACTIVE WHAT-IF SANDBOX */}
              {cfMode === "sandbox" && (
                <div style={{ marginTop: "1rem" }}>
                  <div className="content-grid">
                    {/* Left: Risk Sandbox */}
                    <div className="sandbox-slider-card">
                      <div className="section-title">
                        <span className="eyebrow">Interactive Risk Engine Sandbox</span>
                        <h4>Dynamic Sub-Score Dial</h4>
                        <small style={{ color: "var(--gov-muted)" }}>
                          Tweak any individual risk sub-score to evaluate hypothetical route safety in real-time.
                        </small>
                      </div>

                      {Object.keys(riskOverrides).map((factor) => (
                        <div className="slider-row" key={factor}>
                          <span className="slider-label">{factor}</span>
                          <input
                            type="range"
                            className="slider-input"
                            min="0"
                            max="100"
                            step="1"
                            value={riskOverrides[factor]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...riskOverrides, [factor]: val };
                              setRiskOverrides(updated);
                              void runRiskSimulation(updated);
                            }}
                          />
                          <span className="slider-val">{riskOverrides[factor].toFixed(0)}</span>
                        </div>
                      ))}

                      {riskSimResult && (
                        <div style={{ marginTop: "1rem", padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Simulated Overall Risk:</span>
                            <strong style={{ fontSize: "16px", color: "var(--gov-navy)" }}>
                              {riskSimResult.simulated.overall.toFixed(1)}/100
                            </strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <span>Change from Baseline:</span>
                            <span
                              className="delta-drop-pill"
                              style={{
                                background: riskSimResult.overall_delta >= 0 ? "#ecfdf5" : "#fee2e2",
                                color: riskSimResult.overall_delta >= 0 ? "#059669" : "#991b1b",
                                borderColor: riskSimResult.overall_delta >= 0 ? "rgba(5, 150, 105, 0.25)" : "rgba(153, 27, 27, 0.25)",
                              }}
                            >
                              {riskSimResult.overall_delta >= 0 ? `-${riskSimResult.overall_delta.toFixed(1)} pts` : `+${Math.abs(riskSimResult.overall_delta).toFixed(1)} pts`} ({riskSimResult.impact_direction})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Charter Solver Sandbox */}
                    <div className="sandbox-slider-card">
                      <div className="section-title">
                        <span className="eyebrow">Interactive HiGHS Solver Sandbox</span>
                        <h4>Procurement Parameter Shift</h4>
                        <small style={{ color: "var(--gov-muted)" }}>
                          Simulate macro bunker price swings, port congestion shocks, and freight rate shifts.
                        </small>
                      </div>

                      <div className="slider-row">
                        <span className="slider-label">Bunker Price (%)</span>
                        <input
                          type="range"
                          className="slider-input"
                          min="-30"
                          max="30"
                          step="1"
                          value={charterShifts.bunker_pct_change}
                          onChange={(e) => {
                            const updated = { ...charterShifts, bunker_pct_change: Number(e.target.value) };
                            setCharterShifts(updated);
                            void runCharterSimulation(updated);
                          }}
                        />
                        <span className="slider-val">{charterShifts.bunker_pct_change > 0 ? `+${charterShifts.bunker_pct_change}%` : `${charterShifts.bunker_pct_change}%`}</span>
                      </div>

                      <div className="slider-row">
                        <span className="slider-label">Congestion (Days)</span>
                        <input
                          type="range"
                          className="slider-input"
                          min="-4"
                          max="4"
                          step="0.5"
                          value={charterShifts.congestion_days_delta}
                          onChange={(e) => {
                            const updated = { ...charterShifts, congestion_days_delta: Number(e.target.value) };
                            setCharterShifts(updated);
                            void runCharterSimulation(updated);
                          }}
                        />
                        <span className="slider-val">{charterShifts.congestion_days_delta > 0 ? `+${charterShifts.congestion_days_delta}d` : `${charterShifts.congestion_days_delta}d`}</span>
                      </div>

                      <div className="slider-row">
                        <span className="slider-label">Spot Rate (%)</span>
                        <input
                          type="range"
                          className="slider-input"
                          min="-30"
                          max="30"
                          step="1"
                          value={charterShifts.spot_rate_pct_change}
                          onChange={(e) => {
                            const updated = { ...charterShifts, spot_rate_pct_change: Number(e.target.value) };
                            setCharterShifts(updated);
                            void runCharterSimulation(updated);
                          }}
                        />
                        <span className="slider-val">{charterShifts.spot_rate_pct_change > 0 ? `+${charterShifts.spot_rate_pct_change}%` : `${charterShifts.spot_rate_pct_change}%`}</span>
                      </div>

                      {charterSimResult && (
                        <div style={{ marginTop: "1rem", padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Simulated Optimized Cost:</span>
                            <strong style={{ fontSize: "16px", color: "var(--gov-navy)" }}>
                              {money(charterSimResult.simulated.optimized_cost_usd)}
                            </strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <span>Net Cost Delta:</span>
                            <span
                              className="savings-pill"
                              style={{
                                background: charterSimResult.saving_usd >= 0 ? "#ecfdf5" : "#fee2e2",
                                color: charterSimResult.saving_usd >= 0 ? "#047857" : "#991b1b",
                                borderColor: charterSimResult.saving_usd >= 0 ? "#a7f3d0" : "#fca5a5",
                              }}
                            >
                              {charterSimResult.saving_usd >= 0 ? `Saves ${money(charterSimResult.saving_usd)}` : `Increases by ${money(Math.abs(charterSimResult.saving_usd))}`}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <span>Contract Mix Shift:</span>
                            <small style={{ fontWeight: 700, color: charterSimResult.mix_changed ? "#0284c7" : "#64748b" }}>
                              {charterSimResult.mix_changed ? "Mix Re-allocated" : "Mix Unchanged (Cost Shift Only)"}
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
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
                          <div className="horizon-card-top">
                            <span className="horizon-badge">{horizon.toUpperCase()} HORIZON</span>
                            <span className="horizon-status">P50 Benchmark</span>
                          </div>
                          <div className="horizon-main-val">
                            <strong>{money(band.p50)}</strong>
                            <span className="horizon-unit">/ MT</span>
                          </div>
                          <div className="horizon-quantiles">
                            <span className="q-floor" title="Optimistic Rate Floor (P10)">P10: <strong>{money(band.p10)}</strong></span>
                            <span className="q-sep">·</span>
                            <span className="q-ceiling" title="Pessimistic Rate Ceiling (P90)">P90: <strong>{money(band.p90)}</strong></span>
                          </div>
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
                      {whatIfResult.horizons?.map((item: any) => {
                        const isUp = item.delta_usd_mt >= 0;
                        return (
                          <div className="horizon-card whatif-card" key={item.horizon}>
                            <div className="horizon-card-top">
                              <span className="horizon-badge">{item.horizon.toUpperCase()}</span>
                              <span className={`delta-pill ${isUp ? "delta-up" : "delta-down"}`}>
                                {isUp ? "▲ +" : "▼ -"}${Math.abs(item.delta_usd_mt).toFixed(2)} ({item.delta_pct > 0 ? "+" : ""}{item.delta_pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="horizon-main-val">
                              <strong>${item.scenario_usd_mt.toFixed(2)}</strong>
                              <span className="horizon-unit">/ MT</span>
                            </div>
                            <div className="horizon-quantiles">
                              <span>Baseline: <strong>${item.baseline_usd_mt.toFixed(2)}/MT</strong></span>
                            </div>
                          </div>
                        );
                      })}
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

                    {/* Charter Cost Sensitivity & Counterfactuals (Layer 6) */}
                    <div style={{ marginTop: "2rem", borderTop: "1px solid var(--gov-border)", paddingTop: "1.5rem" }}>
                      <div className="section-title">
                        <span className="eyebrow">Layer 6 Explainability · HiGHS LP Cost Sensitivity</span>
                        <h4>Procurement Cost Sensitivity & Counterfactual Levers</h4>
                        <small style={{ color: "var(--gov-muted)" }}>
                          Evaluates procurement cost changes under realistic market shifts in bunker price, port congestion delay, and spot freight rate.
                        </small>
                      </div>

                      {charterCfLoading && <p style={{ color: "var(--gov-muted)", marginTop: "0.5rem" }}>Running perturbation sensitivity analysis...</p>}
                      {charterCfError && <ErrorPanel message={charterCfError} />}

                      {!charterCfLoading && charterCfResult && (
                        <div style={{ marginTop: "1rem" }}>
                          <div className="cf-banner cf-banner-blue">
                            <div className="cf-banner-badge">MAX SENSITIVITY: {charterCfResult.biggest_lever.replace("_", " ").toUpperCase()}</div>
                            <div className="cf-banner-text">{charterCfResult.summary_insight}</div>
                          </div>

                          <div className="cf-sensitivity-grid" style={{ marginTop: "1.2rem" }}>
                            {/* Bunker Sensitivity */}
                            <div className="sensitivity-column">
                              <div className="sens-header">
                                <strong>Bunker Fuel Sensitivity</strong>
                                <small>VLSFO Price Shocks</small>
                              </div>
                              <div className="sens-cards">
                                {charterCfResult.cost_sensitivity
                                  .filter((s) => s.lever === "bunker_price")
                                  .map((s) => (
                                    <div className="sens-card" key={s.change}>
                                      <span className="sens-change">{s.change}</span>
                                      <div className="sens-cost">{money(s.new_cost_usd)}</div>
                                      <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Congestion Sensitivity */}
                            <div className="sensitivity-column">
                              <div className="sens-header">
                                <strong>Port Congestion Sensitivity</strong>
                                <small>Wait Time Reduction</small>
                              </div>
                              <div className="sens-cards">
                                {charterCfResult.cost_sensitivity
                                  .filter((s) => s.lever === "congestion")
                                  .map((s) => (
                                    <div className="sens-card" key={s.change}>
                                      <span className="sens-change">{s.change}</span>
                                      <div className="sens-cost">{money(s.new_cost_usd)}</div>
                                      <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Spot Rate Sensitivity */}
                            <div className="sensitivity-column">
                              <div className="sens-header">
                                <strong>Spot Freight Rate Sensitivity</strong>
                                <small>Prompt Market Shifts</small>
                              </div>
                              <div className="sens-cards">
                                {charterCfResult.cost_sensitivity
                                  .filter((s) => s.lever === "spot_rate")
                                  .map((s) => (
                                    <div className="sens-card" key={s.change}>
                                      <span className="sens-change">{s.change}</span>
                                      <div className="sens-cost">{money(s.new_cost_usd)}</div>
                                      <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="cf-note-card" style={{ marginTop: "1rem" }}>
                            <strong>Design Rationale & Integrity Note:</strong>
                            <p>{charterCfResult.note}</p>
                          </div>
                        </div>
                      )}
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

                  {/* Counterfactual Risk Explanations (Layer 6) */}
                  <div style={{ marginTop: "2rem", borderTop: "1px solid var(--gov-border)", paddingTop: "1.5rem" }}>
                    <div className="section-title">
                      <span className="eyebrow">Layer 6 Explainability · Systematic Perturbation Search</span>
                      <h4>Counterfactual Risk Levers & Decision Drivers</h4>
                      <small style={{ color: "var(--gov-muted)" }}>
                        Answers: <em>"What is the smallest realistic change that would flip or resolve this route risk?"</em>
                      </small>
                    </div>

                    {riskCfLoading && <p style={{ color: "var(--gov-muted)", marginTop: "0.5rem" }}>Calculating smallest lever perturbations...</p>}
                    {riskCfError && <ErrorPanel message={riskCfError} />}

                    {!riskCfLoading && riskCfResult && (
                      <div style={{ marginTop: "1rem" }}>
                        <div className="cf-banner">
                          <div className="cf-banner-badge">PRIMARY LEVER: {riskCfResult.biggest_lever.toUpperCase()}</div>
                          <div className="cf-banner-text">{riskCfResult.summary_insight}</div>
                        </div>

                        <div className="table-wrap" style={{ marginTop: "1rem" }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Risk Factor Lever</th>
                                <th>Current Score</th>
                                <th>If Resolved (10.0 Floor)</th>
                                <th>Overall Drop</th>
                                <th>Impact Share</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {riskCfResult.counterfactuals.map((cf, idx) => (
                                <tr key={cf.factor}>
                                  <td><strong>#{idx + 1}</strong></td>
                                  <td>
                                    <span className={`factor-badge factor-${cf.factor}`}>
                                      {cf.factor.toUpperCase()}
                                    </span>
                                  </td>
                                  <td><strong>{cf.current_score.toFixed(1)}/100</strong></td>
                                  <td>
                                    <span style={{ color: "#0284c7", fontWeight: 700 }}>
                                      {cf.if_resolved_overall_becomes.toFixed(1)}/100
                                    </span>
                                  </td>
                                  <td>
                                    <span className="delta-drop-pill">
                                      -{cf.overall_drops_by.toFixed(1)} pts
                                    </span>
                                  </td>
                                  <td>
                                    <div className="progress-bar-cf">
                                      <div
                                        className="progress-fill-cf"
                                        style={{
                                          width: `${Math.min(100, Math.max(10, (cf.overall_drops_by / (riskCfResult.counterfactuals[0]?.overall_drops_by || 1)) * 100))}%`,
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="small-action-btn"
                                      onClick={() => {
                                        setActiveTab("counterfactual");
                                        setCfMode("sandbox");
                                        setRiskOverrides((prev) => ({ ...prev, [cf.factor]: 10.0 }));
                                      }}
                                    >
                                      Simulate Resolution →
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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

        {/* TAB: PILLAR 1 - POLICY & ECONOMICS */}
        {activeTab === "scenarios" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Pillar 1 · Policy & Economics Evaluation</span>
                <h3>Energy-Normalized ($USD/GJ) Coastal vs. Import Coal Parity</h3>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Evaluate delivered energy costs for power utilities (NTPC/State GENCOs), optimize blending fractions under ash limits, and stress-test landed cost parity against freight, FX, and port tariff shocks.
              </p>
              <ScenarioComparator />
            </section>
          </div>
        )}

        {/* TAB: PILLAR 4 - PORT OPERATIONS */}
        {activeTab === "ports" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Pillar 4 · Port Physical Operations & Berth Eligibility</span>
                <h3>Berth LOA/Beam/Draft Constraints & Modelled Delay Exposure</h3>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Verify physical vessel feasibility against official berth notices with high-tide conditional access. Distinguishes modelled delay exposure from contractual laytime demurrage liability.
              </p>
              <EligibilityMatrix />
            </section>
          </div>
        )}

        {/* TAB: PILLAR 2 - MARITIME GIS */}
        {activeTab === "map" && (
          <div className="tab-content">
            <section className="market-section">
              <div className="section-title">
                <span className="eyebrow">Pillar 2 · Maritime Geospatial Intelligence</span>
                <h3>Offline Corridors, Strategic Chokepoints & Cyclone Advisories</h3>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                100% offline-capable vector maritime GIS. Features verified Indian major ports, Cape/Malacca/Suez shipping corridors, strategic chokepoints, and weather warning overlays with explicit truth-class labeling.
              </p>
              <MapCanvas />
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

                  <h4 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
                    Pillar 3: SHA-256 Tamper-Evident Decision Timeline & Official Tender Brief Export
                  </h4>
                  <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "1rem" }}>
                    Formal CVC decision state machine (DRAFT → ANALYSED → SUBMITTED_FOR_REVIEW → APPROVED/RETURNED/REJECTED) with self-approval locking, cryptographic hash verification, and reproducible PDF/XLSX generation.
                  </p>
                  <AuditTimeline />
                </>
              )}

              {/* OPTIONAL testnet anchoring of the decision_events chain (needs internet) */}
              <AnchorStatus />
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
  const maxImpact = Math.max(...forecast.shap.map((s) => Math.abs(s.impact)), 1.0);
  return (
    <div className="shap-panel">
      <div className="shap-header">
        <div>
          <h4>Feature Impact Attribution (TreeSHAP)</h4>
          <span className="shap-subtitle">Marginal freight impact ($/MT) attributed by model ensemble</span>
        </div>
        <span className="gov-tag">ISO 8000 XAI</span>
      </div>
      <div className="shap-list">
        {forecast.shap.map((item) => {
          const isUp = item.direction === "up";
          const widthPct = Math.min(Math.max((Math.abs(item.impact) / maxImpact) * 100, 10), 100);
          return (
            <div className="shap-row" key={item.feature}>
              <span className="shap-label" title={item.feature}>{item.feature}</span>
              <div className="shap-bar-container">
                <div
                  className={`shap-bar ${isUp ? "bar-up" : "bar-down"}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className={`shap-pill ${isUp ? "pill-up" : "pill-down"}`}>
                {isUp ? "+$" : "-$"}{Math.abs(item.impact).toFixed(2)}/MT
              </span>
            </div>
          );
        })}
      </div>
      <div className="shap-footer">
        <span>Model: <strong>{forecast.model_version}</strong></span>
        <span>Training Cutoff: <strong>{forecast.training_date}</strong></span>
        <span>Predictive Confidence: <strong>{(forecast.confidence * 100).toFixed(0)}%</strong></span>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
