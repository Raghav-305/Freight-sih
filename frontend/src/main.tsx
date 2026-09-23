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
import { LanguageProvider } from "./i18n/LanguageContext";
import { UtilityBar } from "./components/ui/UtilityBar";
import { GovHeader } from "./components/ui/GovHeader";
import { ComplianceBanner } from "./components/ui/ComplianceBanner";
import { GovBreadcrumbs } from "./components/ui/GovBreadcrumbs";
import { GovSidebar, PageTab } from "./components/ui/GovSidebar";
import { GovFooter } from "./components/ui/GovFooter";
import { KpiCard } from "./components/ui/KpiCard";
import { CommandPalette } from "./components/ui/CommandPalette";
import { GuidedTour } from "./components/ui/GuidedTour";
import { ExecutiveOverviewPage } from "./components/pages/ExecutiveOverviewPage";
import { ForecastPage } from "./components/pages/ForecastPage";
import { PortfolioOptimizerPage } from "./components/pages/PortfolioOptimizerPage";
import { VesselIntelligencePage } from "./components/pages/VesselIntelligencePage";
import { RiskIntelligencePage } from "./components/pages/RiskIntelligencePage";
import { FreightOpportunityPage } from "./components/pages/FreightOpportunityPage";
import { PolicyEconomicsPage } from "./components/pages/PolicyEconomicsPage";
import { PortOperationsPage } from "./components/pages/PortOperationsPage";
import { MaritimeGisPage } from "./components/pages/MaritimeGisPage";
import { DataQualityPage } from "./components/pages/DataQualityPage";
import { CvcGovernancePage } from "./components/pages/CvcGovernancePage";
import { ModelRegistryPage } from "./components/pages/ModelRegistryPage";
import { CounterfactualPage } from "./components/pages/CounterfactualPage";
import { BidAnomalyPage } from "./components/pages/BidAnomalyPage";
import { CharterpartyStudioPage } from "./components/pages/CharterpartyStudioPage";
import { PillarType } from "./components/ui/PageHero";

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
  | "counterfactual"
  | "collusion"
  | "contract";

