// Thin typed client over the reference backend. One file, no framework
// lock-in -- swap BASE_URL for an env var once Raghav wires real config.

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
