import React, { FormEvent, useEffect, useMemo, useState } from "react";
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

type ForecastInputs = {
  origin: string;
  destination: string;
  vessel_type: string;
  cargo_type: string;
  cargo_quantity: number;
  laycan_start: string;
  laycan_end: string;
};

type MarketInputs = {
  origin: string;
  destination: string;
  vessel_class: string;
  as_of_date: string;
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

type CongestionInputs = {
  port: string;
  vessel_type: string;
  cargo_quantity: number;
  arrival_date: string;
  vessel_dwt: number;
};

const apiMode = import.meta.env.VITE_API_MODE ?? "live";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const defaultInputs: ForecastInputs = {
  origin: "Australia",
  destination: "Dhamra",
  vessel_type: "Panamax",
  cargo_type: "Coal",
  cargo_quantity: 80000,
  laycan_start: "2026-10-10",
  laycan_end: "2026-10-20",
};

const defaultCongestionInputs: CongestionInputs = {
  port: "Paradip",
  vessel_type: "Panamax",
  cargo_quantity: 80000,
  arrival_date: "2026-07-15",
  vessel_dwt: 78000,
};

const defaultMarketInputs: MarketInputs = {
  origin: "Australia",
  destination: "Dhamra",
  vessel_class: "Panamax",
  as_of_date: "",
};

const defaultVesselInputs = {
  destination: "Dhamra",
  vessel_class: "Panamax",
  cargo_quantity: 70000,
  as_of_date: "",
  limit: 10,
};

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

function App() {
  const [inputs, setInputs] = useState<ForecastInputs>(defaultInputs);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [models, setModels] = useState<ModelRegistry | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [congestionInputs, setCongestionInputs] = useState<CongestionInputs>(defaultCongestionInputs);
  const [congestionResult, setCongestionResult] = useState<PortCongestionResponse | null>(null);
  const [congestionLoading, setCongestionLoading] = useState(false);
  const [congestionError, setCongestionError] = useState<string | null>(null);
  const [marketInputs, setMarketInputs] = useState<MarketInputs>(defaultMarketInputs);
  const [market, setMarket] = useState<MarketIntelligence | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [marketContextLoading, setMarketContextLoading] = useState(false);
  const [marketContextError, setMarketContextError] = useState<string | null>(null);
  const [vesselInputs, setVesselInputs] = useState(defaultVesselInputs);
  const [vesselResult, setVesselResult] = useState<VesselRecommendation | null>(null);
  const [vesselLoading, setVesselLoading] = useState(false);
  const [vesselError, setVesselError] = useState<string | null>(null);
  const [explainInputs, setExplainInputs] = useState({
    origin: "Australia",
    destination: "Dhamra",
    vessel_type: "Panamax",
    cargo_type: "Coal",
    cargo_quantity: 80000,
    horizon: 30,
  });
  const [explanation, setExplanation] = useState<any | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
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

  const horizons = useMemo(() => Object.entries(forecast?.forecast ?? {}), [forecast]);

  useEffect(() => {
    void refreshSystem();
    void runForecast(defaultInputs);
    void loadMarketIntelligence(defaultMarketInputs);
    void loadMarketContext(defaultMarketInputs);
    void recommendVessels(defaultVesselInputs);
  }, []);

  async function loadMarketIntelligence(nextInputs = marketInputs) {
    setMarketLoading(true);
    setMarketError(null);

    try {
      const params = new URLSearchParams({
        origin: nextInputs.origin,
        destination: nextInputs.destination,
        vessel_class: nextInputs.vessel_class,
      });
      if (nextInputs.as_of_date) {
        params.set("as_of_date", nextInputs.as_of_date);
      }
      const result = await api<MarketIntelligence>(`/market?${params.toString()}`);
      setMarket(result);
    } catch (err) {
      setMarketError(err instanceof Error ? err.message : "Unable to call market intelligence API");
    } finally {
      setMarketLoading(false);
    }
  }

  async function loadMarketContext(nextInputs = marketInputs) {
    setMarketContextLoading(true);
    setMarketContextError(null);
    try {
      const params = new URLSearchParams({
        origin: nextInputs.origin,
        destination: nextInputs.destination,
        vessel_class: nextInputs.vessel_class,
      });
      if (nextInputs.as_of_date) params.set("as_of_date", nextInputs.as_of_date);
      setMarketContext(await api<MarketContext>(`/market/context?${params.toString()}`));
    } catch (err) {
      setMarketContextError(err instanceof Error ? err.message : "Unable to load market context data");
    } finally {
      setMarketContextLoading(false);
    }
  }

  async function recommendVessels(nextInputs = vesselInputs) {
    setVesselLoading(true);
    setVesselError(null);

    try {
      const result = await api<VesselRecommendation>("/vessels/recommend", {
        method: "POST",
        body: JSON.stringify({
          ...nextInputs,
          cargo_quantity: Number(nextInputs.cargo_quantity),
          limit: Number(nextInputs.limit),
          as_of_date: nextInputs.as_of_date || null,
        }),
      });
      setVesselResult(result);
    } catch (err) {
      setVesselError(err instanceof Error ? err.message : "Unable to load vessel recommendations");
    } finally {
      setVesselLoading(false);
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

  async function runForecast(nextInputs = inputs) {
    setLoading(true);
    setError(null);

    try {
      const result = await api<ForecastResponse>("/forecast", {
        method: "POST",
        body: JSON.stringify({
          ...nextInputs,
          cargo_quantity: Number(nextInputs.cargo_quantity),
        }),
      });
      setForecast(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to call forecast API");
    } finally {
      setLoading(false);
    }
  }

  async function checkCongestion(nextInputs = congestionInputs) {
    setCongestionLoading(true);
    setCongestionError(null);

    try {
      const result = await api<PortCongestionResponse>("/port/check", {
        method: "POST",
        body: JSON.stringify({
          ...nextInputs,
          cargo_quantity: Number(nextInputs.cargo_quantity),
          vessel_dwt: Number(nextInputs.vessel_dwt),
        }),
      });
      setCongestionResult(result);
    } catch (err) {
      setCongestionError(err instanceof Error ? err.message : "Unable to call congestion API");
    } finally {
      setCongestionLoading(false);
    }
  }

  function updateField<K extends keyof ForecastInputs>(key: K, value: ForecastInputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function updateMarketField<K extends keyof MarketInputs>(key: K, value: MarketInputs[K]) {
    setMarketInputs((current) => ({ ...current, [key]: value }));
  }

  function updateCongestionField<K extends keyof CongestionInputs>(key: K, value: CongestionInputs[K]) {
    setCongestionInputs((current) => ({ ...current, [key]: value }));
  }

  async function runExplain() {
    setExplainLoading(true);
    setExplainError(null);

    try {
      const result = await api<any>("/forecast/explain", {
        method: "POST",
        body: JSON.stringify({
          ...explainInputs,
          cargo_quantity: Number(explainInputs.cargo_quantity),
        }),
      });
      setExplanation(result);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : "Unable to load forecast explanation");
    } finally {
      setExplainLoading(false);
    }
  }

  async function runWhatIf() {
    setWhatIfLoading(true);
    setWhatIfError(null);

    try {
      const result = await api<any>("/forecast/what-if", {
        method: "POST",
        body: JSON.stringify({
          ...whatIfInputs,
          cargo_quantity: Number(whatIfInputs.cargo_quantity),
        }),
      });
      setWhatIfResult(result);
    } catch (err) {
      setWhatIfError(err instanceof Error ? err.message : "Unable to run what-if forecast");
    } finally {
      setWhatIfLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runForecast();
  }

  function submitCongestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void checkCongestion();
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="eyebrow">Decision Support</span>
          <h1>Freight Chartering Intelligence</h1>
          <p>Live FastAPI forecast workspace</p>
        </div>
        <nav>
          <a href="#market">Market Intelligence</a>
          <a href="#vessels">Vessel Intelligence</a>
          <a className="active" href="#forecast">Forecast</a>
          <a href="#models">Models</a>
          <a href="#health">Health</a>
        </nav>
        <div className="review-box">
          AI-assisted recommendations stay subject to authorized human review.
        </div>
      </aside>

      <section className="main-pane">
        <header className="topbar">
          <div>
            <span className="eyebrow">Local live mode</span>
            <h2>Route Freight Forecast</h2>
          </div>
          <div className="api-pill">
            <span>{apiMode}</span>
            <strong>{apiBaseUrl}</strong>
          </div>
        </header>

        <section className="metrics-grid">
          <Metric label="API Health" value={health?.status ?? "checking"} />
          <Metric label="Active Model" value={models?.active_forecasting_model ?? "loading"} />
          <Metric label="Current Freight" value={forecast ? `${money(forecast.current_freight)}/MT` : "..."} />
          <Metric label="Market Score" value={market ? String(market.market_score) : marketLoading ? "..." : "n/a"} />
        </section>

        <section id="market" className="market-section">
          <div className="section-title">
            <span className="eyebrow">Market Intelligence</span>
            <h3>30-day regime and chartering signal</h3>
          </div>

          <form className="forecast-form" onSubmit={(event) => {
            event.preventDefault();
            void loadMarketIntelligence(marketInputs);
            void loadMarketContext(marketInputs);
          }}>
            <div className="form-grid">
              <Select label="Origin" value={marketInputs.origin} values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]} onChange={(value) => updateMarketField("origin", value)} />
              <Select label="Destination" value={marketInputs.destination} values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]} onChange={(value) => updateMarketField("destination", value)} />
              <Select label="Vessel Class" value={marketInputs.vessel_class} values={["Panamax", "Supramax", "Capesize", "Handysize"]} onChange={(value) => updateMarketField("vessel_class", value)} />
              <Field label="As of Date" type="date" value={marketInputs.as_of_date} onChange={(value) => updateMarketField("as_of_date", value)} />
            </div>
            <button type="submit" disabled={marketLoading}>
              {marketLoading ? "Running market intelligence..." : "Generate Market Intelligence"}
            </button>
          </form>

          {marketError ? <ErrorPanel message={marketError} /> : null}
          {!marketError && market ? (
            <div className="market-grid">
              <div className="market-card">
                <span>Regime</span>
                <strong>{market.market_regime}</strong>
                <small>{market.market_regime_interpretation}</small>
              </div>
              <div className="market-card">
                <span>Chartering Signal</span>
                <strong>{market.chartering_signal}</strong>
                <small>{market.freight_direction} · {market.market_volatility} volatility</small>
              </div>
              <div className="market-card">
                <span>Probabilities</span>
                <strong>B {Math.round(market.probabilities.bullish * 100)}%</strong>
                <small>N {Math.round(market.probabilities.neutral * 100)}% · Be {Math.round(market.probabilities.bearish * 100)}%</small>
              </div>
              <div className="market-card">
                <span>Indices</span>
                <strong>BDI {market.indices.bdi}</strong>
                <small>BPI {market.indices.bpi} · BSI {market.indices.bsi}</small>
              </div>
            </div>
          ) : null}
          {!marketError && !market && marketLoading ? <p>Loading market intelligence…</p> : null}
          {marketContextError ? <ErrorPanel message={marketContextError} /> : null}
          {!marketContextError && marketContext ? (
            <div className="market-grid">
              <div className="market-card">
                <span>FFA Curve</span>
                <strong>{marketContext.ffa.map((point) => `${point.period} ${point.price}`).join(" · ") || "n/a"}</strong>
                <small>Latest forward freight prices</small>
              </div>
              <div className="market-card">
                <span>Coal Imports</span>
                <strong>{marketContext.import_summary ? `${(marketContext.import_summary.quantity_mt / 1000000).toFixed(2)}M MT` : "n/a"}</strong>
                <small>{marketContext.import_summary ? `${marketContext.import_summary.month} · ${money(marketContext.import_summary.value_usd)}` : "No import record"}</small>
              </div>
              <div className="market-card">
                <span>Market Events</span>
                <strong>{marketContext.active_events.length}</strong>
                <small>{marketContext.active_events.map((event) => `${event.event_type} · ${event.severity}`).join("; ") || "No active events"}</small>
              </div>
              <div className="market-card">
                <span>Fixture History</span>
                <strong>{marketContext.fixtures.fixture_count} fixtures</strong>
                <small>{marketContext.fixtures.average_rate != null ? `Avg $${marketContext.fixtures.average_rate.toFixed(2)}/MT` : "No fixture history"}</small>
              </div>
            </div>
          ) : null}
          {!marketContextError && !marketContext && marketContextLoading ? <p>Loading market context…</p> : null}
        </section>

        <section id="vessels" className="market-section">
          <div className="section-title">
            <span className="eyebrow">Vessel Intelligence</span>
            <h3>Feasible vessels ranked by operational suitability</h3>
          </div>

          <form className="forecast-form" onSubmit={(event) => {
            event.preventDefault();
            void recommendVessels(vesselInputs);
          }}>
            <div className="form-grid">
              <Select label="Destination" value={vesselInputs.destination} values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]} onChange={(value) => setVesselInputs((current) => ({ ...current, destination: value }))} />
              <Select label="Vessel Class" value={vesselInputs.vessel_class} values={["Panamax", "Capesize"]} onChange={(value) => setVesselInputs((current) => ({ ...current, vessel_class: value }))} />
              <Field label="Cargo Quantity" type="number" value={vesselInputs.cargo_quantity} onChange={(value) => setVesselInputs((current) => ({ ...current, cargo_quantity: Number(value) }))} />
              <Field label="As of Date" type="date" value={vesselInputs.as_of_date} onChange={(value) => setVesselInputs((current) => ({ ...current, as_of_date: value }))} />
              <Field label="Results" type="number" value={vesselInputs.limit} onChange={(value) => setVesselInputs((current) => ({ ...current, limit: Number(value) }))} />
            </div>
            <button type="submit" disabled={vesselLoading}>
              {vesselLoading ? "Ranking vessels..." : "Find Suitable Vessels"}
            </button>
          </form>

          {vesselError ? <ErrorPanel message={vesselError} /> : null}
          {!vesselError && vesselResult ? (
            <>
              <div className="metrics-grid">
                <Metric label="Candidates" value={String(vesselResult.candidate_count)} />
                <Metric label="Feasible" value={String(vesselResult.feasible_count)} />
                <Metric label="Model" value={vesselResult.model_version} />
                <Metric label="Target" value={vesselResult.target} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vessel</th>
                      <th>DWT</th>
                      <th>Wait</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vesselResult.candidates.map((candidate) => (
                      <tr key={candidate.imo}>
                        <td>{candidate.vessel_name}<small>{candidate.imo}</small></td>
                        <td>{candidate.dwt_mt.toLocaleString()}</td>
                        <td>{candidate.predicted_waiting_hours.toFixed(1)} h</td>
                        <td>{candidate.suitability_score.toFixed(1)}</td>
                        <td><Status value={candidate.eligibility} /></td>
                        <td>{candidate.recommendation_tier}{candidate.failed_constraints.length ? ` · ${candidate.failed_constraints.join(", ")}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{vesselResult.note}</p>
            </>
          ) : null}
        </section>

        <section className="content-grid analysis-grid">
          <form className="forecast-form" onSubmit={(event) => {
            event.preventDefault();
            void runExplain();
          }}>
            <div className="section-title">
              <span className="eyebrow">Prediction Explainability</span>
              <h3>Model driver analysis</h3>
            </div>

            <div className="form-grid">
              <Select label="Origin" value={explainInputs.origin} values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]} onChange={(value) => setExplainInputs((current) => ({ ...current, origin: value }))} />
              <Select label="Destination" value={explainInputs.destination} values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]} onChange={(value) => setExplainInputs((current) => ({ ...current, destination: value }))} />
              <Select label="Vessel Type" value={explainInputs.vessel_type} values={["Panamax", "Supramax", "Capesize", "Handysize"]} onChange={(value) => setExplainInputs((current) => ({ ...current, vessel_type: value }))} />
              <Select label="Cargo Type" value={explainInputs.cargo_type} values={["Coal"]} onChange={(value) => setExplainInputs((current) => ({ ...current, cargo_type: value }))} />
              <Field label="Cargo Quantity" type="number" value={explainInputs.cargo_quantity} onChange={(value) => setExplainInputs((current) => ({ ...current, cargo_quantity: Number(value) }))} />
              <Field label="Horizon Days" type="number" value={explainInputs.horizon} onChange={(value) => setExplainInputs((current) => ({ ...current, horizon: Number(value) }))} />
            </div>
            <button type="submit" disabled={explainLoading}> {explainLoading ? "Loading drivers..." : "Explain Forecast"} </button>
          </form>

          <section className="forecast-output">
            {explainError ? <ErrorPanel message={explainError} /> : null}
            {!explainError && explanation ? (
              <>
                <div className="section-title">
                  <span className="eyebrow">Forecast Explanation</span>
                  <h3>{explanation.horizon}</h3>
                </div>
                <div className="result-grid">
                  <div className="result-card">
                    <span>Prediction</span>
                    <strong>${explanation.prediction.toFixed(2)}/MT</strong>
                  </div>
                  <div className="result-card">
                    <span>Base Value</span>
                    <strong>${explanation.base_value.toFixed(2)}/MT</strong>
                  </div>
                </div>
                <div className="constraint-grid">
                  {explanation.positive_drivers.map((driver: any) => (
                    <div key={driver.feature} className="constraint ok">
                      <span>{driver.label}</span>
                      <strong>+${driver.contribution.toFixed(2)}</strong>
                    </div>
                  ))}
                  {explanation.negative_drivers.map((driver: any) => (
                    <div key={driver.feature} className="constraint warn">
                      <span>{driver.label}</span>
                      <strong>-${Math.abs(driver.contribution).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                <pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>{explanation.narrative}</pre>
              </>
            ) : null}
          </section>
        </section>

        <section className="content-grid analysis-grid">
          <form className="forecast-form" onSubmit={(event) => {
            event.preventDefault();
            void runWhatIf();
          }}>
            <div className="section-title">
              <span className="eyebrow">What-if Forecast</span>
              <h3>Scenario impacts</h3>
            </div>

            <div className="form-grid">
              <Select label="Origin" value={whatIfInputs.origin} values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]} onChange={(value) => setWhatIfInputs((current) => ({ ...current, origin: value }))} />
              <Select label="Destination" value={whatIfInputs.destination} values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]} onChange={(value) => setWhatIfInputs((current) => ({ ...current, destination: value }))} />
              <Select label="Vessel Type" value={whatIfInputs.vessel_type} values={["Panamax", "Supramax", "Capesize", "Handysize"]} onChange={(value) => setWhatIfInputs((current) => ({ ...current, vessel_type: value }))} />
              <Select label="Cargo Type" value={whatIfInputs.cargo_type} values={["Coal"]} onChange={(value) => setWhatIfInputs((current) => ({ ...current, cargo_type: value }))} />
              <Field label="Cargo Quantity" type="number" value={whatIfInputs.cargo_quantity} onChange={(value) => setWhatIfInputs((current) => ({ ...current, cargo_quantity: Number(value) }))} />
              <Field label="Freight change %" type="number" value={whatIfInputs.freight_change_pct} onChange={(value) => setWhatIfInputs((current) => ({ ...current, freight_change_pct: Number(value) }))} />
              <Field label="Bunker change %" type="number" value={whatIfInputs.bunker_change_pct} onChange={(value) => setWhatIfInputs((current) => ({ ...current, bunker_change_pct: Number(value) }))} />
            </div>
            <button type="submit" disabled={whatIfLoading}> {whatIfLoading ? "Running scenario..." : "Run What-if"} </button>
          </form>

          <section className="forecast-output">
            {whatIfError ? <ErrorPanel message={whatIfError} /> : null}
            {!whatIfError && whatIfResult ? (
              <>
                <div className="section-title">
                  <span className="eyebrow">Scenario Output</span>
                  <h3>{whatIfResult.route_id ?? "Route scenario"}</h3>
                </div>
                <div className="horizon-grid">
                  {whatIfResult.horizons.map((item: any) => (
                    <div className="horizon-card" key={item.horizon}>
                      <span>{item.horizon}</span>
                      <strong>${item.scenario_usd_mt.toFixed(2)}</strong>
                      <small>Δ ${item.delta_usd_mt.toFixed(2)} · {item.delta_pct.toFixed(2)}%</small>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </section>

        <section id="forecast" className="content-grid">
          <form className="forecast-form" onSubmit={submit}>
            <div className="section-title">
              <span className="eyebrow">Forecast Inputs</span>
              <h3>Cargo, route and laycan</h3>
            </div>

            <div className="form-grid">
              <Select label="Origin" value={inputs.origin} values={["Australia", "Indonesia", "Mozambique", "Russia", "USA"]} onChange={(value) => updateField("origin", value)} />
              <Select label="Destination" value={inputs.destination} values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]} onChange={(value) => updateField("destination", value)} />
              <Select label="Vessel Class" value={inputs.vessel_type} values={["Panamax"]} onChange={(value) => updateField("vessel_type", value)} />
              <Select label="Cargo Type" value={inputs.cargo_type} values={["Coal"]} onChange={(value) => updateField("cargo_type", value)} />
              <Field label="Cargo Quantity" type="number" value={inputs.cargo_quantity} onChange={(value) => updateField("cargo_quantity", Number(value))} />
              <Field label="Laycan Start" type="date" value={inputs.laycan_start} onChange={(value) => updateField("laycan_start", value)} />
              <Field label="Laycan End" type="date" value={inputs.laycan_end} onChange={(value) => updateField("laycan_end", value)} />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Running forecast..." : "Generate Forecast"}
            </button>
          </form>

          <section className="forecast-output">
            {error ? <ErrorPanel message={error} /> : null}
            {!error && forecast ? (
              <>
                <div className="section-title">
                  <span className="eyebrow">Model Output</span>
                  <h3>{forecast.model_version}</h3>
                </div>
                <div className="horizon-grid">
                  {horizons.map(([horizon, band]) => (
                    <div className="horizon-card" key={horizon}>
                      <span>{horizon.toUpperCase()}</span>
                      <strong>{money(band.p50)}</strong>
                      <small>P10 {money(band.p10)} · P90 {money(band.p90)}</small>
                    </div>
                  ))}
                </div>
                <ShapList forecast={forecast} />
              </>
            ) : null}
          </section>
        </section>

        <section className="congestion-section">
          <div className="section-title">
            <span className="eyebrow">Port Operations</span>
            <h3>Port Congestion Check</h3>
          </div>

          <form className="congestion-form" onSubmit={submitCongestion}>
            <div className="form-grid">
              <Select label="Port" value={congestionInputs.port} values={["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"]} onChange={(value) => updateCongestionField("port", value)} />
              <Select label="Vessel Class" value={congestionInputs.vessel_type} values={["Panamax", "Supramax", "Capesize", "Handysize"]} onChange={(value) => updateCongestionField("vessel_type", value)} />
              <Field label="Cargo Quantity" type="number" value={congestionInputs.cargo_quantity} onChange={(value) => updateCongestionField("cargo_quantity", Number(value))} />
              <Field label="Arrival Date" type="date" value={congestionInputs.arrival_date} onChange={(value) => updateCongestionField("arrival_date", value)} />
              <Field label="Vessel DWT" type="number" value={congestionInputs.vessel_dwt} onChange={(value) => updateCongestionField("vessel_dwt", Number(value))} />
            </div>
            <button type="submit" disabled={congestionLoading}>
              {congestionLoading ? "Checking congestion..." : "Check Port Congestion"}
            </button>
          </form>

          {congestionError ? <ErrorPanel message={congestionError} /> : null}
          {!congestionError && congestionResult ? (
            <div className="congestion-result">
              <div className="result-header">
                <span className="eyebrow">Model Output</span>
                <h4>{congestionResult.port} · {congestionResult.model_version}</h4>
              </div>

              <div className="result-grid">
                <div className="result-card">
                  <span>Status</span>
                  <strong className={congestionResult.feasible ? "ok" : "warn"}>{congestionResult.feasible ? "Feasible" : "High risk"}</strong>
                </div>
                <div className="result-card">
                  <span>Queue</span>
                  <strong>{congestionResult.current_queue}</strong>
                </div>
                <div className="result-card">
                  <span>Wait</span>
                  <strong>{congestionResult.congestion_days.toFixed(2)} days</strong>
                </div>
              </div>

              <div className="constraint-grid">
                {Object.entries(congestionResult.constraints).map(([key, value]) => (
                  <div key={key} className={`constraint ${value ? "ok" : "warn"}`}>
                    <span>{key}</span>
                    <strong>{value ? "Pass" : "Alert"}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section id="models" className="table-section">
          <div className="section-title">
            <span className="eyebrow">Model Registry</span>
            <h3>Backend-only model access</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Family</th>
                  <th>Algorithm</th>
                  <th>Artifact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(models?.models ?? []).map((model) => (
                  <tr key={model.model_version}>
                    <td>{model.model_version}</td>
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

        <section id="health" className="health-strip">
          <span>FastAPI health: <strong>{health?.status ?? "unknown"}</strong></span>
          <span>Last checked: <strong>{health?.timestamp ? new Date(health.timestamp).toLocaleString() : "pending"}</strong></span>
          <button type="button" onClick={() => void refreshSystem()}>Refresh</button>
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

function Field({ label, type, value, onChange }: { label: string; type: string; value: string | number; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => <option key={item}>{item}</option>)}
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
      <strong>Could not reach the live forecast API</strong>
      <p>{message}</p>
    </div>
  );
}

function ShapList({ forecast }: { forecast: ForecastResponse }) {
  return (
    <div className="shap-panel">
      <h4>Explainability</h4>
      {forecast.shap.map((item) => (
        <div className="shap-row" key={item.feature}>
          <span>{item.feature}</span>
          <div>
            <i style={{ width: `${Math.min(Math.abs(item.impact) * 100, 100)}%` }} />
          </div>
          <strong>{item.direction} {item.impact}</strong>
        </div>
      ))}
      <footer>
        Dataset {forecast.dataset_version} · Features {forecast.feature_version} · Trained {forecast.training_date}
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
