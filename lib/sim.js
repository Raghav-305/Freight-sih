// lib/sim.js
//
// This file is the ONE place that stands in for the real ML/optimization
// services described in public/docs/ML_TEAM_README.md. Every function here
// is a deterministic, explainable formula — not a trained model — but it
// genuinely reacts to the inputs it's given, so changing an input in the
// UI produces a different (and reproducible) output. That's what makes the
// whole platform testable end-to-end today, without live data.
//
// WHEN THE REAL MODELS ARE READY: replace the body of each function below
// with a call to your real service (see public/docs/ML_TEAM_README.md).
// Keep the function signature and the return shape identical and nothing
// else in the codebase needs to change — API routes and the frontend both
// consume these shapes, not this file directly.

import { db } from 'hatchable';

// Deterministic hash -> [0,1) generator (mulberry32). Same input string
// always produces the same sequence, so a given route/vessel/cargo
// combination always resolves to the same "forecast" — this is what makes
// runs reproducible and diffable in Run History.
export function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function round(n, d = 2) {
  const m = Math.pow(10, d);
  return Math.round(n * m) / m;
}

export async function getVessels() {
  const r = await db.query('SELECT * FROM reference_vessels ORDER BY dwt_mt ASC');
  return r.rows;
}

export async function getVessel(vesselClass) {
  const r = await db.query('SELECT * FROM reference_vessels WHERE vessel_class ILIKE $1 LIMIT 1', [vesselClass]);
  return r.rows[0] || null;
}

export async function getPorts() {
  const r = await db.query('SELECT * FROM reference_ports ORDER BY name ASC');
  return r.rows;
}

export async function getPort(name) {
  const r = await db.query('SELECT * FROM reference_ports WHERE name ILIKE $1 LIMIT 1', [name]);
  return r.rows[0] || null;
}

// Base freight rate ($/MT) for a route, derived deterministically from the
// origin/destination/vessel/cargo combination so different routes price
// differently but consistently.
export function baseFreight(origin, destination, vesselType, cargoType) {
  const rnd = seededRandom(`${origin}|${destination}|${vesselType}|${cargoType}`);
  return round(14 + rnd() * 12, 2); // $14-26/MT
}

export function forecastCurve(origin, destination, vesselType, cargoType, cargoQuantity) {
  const current = baseFreight(origin, destination, vesselType, cargoType);
  const rnd = seededRandom(`${origin}|${destination}|${vesselType}|${cargoType}|${cargoQuantity}|curve`);
  const drift = (rnd() - 0.35) * 0.14; // slight upward bias on average, like the original demo
  const horizons = ['7d', '30d', '60d', '90d'];
  const days = [7, 30, 60, 90];
  const forecast = {};
  days.forEach((d, i) => {
    const p50 = round(current * (1 + drift * (d / 30)), 2);
    const spread = round(current * (0.03 + 0.006 * d) * (0.8 + rnd() * 0.4), 2);
    forecast[horizons[i]] = {
      p10: round(p50 - spread * 1.4, 2),
      p50,
      p90: round(p50 + spread * 1.6, 2),
    };
  });
  const confidence = round(0.6 + rnd() * 0.25, 2);
  return { current, forecast, confidence, drift };
}

export function shapDrivers(origin, destination, cargoType, drift) {
  const rnd = seededRandom(`${origin}|${destination}|${cargoType}|shap`);
  const pool = [
    { feature: 'BPI', bias: 1 }, { feature: 'FFA 3M', bias: 1 },
    { feature: 'Port congestion', bias: 1 }, { feature: 'Fleet utilization', bias: -1 },
    { feature: 'Coal demand', bias: -1 }, { feature: 'Bunker price', bias: -1 },
  ];
  return pool
    .map((p) => {
      const impact = round(0.2 + rnd() * 0.6, 2);
      const direction = drift >= 0 ? (p.bias > 0 ? 'positive' : 'negative') : (p.bias > 0 ? 'negative' : 'positive');
      return { feature: p.feature, impact, direction };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 4);
}

// Hard-constraint feasibility check for a vessel against a port + cargo.
export function checkVesselFeasibility(vessel, port, cargoQuantity) {
  const checks = {
    capacity: vessel.dwt_mt >= cargoQuantity ? 'PASS' : 'FAIL',
    dwt: !port || vessel.dwt_mt <= port.dwt_limit_mt ? 'PASS' : 'FAIL',
    draft: !port || vessel.draft_m <= port.draft_limit_m ? 'PASS' : 'FAIL',
    loa: !port || vessel.loa_m <= port.loa_limit_m ? 'PASS' : 'FAIL',
    beam: !port || vessel.beam_m <= port.beam_limit_m ? 'PASS' : 'FAIL',
  };
  const feasible = Object.values(checks).every((v) => v === 'PASS');
  const failedReasons = Object.entries(checks).filter(([, v]) => v === 'FAIL').map(([k]) => k);
  return { checks, feasible, failedReasons };
}

export function voyageEconomics(vessel, port, cargoQuantity, freightRate) {
  const rnd = seededRandom(`${vessel.vessel_class}|${port ? port.name : 'na'}|${cargoQuantity}|econ`);
  const voyageDays = round(10 + rnd() * 12, 1);
  const freightCost = round(freightRate * cargoQuantity, 0);
  const fuelCost = round(vessel.fuel_mt_day * voyageDays * (400 + rnd() * 120), 0);
  const waitingDays = port ? port.base_wait_days * (0.8 + cargoQuantity / (vessel.dwt_mt * 3)) : 2;
  const waitingCost = round(vessel.daily_hire_usd * waitingDays, 0);
  const voyageCost = freightCost + fuelCost + waitingCost;
  return { voyageDays, freightCost, fuelCost, waitingCost: round(waitingCost, 0), voyageCost, waitingDays: round(waitingDays, 2) };
}

export function economicScore(feasible, voyageCost, baselineCost) {
  if (!feasible) return 20;
  const ratio = baselineCost / voyageCost;
  return Math.max(0, Math.min(100, round(50 * ratio + 30, 0)));
}

export async function logRun(runType, inputs, outputs) {
  try {
    await db.query(
      'INSERT INTO scenario_runs (run_type, inputs, outputs) VALUES ($1, $2, $3)',
      [runType, JSON.stringify(inputs), JSON.stringify(outputs)]
    );
  } catch (e) {
    // Logging must never break the API response for the caller.
    console.error('logRun failed', runType, e.message);
  }
}