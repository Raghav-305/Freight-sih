import { forecastCurve, seededRandom, round, logRun } from '../lib/sim.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const b = req.body || {};
  const cargo_quantity = Number(b.cargo_quantity) || 480000;
  const origin = b.origin || 'Australia';
  const destination = b.destination || 'Dhamra';
  const vessel_type = b.vessel_type || 'Panamax';
  const cargo_type = b.cargo_type || 'Coal';
  const period_start = b.period_start || null;
  const period_end = b.period_end || null;
  const risk_tolerance = (b.risk_tolerance || 'medium').toLowerCase(); // low | medium | high

  const { current, forecast, drift } = forecastCurve(origin, destination, vessel_type, cargo_type, cargo_quantity);
  const rnd = seededRandom(`${origin}|${destination}|${cargo_quantity}|${risk_tolerance}|charter`);

  // More upward drift and lower risk tolerance -> more coverage locked in now.
  const riskFactor = { low: 0.85, medium: 0.65, high: 0.4 }[risk_tolerance] ?? 0.65;
  const driftFactor = Math.max(0, Math.min(1, 0.5 + drift * 4));
  const contractedNow = Math.round((riskFactor * 0.6 + driftFactor * 0.4) * 100);
  const contractLater = Math.round((100 - contractedNow) * 0.5);
  const spot = 100 - contractedNow - contractLater;

  const baselineCost = round(current * cargo_quantity * 1.08, 0);
  const savingPct = 0.03 + rnd() * 0.06;
  const expectedCost = round(baselineCost * (1 - savingPct), 0);
  const expectedSaving = baselineCost - expectedCost;
  const voyages = Math.max(2, Math.round(cargo_quantity / 80000));

  const out = {
    mode: 'simulated',
    inputs: { cargo_quantity, origin, destination, vessel_type, cargo_type, period_start, period_end, risk_tolerance },
    recommended_strategy: `${voyages}-voyage COA`,
    allocation: { contracted_now_pct: contractedNow, contract_later_pct: contractLater, spot_pct: spot },
    current_freight: current,
    forecast_30d: forecast['30d'],
    expected_cost: expectedCost,
    baseline_cost: baselineCost,
    expected_saving: round(expectedSaving, 0),
    risk: drift > 0.02 ? 'HIGH' : drift > -0.01 ? 'MEDIUM' : 'LOW',
    fixing_window: { start: period_start || '2026-09-10', end: period_end || '2026-09-25' },
  };

  await logRun('charter', out.inputs, out);
  res.json(out);
}