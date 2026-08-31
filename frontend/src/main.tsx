import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const apiMode = import.meta.env.VITE_API_MODE ?? "mock";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function App() {
  return (
    <main className="app-shell">
      <section className="status-panel">
        <p className="eyebrow">Local repository scaffold</p>
        <h1>Freight Chartering Intelligence Platform</h1>
        <p>
          This frontend folder is ready for the React + TypeScript + Vite app.
          The existing Hatchable demo remains in the root <code>public/</code>
          folder until UI code is migrated here.
        </p>
        <dl>
          <div>
            <dt>API mode</dt>
            <dd>{apiMode}</dd>
          </div>
          <div>
            <dt>FastAPI base URL</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Model access</dt>
            <dd>Backend only, via ml/inference</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
