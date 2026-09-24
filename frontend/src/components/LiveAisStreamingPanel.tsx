import React, { useEffect, useState, useRef } from "react";
import {
  getLiveAisVessels,
  getAisStatus,
  simulateAisSpoof,
  resetAisFleet,
  getAisWebSocketUrl,
  type LiveVesselRecord,
  type AisStatusResponse,
} from "../api";
import {
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Zap,
  Ship,
  Compass,
  Gauge,
  Activity,
  CheckCircle2,
} from "lucide-react";

export const LiveAisStreamingPanel: React.FC = () => {
  const [vessels, setVessels] = useState<LiveVesselRecord[]>([]);
  const [status, setStatus] = useState<AisStatusResponse | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [packetsCount, setPacketsCount] = useState<number>(0);
  const [selectedMmsi, setSelectedMmsi] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initial REST fetch for immediate render
  const fetchSnapshot = async () => {
    try {
      const [vesselData, statusData] = await Promise.all([
        getLiveAisVessels(),
        getAisStatus(),
      ]);
      setVessels(vesselData.vessels);
      setStatus(statusData);
      setPacketsCount(statusData.total_packets_processed);
    } catch (err) {
      console.warn("AIS REST snapshot fetch warning:", err);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  // 2. Establish WebSocket connection for real-time live streaming
  useEffect(() => {
    let ws: WebSocket;
    let fallbackInterval: any;

    try {
      const wsUrl = getAisWebSocketUrl();
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const packet: LiveVesselRecord = JSON.parse(event.data);
          setPacketsCount((prev) => prev + 1);
          setVessels((prevVessels) => {
            const index = prevVessels.findIndex((v) => v.mmsi === packet.mmsi);
            if (index >= 0) {
              const updated = [...prevVessels];
              updated[index] = packet;
              return updated;
            } else {
              return [packet, ...prevVessels];
            }
          });
        } catch {
          // ignore non-json keepalives
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn("WebSocket initialization failed, falling back to polling", err);
    }

    // Polling fallback every 3 seconds to guarantee updates even if WS is blocked
    fallbackInterval = setInterval(() => {
      fetchSnapshot();
    }, 3000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(fallbackInterval);
    };
  }, []);

  const handleSimulateSpoof = async () => {
    setActionLoading(true);
    setLastActionMessage(null);
    try {
      const res = await simulateAisSpoof(353130000);
      setLastActionMessage(
        `🚨 Injected ${res.jump_km} km jump on ${res.vessel_name}! Watch Kalman filter raise SPOOFING alert.`
      );
      await fetchSnapshot();
    } catch (err: any) {
      setLastActionMessage(`Error triggering spoof: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    try {
      await resetAisFleet();
      setLastActionMessage("Fleet positions reset to standard Indian bulk corridors.");
      await fetchSnapshot();
    } catch (err: any) {
      setLastActionMessage(`Reset error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const activeSpoofs = vessels.filter((v) => v.alerts && v.alerts.length > 0);

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--gov-border)",
        borderRadius: "8px",
        padding: "1.25rem",
        marginBottom: "2rem",
      }}
    >
      {/* Header & Connection Telemetry */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid var(--gov-border)",
          paddingBottom: "12px",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={20} style={{ color: "var(--olive)" }} />
            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--ink)" }}>
              Live Satellite AIS Ingestion & Constant-Velocity Kalman Filter
            </h3>
            <span
              className="gov-tag"
              style={{
                background: isConnected ? "rgba(22, 101, 52, 0.12)" : "rgba(153, 27, 27, 0.12)",
                color: isConnected ? "var(--olive)" : "var(--brick)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 600,
              }}
            >
              {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isConnected ? "WEBSOCKET STREAM ACTIVE" : "STREAM POLL FALLBACK"}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--ink-muted)" }}>
            Real-time satellite AIS feed filtered via 4D kinematic state vectors{" "}
            <code>[lat, lon, v_lat, v_lon]</code> to eliminate GPS jitter and detect transponder spoofing.
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={handleSimulateSpoof}
            disabled={actionLoading}
            className="gov-btn"
            style={{
              background: "#991b1b",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "6px 12px",
            }}
            title="Inject an instantaneous 95km jump into PACIFIC TITAN to test kinematic spoofing alerts"
          >
            <ShieldAlert size={14} />
            Test Spoofing Jump
          </button>

          <button
            onClick={handleReset}
            disabled={actionLoading}
            className="gov-btn gov-btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "6px 12px",
            }}
          >
            <RotateCcw size={14} />
            Reset Fleet
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {lastActionMessage && (
        <div
          style={{
            padding: "8px 12px",
            background: lastActionMessage.includes("🚨") ? "rgba(153, 27, 27, 0.08)" : "var(--sand-100)",
            border: `1px solid ${lastActionMessage.includes("🚨") ? "var(--brick)" : "var(--gov-border)"}`,
            borderRadius: "4px",
            marginBottom: "1rem",
            fontSize: "12px",
            color: "var(--ink)",
            fontWeight: 500,
          }}
        >
          {lastActionMessage}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ background: "var(--sand-100)", padding: "10px 14px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "var(--ink-muted)", textTransform: "uppercase" }}>Active Trackers</div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--ink)", marginTop: "2px" }}>
            {vessels.length} Bulk Carriers
          </div>
          <div style={{ fontSize: "11px", color: "var(--olive)", marginTop: "2px" }}>100% Kalman Filtered</div>
        </div>

        <div style={{ background: "var(--sand-100)", padding: "10px 14px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "var(--ink-muted)", textTransform: "uppercase" }}>Ingestion Mode</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--ink)", marginTop: "4px" }}>
            {status?.mode === "LIVE_SATELLITE_STREAM" ? "🛰️ AISStream.io Satellite" : "🌊 Realistic Corridor Sim"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>5 Core Import Lanes</div>
        </div>

        <div style={{ background: "var(--sand-100)", padding: "10px 14px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "var(--ink-muted)", textTransform: "uppercase" }}>Telemetry Packets</div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--ink)", marginTop: "2px" }}>
            {packetsCount.toLocaleString()} Pings
          </div>
          <div style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>Continuous 1-2s Updates</div>
        </div>

        <div
          style={{
            background: activeSpoofs.length > 0 ? "rgba(153, 27, 27, 0.12)" : "var(--sand-100)",
            padding: "10px 14px",
            borderRadius: "6px",
            border: activeSpoofs.length > 0 ? "1px solid var(--brick)" : "none",
          }}
        >
          <div style={{ fontSize: "11px", color: activeSpoofs.length > 0 ? "var(--brick)" : "var(--ink-muted)", textTransform: "uppercase" }}>
            Spoofing / Sanctions Anomaly
          </div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: activeSpoofs.length > 0 ? "var(--brick)" : "var(--olive)", marginTop: "2px" }}>
            {activeSpoofs.length > 0 ? `⚠️ ${activeSpoofs.length} FLAGGED` : "0 Flags (Clean)"}
          </div>
          <div style={{ fontSize: "11px", color: activeSpoofs.length > 0 ? "var(--brick)" : "var(--ink-muted)", marginTop: "2px" }}>
            Kinematic sanity test
          </div>
        </div>
      </div>

      {/* Live Tracked Vessels Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="gov-table" style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--sand-100)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px" }}>Vessel / MMSI</th>
              <th style={{ padding: "8px 10px" }}>Corridor & Destination</th>
              <th style={{ padding: "8px 10px" }}>Class / DWT</th>
              <th style={{ padding: "8px 10px" }}>Speed (SOG) & Course</th>
              <th style={{ padding: "8px 10px" }}>Raw GPS Position</th>
              <th style={{ padding: "8px 10px" }}>Kalman Filtered Position</th>
              <th style={{ padding: "8px 10px" }}>Integrity Status</th>
            </tr>
          </thead>
          <tbody>
            {vessels.map((v) => {
              const hasAlert = v.alerts && v.alerts.length > 0;
              const isSelected = selectedMmsi === v.mmsi;

              return (
                <tr
                  key={v.mmsi}
                  onClick={() => setSelectedMmsi(v.mmsi)}
                  style={{
                    cursor: "pointer",
                    background: hasAlert
                      ? "rgba(153, 27, 27, 0.08)"
                      : isSelected
                      ? "rgba(124, 109, 72, 0.1)"
                      : "transparent",
                    borderBottom: "1px solid var(--gov-border)",
                    transition: "background 0.15s ease",
                  }}
                >
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{v.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--ink-muted)" }}>
                      MMSI: {v.mmsi} · {v.flag}
                    </div>
                  </td>

                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ color: "var(--ink)" }}>{v.corridor}</div>
                    <div style={{ fontSize: "11px", color: "var(--gov-khaki-dark)", fontWeight: 500 }}>
                      Port: {v.destination}
                    </div>
                  </td>

                  <td style={{ padding: "8px 10px" }}>
                    <div>{v.vessel_class}</div>
                    <div style={{ fontSize: "11px", color: "var(--ink-muted)" }}>{v.dwt?.toLocaleString()} MT</div>
                  </td>

                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Gauge size={13} style={{ color: "var(--gov-khaki-dark)" }} />
                      <strong>{v.sog} kn</strong>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Compass size={11} /> {v.cog}°
                    </div>
                  </td>

                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px" }}>
                    {v.raw_lat.toFixed(4)}°N, {v.raw_lon.toFixed(4)}°E
                  </td>

                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px" }}>
                    <span style={{ color: "var(--olive)", fontWeight: 600 }}>
                      {v.filtered_lat.toFixed(4)}°N, {v.filtered_lon.toFixed(4)}°E
                    </span>
                    <div style={{ fontSize: "10px", color: "var(--ink-muted)" }}>
                      Noise variance: &plusmn;{v.kalman_variance_m || 11.2}m
                    </div>
                  </td>

                  <td style={{ padding: "8px 10px" }}>
                    {hasAlert ? (
                      <span
                        className="gov-tag"
                        style={{
                          background: "var(--brick)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "bold",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <AlertTriangle size={12} />
                        {v.alerts.join(", ")}
                      </span>
                    ) : (
                      <span
                        className="gov-tag"
                        style={{
                          background: "rgba(22, 101, 52, 0.12)",
                          color: "var(--olive)",
                          fontSize: "11px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle2 size={12} />
                        NORMAL TRANSIT
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Engineering Footer Callout */}
      <div
        style={{
          marginTop: "12px",
          padding: "8px 12px",
          background: "var(--sand-100)",
          borderRadius: "4px",
          fontSize: "11px",
          color: "var(--ink-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <strong>Kinematic Sanity Guarantee:</strong> If implied speed exceeds 45 knots over &gt;10 km, the Dead Reckoning tracker flags an illegal AIS spoofing jump.
        </div>
        <div style={{ color: "var(--gov-khaki-dark)" }}>
          WebSocket Route: <code>/ws/ais</code> &middot; REST Snapshot: <code>/api/ais/live-vessels</code>
        </div>
      </div>
    </div>
  );
};