function App() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(["overview"]));
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab as TabKey);
    setVisitedTabs((prev) => new Set([...prev, tab]));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function getOpportunityLabel(raw?: string) {
    if (!raw) return "Good opportunity";
    if (raw === "GOOD_OPPORTUNITY") return "Good opportunity";
    if (raw === "CONSIDER_FIXING") return "Consider fixing";
    if (raw === "WAIT") return "Wait";
    if (raw === "MONITOR") return "Monitor";
    return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getPillarForTab(tab: string): PillarType {
    switch (tab) {
      case "forecast":
      case "opportunity":
      case "charter":
      case "scenarios":
        return "Economics";
      case "map":
      case "risk":
        return "Maritime GIS";
      case "ports":
      case "vessels":
        return "Port Operations";
      case "governance":
      case "quality":
      case "models":
      case "counterfactual":
      case "collusion":
      case "contract":
        return "Governance";
      case "overview":
      default:
        return "Command Center";
    }
  }

  function getTitleForTab(tab: string): string {
    switch (tab) {
      case "overview": return "Executive Overview";
      case "forecast": return "Forecast & SHAP";
      case "opportunity": return "Freight Opportunity";
      case "charter": return "Portfolio Optimizer";
      case "scenarios": return "Policy & Economics";
      case "map": return "Maritime GIS";
      case "risk": return "Risk Intelligence";
      case "ports": return "Port Operations";
      case "vessels": return "Vessel Intelligence";
      case "governance": return "CVC Governance";
      case "quality": return "Data Quality (ISO 8000)";
      case "models": return "Model Registry";
      case "counterfactual": return "Counterfactuals (Layer 6)";
      case "collusion": return "Bid Anomaly & Collusion";
      case "contract": return "Charterparty Studio";
      default: return tab;
    }
  }

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
    as_of_date: todayStr,
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
    as_of_date: todayStr,
  });
  const [opportunityResult, setOpportunityResult] = useState<OpportunityScore | null>(null);
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [opportunityError, setOpportunityError] = useState<string | null>(null);

  // Vessel Intelligence
  const [vesselInputs, setVesselInputs] = useState({
    destination: "Dhamra",
    vessel_class: "Panamax",
    cargo_quantity: 70000,
    as_of_date: todayStr,
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
    <LanguageProvider>
      <div className="portal-layout">
        {/* Accessible Utility Bar (GIGW) */}
        <UtilityBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

        {/* Sovereign Government Header with Emblem Placeholder & Diagnostics */}
        <GovHeader
          apiMode={apiMode}
          serverHealth={health?.status ?? "healthy"}
          activeModel={models?.active_forecasting_model ?? "xgb_panamax_freight_v7"}
          lastUpdated={market?.updated_at ?? "2026-09-20 18:00 UTC"}
          onRetryConnection={() => {
            void refreshSystem();
            void loadMarketIntelligence();
          }}
        />

        <div className="portal-body-wrapper">
          {/* 5-Pillar Governed Sidebar */}
          <GovSidebar
            activeTab={activeTab as PageTab}
            onSelectTab={handleSelectTab}
            visitedTabs={visitedTabs}
            apiMode={apiMode}
          />

          {/* Main Content Area */}
          <main id="main-content" className="portal-main-content">
            {/* Breadcrumb Trail */}
            <GovBreadcrumbs
              pillar={getPillarForTab(activeTab)}
              pageTitle={getTitleForTab(activeTab)}
              onNavigateHome={() => handleSelectTab("overview")}
            />

            {/* Mandatory CVC / GFR 2017 Compliance Rule Banner on every page */}
            <ComplianceBanner />

            {/* Global Key Metrics Strip (GIGW KpiCard components) */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {/* 1. Current Spot Rate (Handles missing/loading/unavailable properly) */}
              <KpiCard
                label="Current Spot Rate"
                value={
                  forecast?.current_freight
                    ? `${money(forecast.current_freight)}`
                    : market?.route_freight
                    ? `${money(market.route_freight)}`
                    : null
                }
                unit="/MT"
                helperText="USD per tonne for the selected route"
                tooltipText="The latest freight price for a voyage on the selected route and vessel class."
                isLoading={forecastLoading && !market?.route_freight}
                isUnavailable={!forecastLoading && !forecast?.current_freight && !market?.route_freight}
                isMock={apiMode === "mock"}
                onRetry={() => {
                  void runForecast();
                  void loadMarketIntelligence();
                }}
              />

              {/* 2. Market Regime */}
              <KpiCard
                label="Market Regime"
                value={market?.market_regime ?? "BULLISH"}
                helperText="Bullish, neutral or bearish"
                tooltipText="The overall direction of the freight market. Bullish means rates are expected to rise."
                status={
                  market?.market_regime === "BULLISH"
                    ? "good"
                    : market?.market_regime === "NEUTRAL"
                    ? "caution"
                    : "risk"
                }
                isMock={apiMode === "mock"}
              />

              {/* 3. Opportunity Signal */}
              <KpiCard
                label="Opportunity Signal"
                value={getOpportunityLabel(opportunityResult?.recommendation)}
                helperText="Is now a good time to fix?"
                tooltipText="A screening signal that weighs freight, fuel, port pressure and market direction. It is not an instruction to buy."
                status={
                  opportunityResult?.recommendation === "GOOD_OPPORTUNITY"
                    ? "good"
                    : opportunityResult?.recommendation === "WAIT"
                    ? "risk"
                    : "caution"
                }
                isMock={apiMode === "mock"}
              />

              {/* 4. Baltic BDI / BPI */}
              <KpiCard
                label="Baltic BDI / BPI"
                value={
                  market?.indices
                    ? `${market.indices.bdi} / ${market.indices.bpi}`
                    : "1,842 / 1,620"
                }
                helperText="Dry bulk and Panamax indices"
                tooltipText="Standard market benchmarks for dry bulk shipping. Compare them with the route rate to see whether the route is moving with the wider market."
                referenceTag={apiMode === "live" ? undefined : "Reference value"}
                isMock={apiMode === "mock"}
              />
            </section>

            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === "overview" && (
              <ExecutiveOverviewPage
                marketInputs={marketInputs}
                setMarketInputs={setMarketInputs}
                onGenerateMarketIntelligence={() => {
                  void loadMarketIntelligence(marketInputs);
                  void loadMarketContext(marketInputs);
                }}
                marketLoading={marketLoading}
                market={market}
                marketContext={marketContext}
                onNavigateTab={handleSelectTab}
                visitedTabs={visitedTabs}
                onStartTour={() => setTourOpen(true)}
              />
            )}

            {/* TAB 2: FORECAST & SHAP */}
            {activeTab === "forecast" && (
              <ForecastPage
                inputs={forecastInputs}
                setInputs={setForecastInputs}
                onRunForecast={() => void runForecast()}
                loading={forecastLoading}
                error={forecastError}
                forecast={forecast}
                whatIfInputs={whatIfInputs}
                setWhatIfInputs={setWhatIfInputs}
                onRunWhatIf={() => void runWhatIf()}
                whatIfLoading={whatIfLoading}
                whatIfError={whatIfError}
                whatIfResult={whatIfResult}
              />
            )}

            {/* TAB 3: CHARTER PORTFOLIO OPTIMIZER */}
            {activeTab === "charter" && (
              <PortfolioOptimizerPage
                inputs={charterInputs}
                setInputs={setCharterInputs}
                onRunOptimization={() => void runCharterOptimization()}
                loading={charterLoading}
                error={charterError}
                result={charterResult}
              />
            )}

            {/* TAB 4: VESSEL INTELLIGENCE */}
            {activeTab === "vessels" && (
              <VesselIntelligencePage
                inputs={vesselInputs}
                setInputs={setVesselInputs}
                onRecommendVessels={() => void recommendVessels()}
                loading={vesselLoading}
                error={vesselError}
                result={vesselResult}
              />
            )}

            {/* TAB 5: RISK INTELLIGENCE */}
            {activeTab === "risk" && (
              <RiskIntelligencePage
                inputs={riskInputs}
                setInputs={setRiskInputs}
                onAssessRisk={() => void assessRisk(riskInputs)}
                loading={riskLoading}
                error={riskError}
                result={riskResult}
                riskCfLoading={riskCfLoading}
                riskCfError={riskCfError}
                riskCfResult={riskCfResult}
                onNavigateToSandbox={(factor) => {
                  setActiveTab("counterfactual");
                  setCfMode("sandbox");
                  const updated = { ...riskOverrides, [factor]: 10.0 };
                  setRiskOverrides(updated);
                  void runRiskSimulation(updated);
                }}
              />
            )}

            {/* TAB 6: FREIGHT OPPORTUNITY SCORE */}
            {activeTab === "opportunity" && (
              <FreightOpportunityPage
                inputs={opportunityInputs}
                setInputs={setOpportunityInputs}
                onAssessOpportunity={() => void assessOpportunity(opportunityInputs)}
                loading={opportunityLoading}
                error={opportunityError}
                result={opportunityResult}
              />
            )}

            {/* TAB 7: PILLAR 1 - POLICY & ECONOMICS */}
            {activeTab === "scenarios" && <PolicyEconomicsPage />}

            {/* TAB 8: PILLAR 4 - PORT OPERATIONS */}
            {activeTab === "ports" && <PortOperationsPage />}

            {/* TAB 9: PILLAR 2 - MARITIME GIS */}
            {activeTab === "map" && <MaritimeGisPage />}

            {/* TAB 10: DATA QUALITY (ISO 8000) */}
            {activeTab === "quality" && (
              <DataQualityPage
                dataQuality={dataQuality}
                loading={qualityLoading}
                error={qualityError}
                onRefresh={() => void loadDataQuality()}
              />
            )}

            {/* TAB 11: CVC GOVERNANCE & AUDIT */}
            {activeTab === "governance" && (
              <CvcGovernancePage
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onSubmitReview={submitReview}
                reviewMessage={reviewMessage}
                auditData={auditData}
              />
            )}

            {/* TAB 12: MODEL REGISTRY */}
            {activeTab === "models" && (
              <ModelRegistryPage
                models={models}
                onRefresh={() => void refreshSystem()}
              />
            )}

            {/* TAB 13: COUNTERFACTUAL EXPLANATIONS (LAYER 6) */}
            {activeTab === "counterfactual" && (
              <CounterfactualPage
                cfMode={cfMode}
                setCfMode={setCfMode}
                riskInputs={riskInputs}
                setRiskInputs={setRiskInputs}
                fetchRiskCounterfactuals={fetchRiskCounterfactuals}
                riskCfLoading={riskCfLoading}
                riskCfError={riskCfError}
                riskCfResult={riskCfResult}
                riskOverrides={riskOverrides}
                setRiskOverrides={setRiskOverrides}
                runRiskSimulation={runRiskSimulation}
                riskSimResult={riskSimResult}
                riskSimLoading={riskSimLoading}
                charterInputs={charterInputs}
                setCharterInputs={setCharterInputs}
                fetchCharterCounterfactuals={fetchCharterCounterfactuals}
                charterCfLoading={charterCfLoading}
                charterCfError={charterCfError}
                charterCfResult={charterCfResult}
                charterShifts={charterShifts}
                setCharterShifts={setCharterShifts}
                runCharterSimulation={runCharterSimulation}
                charterSimResult={charterSimResult}
                charterSimLoading={charterSimLoading}
              />
            )}

            {/* TAB 14: BID ANOMALY & COLLUSION DETECTION */}
            {activeTab === "collusion" && <BidAnomalyPage />}

            {/* TAB 15: BIMCO CHARTERPARTY STUDIO */}
            {activeTab === "contract" && <CharterpartyStudioPage />}

            {/* Footer Health Strip */}
            <section className="health-strip" style={{ marginTop: "32px" }}>
              <span>FastAPI Health: <strong>{health?.status ?? "online"}</strong></span>
              <span>Active ML Model: <strong>{models?.active_forecasting_model ?? "xgb_panamax_freight_v7"}</strong></span>
              <span>Deployment: <strong>Local, air-gapped decision support</strong></span>
              <button type="button" onClick={() => void refreshSystem()}>Refresh Status</button>
            </section>
          </main>
        </div>

        {/* GIGW Official Sovereign Footer */}
        <GovFooter
          modelVersion={models?.active_forecasting_model ?? "xgb_panamax_freight_v7"}
          datasetVersion="dwt_fixtures_2026_q3"
          lastUpdated={market?.updated_at ?? "2026-09-20"}
        />

        {/* Command Palette & Guided Tour Modals */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectTab={handleSelectTab}
        />
        <GuidedTour
          isOpen={tourOpen}
          onClose={() => setTourOpen(false)}
        />
      </div>
    </LanguageProvider>
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
