// Thin typed client over the reference backend. One file, no framework
// lock-in -- swap BASE_URL for an env var once Raghav wires real config.

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace("localhost", "127.0.0.1").replace(/\/$/, "");

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

// ---- Pillar 1: Economics ----
export const evaluateScenario = (body: unknown) =>
  req("/api/scenarios/evaluate", { method: "POST", body: JSON.stringify(body) });

export const compareScenarios = (scenarios: unknown[]) =>
  req("/api/scenarios/compare", { method: "POST", body: JSON.stringify({ scenarios }) });

export const sensitivityGrid = (body: unknown) =>
  req("/api/scenarios/sensitivity", { method: "POST", body: JSON.stringify(body) });

// ---- Pillar 2: Maritime GIS ----
export const getPorts = () => req("/api/map/ports");
export const getCorridors = () => req("/api/map/corridors");
export const getChokepoints = () => req("/api/map/chokepoints");
export const getHazards = () => req("/api/map/hazards");
export const getMapFreshness = () => req("/api/map/freshness");

// ---- Pillar 4: Port Operations ----
export const checkEligibility = (body: unknown) =>
  req("/api/ports/eligibility", { method: "POST", body: JSON.stringify(body) });

export const delayExposure = (body: unknown) =>
  req("/api/delay/exposure", { method: "POST", body: JSON.stringify(body) });

export const demurrageEstimate = (body: unknown) =>
  req("/api/demurrage/estimate", { method: "POST", body: JSON.stringify(body) });

// ---- Pillar 3: Governance / Decisions ----
export const createDecision = (body: unknown) =>
  req("/api/decisions", { method: "POST", body: JSON.stringify(body) });

export const decisionAction = (id: string, action: "analyse" | "submit" | "approve" | "return" | "reject", body: unknown) =>
  req(`/api/decisions/${id}/${action}`, { method: "POST", body: JSON.stringify(body) });

export const getDecision = (id: string) => req(`/api/decisions/${id}`);
export const getDecisionAudit = (id: string) => req(`/api/decisions/${id}/audit`);
export const reportUrl = (id: string, format: "pdf" | "xlsx") => `${BASE_URL}/api/decisions/${id}/report?format=${format}`;

// ---- Pillar 5: Command Center ----
export const getCommandCenterSummary = () => req("/api/command-center/summary");

// ---- Layer 6: Counterfactual Explanations & Sensitivity ----
export const explainRisk = (body: unknown) =>
  req("/api/counterfactual/risk", { method: "POST", body: JSON.stringify(body) });

export const explainCharter = (body: unknown) =>
  req("/api/counterfactual/charter", { method: "POST", body: JSON.stringify(body) });

export const simulateRiskWhatIf = (body: unknown) =>
  req("/api/counterfactual/risk/simulate", { method: "POST", body: JSON.stringify(body) });

export const simulateCharterWhatIf = (body: unknown) =>
  req("/api/counterfactual/charter/simulate", { method: "POST", body: JSON.stringify(body) });

// ---- Pillar 3 Extension: Bid Anomaly & Collusion Detection ----
export const getCollusionTenders = (limit = 50, status?: string) => {
  const query = status ? `?limit=${limit}&status=${encodeURIComponent(status)}` : `?limit=${limit}`;
  return req(`/api/collusion/tenders${query}`);
};

export const getCollusionTender = (tenderId: string, threshold = 0.5) =>
  req(`/api/collusion/tenders/${encodeURIComponent(tenderId)}?threshold=${threshold}`);

export const scoreBid = (body: unknown) =>
  req("/api/collusion/score-bid", { method: "POST", body: JSON.stringify(body) });

export const scoreTender = (body: unknown) =>
  req("/api/collusion/score-tender", { method: "POST", body: JSON.stringify(body) });

export const explainBidAnomaly = (body: unknown) =>
  req("/api/collusion/explain-bid", { method: "POST", body: JSON.stringify(body) });

export const simulateBidAnomaly = (body: unknown) =>
  req("/api/collusion/simulate", { method: "POST", body: JSON.stringify(body) });

export const getCollusionPerformance = () =>
  req("/api/collusion/performance");

// ---- Pillar 3 Extension: BIMCO Charterparty Contract Studio ----
export const getCharterpartyTemplates = () =>
  req("/api/charterparty/templates");

export const generateCharterparty = (body: unknown) =>
  req("/api/charterparty/generate", { method: "POST", body: JSON.stringify(body) });

export const validateCharterparty = (body: unknown) =>
  req("/api/charterparty/validate", { method: "POST", body: JSON.stringify(body) });

// ---- Real-Time Satellite AIS & Kalman Trajectory Filtering ----
export interface LiveVesselRecord {
  mmsi: number;
  name: string;
  flag: string;
  vessel_class: string;
  dwt: number;
  corridor: string;
  destination: string;
  raw_lat: number;
  raw_lon: number;
  filtered_lat: number;
  filtered_lon: number;
  sog: number;
  cog: number;
  alerts: string[];
  kalman_variance_m?: number;
  timestamp: number;
}

export interface AisStatusResponse {
  mode: string;
  is_running: boolean;
  active_vessels_count: number;
  active_ws_clients: number;
  total_packets_processed: number;
  spoof_events_count: number;
  kalman_state_dim: number;
  kalman_filter_type: string;
  monitored_corridors: string[];
}

export const getLiveAisVessels = (): Promise<{
  count: number;
  vessels: LiveVesselRecord[];
  mode: string;
  spoof_events_count: number;
}> => req("/api/ais/live-vessels");

export const getAisStatus = (): Promise<AisStatusResponse> => req("/api/ais/status");

export const simulateAisSpoof = (mmsi = 353130000): Promise<{
  status: string;
  mmsi: number;
  vessel_name: string;
  jump_km: number;
  note: string;
}> => req("/api/ais/simulate-spoof", { method: "POST", body: JSON.stringify({ mmsi }) });

export const resetAisFleet = (): Promise<{ status: string; active_vessels: number }> =>
  req("/api/ais/reset", { method: "POST" });

export const getAisWebSocketUrl = (): string =>
  BASE_URL.replace(/^http/, "ws") + "/ws/ais";



