import { forecastCurve, shapDrivers, logRun } from '../lib/sim.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  const b = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const origin = b.origin || 'Gladstone';
  const destination = b.destination || 'Dhamra';
  const vessel_type = b.vessel_type || 'Panamax';
  const cargo_type = b.cargo_type || 'Coal';
  const cargo_quantity = Number(b.cargo_quantity) || 80000;
  const laycan_start = b.laycan_start || null;
  const laycan_end = b.laycan_end || null;

  const { current, forecast, confidence, drift } = forecastCurve(origin, destination, vessel_type, cargo_type, cargo_quantity);
  const shap = shapDrivers(origin, destination, cargo_type, drift);

  const out = {
    mode: 'simulated',
    route: { origin, destination, vessel_type, cargo_type, cargo_quantity, laycan_start, laycan_end },
    current_freight: current,
    forecast,
    confidence,
    model_version: 'sim_v1_deterministic',
    dataset_version: 'route_features_v12',
    feature_version: 'v5.1',
    training_date: null,
    shap,
    note: 'Simulated output from lib/sim.js. Replace with a real model call per public/docs/ML_TEAM_README.md — the response shape will not change.',
  };

  await logRun('forecast', { origin, destination, vessel_type, cargo_type, cargo_quantity, laycan_start, laycan_end }, out);
  res.json(out);
}