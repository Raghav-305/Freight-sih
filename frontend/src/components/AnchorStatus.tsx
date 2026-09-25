import React, { useCallback, useEffect, useState } from "react";
import { BASE_URL } from "../api";

// OPTIONAL feature: external anchoring of the decision_events hash chain on the
// Polygon Amoy testnet. Needs internet. Nothing else in the app depends on it.
// Covers ONLY decision_events (the SHA-256 timeline below) -- NOT the legacy
// "Immutable Audit Trail" table (AuditLogRecord), which is not hash-chained.

type Anchor = {
  anchor_id: number;
  merkle_root: string;
  event_count: number;
  tx_hash: string | null;
  block_number: number | null;
  status: string;
  error: string | null;
  created_at: string;
  explorer_url: string | null;
};

type AnchorStatusResponse = {
  network: string;
  state: "ANCHORED" | "NOT_ANCHORED";
  configured: boolean;
  web3_installed: boolean;
  unanchored_events: number;
  latest_anchor: Anchor | null;
  last_attempt: Anchor | null;
  scope_note: string;
};

type AnchorNowResponse = { status: string; message: string; unanchored_events: number | null };

// fetch with a hard timeout so the UI can never hang silently
async function fetchJson<T>(path: string, init: RequestInit | undefined, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const box: React.CSSProperties = { background: "#0b1220", border: "1px solid #1f2937", borderRadius: "8px", padding: "14px" };

export function AnchorStatus() {
  const [status, setStatus] = useState<AnchorStatusResponse | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await fetchJson<AnchorStatusResponse>("/api/audit/anchor-status", undefined, 8000));
      setUnreachable(false);
    } catch {
      setUnreachable(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const anchorNow = async () => {
    setBusy(true);
    setNote(null);
    try {
      const r = await fetchJson<AnchorNowResponse>("/api/audit/anchor", { method: "POST" }, 60000);
      setNote({ text: r.message, ok: r.status === "ANCHORED" || r.status === "PENDING" || r.status === "NOTHING_TO_ANCHOR" });
    } catch (e: any) {
      const aborted = e?.name === "AbortError";
      setNote({ text: aborted ? "Not anchored - request timed out (offline?)." : "Not anchored - backend or internet unreachable.", ok: false });
    } finally {
      setBusy(false);
      void load();
    }
  };

  const latest = status?.latest_anchor;
  const failed = status?.last_attempt;

  return (
    <div style={{ ...box, marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <strong style={{ color: "#f1f5f9", fontSize: "13px" }}>External Blockchain Anchor ({status?.network ?? "Polygon Amoy Testnet"})</strong>
        <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "9999px", background: "#3b2f05", color: "#fbbf24" }}>
          OPTIONAL · requires internet
        </span>
      </div>

      <div style={{ marginTop: "10px", fontSize: "13px", color: "#e2e8f0" }}>
        {unreachable ? (
          <span style={{ color: "#fca5a5" }}>Anchor status unavailable - backend unreachable. Core system is unaffected.</span>
        ) : !status ? (
          <span style={{ color: "#94a3b8" }}>Loading anchor status...</span>
        ) : latest ? (
          <>
            Last anchored externally: <strong>{new Date(latest.created_at).toLocaleString()}</strong>
            {latest.status === "PENDING" ? " (pending confirmation)" : ""} —{" "}
            {latest.status === "ANCHORED" && <strong style={{ color: "var(--gov-good)", marginLeft: "4px" }}>ANCHORED ON POLYGON AMOY</strong>}
            {latest.explorer_url ? (
              <a href={latest.explorer_url} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", marginLeft: "8px" }}>
                View On-Chain ↗
              </a>
            ) : (
              "no link"
            )}
            <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", marginTop: "4px", wordBreak: "break-all" }}>
              root: {latest.merkle_root} · {latest.event_count} events
              {latest.tx_hash && <div>transaction hash: {latest.tx_hash}</div>}
            </div>
          </>
        ) : (
          <span style={{ color: "#fbbf24" }}>Not anchored externally yet.</span>
        )}
      </div>

      {status && failed && (
        <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "6px", background: "#7f1d1d", color: "#fca5a5", fontSize: "12px", border: "1px solid #b91c1c" }}>
          {failed.status === "OFFLINE" ? "Not anchored - offline / RPC unreachable." : `Last anchor attempt failed: ${failed.error ?? "unknown error"}`}{" "}
          {failed.event_count} events are waiting; the rest of the system is unaffected.
        </div>
      )}

      {status && !status.configured && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>
          Anchoring is disabled: set AMOY_PRIVATE_KEY in .env to enable it (see README).
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        {status && status.unanchored_events > 0 && (
          <span style={{ fontSize: "12px", color: "#fcd34d", fontWeight: 700 }}>
            {status.unanchored_events} Unanchored Decision Event{status.unanchored_events !== 1 ? "s" : ""}
          </span>
        )}
        <button
          type="button"
          onClick={anchorNow}
          disabled={busy || unreachable}
          style={{ background: "#7c3aed", color: "#fff", fontSize: "12px", padding: "8px 14px", borderRadius: "4px" }}
        >
          {busy ? "Anchoring (up to ~40s)..." : "Anchor Now"}
        </button>
        {note && <span style={{ fontSize: "12px", color: note.ok ? "#34d399" : "#fca5a5" }}>{note.text}</span>}
      </div>

      <p style={{ marginTop: "10px", marginBottom: 0, fontSize: "11px", color: "#64748b" }}>
        {status?.scope_note ??
          "Covers only the hash-chained decision_events - not the legacy AuditLogRecord 'Immutable Audit Trail' table."}
      </p>
    </div>
  );
}
