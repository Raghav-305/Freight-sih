import { forecastCurve, seededRandom, round, logRun } from '../../lib/sim.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const b = req.body || {};
  const cargo_quantity = Number(b.cargo_quantity) || 480000;
  const origin = b.origin || 'Australia';
  const destination = b.destination || 'Indonesia';
  const vessel_type = b.vessel_type || 'Panamax';
  const cargo_type = b.cargo_type || 'Coal';
  const risk_tolerance = (b.risk_tolerance || 'medium').toLowerCase();

  const { current, drift } = forecastCurve(origin, destination, vessel_type, cargo_type, cargo_quantity);
  const rnd = seededRandom(`${origin}|${destination}|${cargo_quantity}|${risk_tolerance}|optimize`);

  const riskFactor = { low: 0.8, medium: 0.55, high: 0.3 }[risk_tolerance] ?? 0.55;
  const coaPct = Math.round((riskFactor * 0.7 + Math.max(0, drift) * 5) * 100);
  const multiVoyagePct = Math.round((1 - riskFactor) * 40);
  const shortTermPct = Math.round((1 - riskFactor) * 25);
  let spotPct = 100 - coaPct - multiVoyagePct - shortTermPct;
  if (spotPct < 0) spotPct = 0;

  const baselineCost = round(current * cargo_quantity * 1.08, 0);
  const savingPct = 0.02 + rnd() * 0.08;
  const expectedCost = round(baselineCost * (1 - savingPct), 0);

  const out = {
    mode: 'simulated',
    inputs: { cargo_quantity, origin, destination, vessel_type, cargo_type, risk_tolerance },
    spot_pct: spotPct,
    short_term_pct: shortTermPct,
    multi_voyage_pct: multiVoyagePct,
    coa_pct: coaPct,
    expected_cost: expectedCost,
    baseline_cost: baselineCost,
    expected_saving: round(baselineCost - expectedCost, 0),
    risk: drift > 0.02 ? 'HIGH' : drift > -0.01 ? 'MEDIUM' : 'LOW',
    recommended_strategy: coaPct >= 50 ? 'COA-led' : spotPct >= 40 ? 'Spot-led' : 'Balanced multi-instrument',
    fixing_window: { start: '2026-09-10', end: '2026-09-25' },
  };

  await logRun('contract_optimize', out.inputs, out);
  res.json(out);
}