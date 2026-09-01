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

type ForecastInputs = {
  origin: string;
  destination: string;
  vessel_type: string;
  cargo_type: string;
  cargo_quantity: number;
  laycan_start: string;
  laycan_end: string;
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

  const horizons = useMemo(() => Object.entries(forecast?.forecast ?? {}), [forecast]);

  useEffect(() => {
    void refreshSystem();
    void runForecast(defaultInputs);
  }, []);

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

  function updateCongestionField<K extends keyof CongestionInputs>(key: K, value: CongestionInputs[K]) {
    setCongestionInputs((current) => ({ ...current, [key]: value }));
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
          <Metric label="Confidence" value={forecast ? `${Math.round(forecast.confidence * 100)}%` : "..."} />
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
