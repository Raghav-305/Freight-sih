import { forecastCurve, round, logRun } from '../lib/sim.js';

export const access = 'public';
export const methods = ['POST'];

function scenario(inputs) {
  const { cargo_quantity, origin, destination, vessel_type, cargo_type, coverage, market_adj_pct, bunker_adj_pct, congestion_adj_days } = inputs;
  const { current, drift } = forecastCurve(origin, destination, vessel_type, cargo_type, cargo_quantity);
  const freight = round(current * (1 + (market_adj_pct || 0) / 100), 2);
  const forecast30 = round(freight * (1 + drift), 2);
  const baseCost = freight * cargo_quantity;
  const bunkerLoad = baseCost * 0.18 * (1 + (bunker_adj_pct || 0) / 100);
  const expected_cost = round(baseCost + bunkerLoad, 0);
  const congestion = round(1.8 + (congestion_adj_days || 0), 2);
  const spot_exposure = round(100 - (coverage ?? 60), 0);
  return { freight, forecast_30d: forecast30, expected_cost, risk: drift > 0.02 ? 'HIGH' : drift > -0.01 ? 'MEDIUM' : 'LOW', congestion_days: congestion, waiting_days: round(congestion * 1.05, 2), coverage: coverage ?? 60, spot_exposure_pct: spot_exposure };
}

export default async function (req, res) {
  const b = req.body || {};
  const baselineInputs = {
    cargo_quantity: Number(b.baseline_cargo_quantity) || 400000,
    origin: b.origin || 'Australia',
    destination: b.destination || 'Indonesia',
    vessel_type: b.vessel_type || 'Panamax',
    cargo_type: b.cargo_type || 'Coal',
    coverage: Number(b.baseline_coverage) || 60,
    market_adj_pct: 0, bunker_adj_pct: 0, congestion_adj_days: 0,
  };
  const scenarioInputs = {
    cargo_quantity: Number(b.cargo_quantity) || 500000,
    origin: b.origin || 'Australia',
    destination: b.destination || 'Indonesia',
    vessel_type: b.vessel_type || 'Panamax',
    cargo_type: b.cargo_type || 'Coal',
    coverage: Number(b.coverage) || 60,
    market_adj_pct: Number(b.market_adj_pct) || 0,
    bunker_adj_pct: Number(b.bunker_adj_pct) || 0,
    congestion_adj_days: Number(b.congestion_adj_days) || 0,
  };

  const baseline = scenario(baselineInputs);
  const scen = scenario(scenarioInputs);

  const freightDiff = round(scen.freight - baseline.freight, 2);
  const forecastDiff = round(scen.forecast_30d - baseline.forecast_30d, 2);
  const costDiff = scen.expected_cost - baseline.expected_cost;

  const out = {
    mode: 'simulated',
    baseline,
    scenario: scen,
    freight_difference: freightDiff,
    forecast_difference: forecastDiff,
    vessel_recommendation: scenarioInputs.vessel_type,
    contract_strategy: scen.spot_exposure_pct > 35 ? '50% Spot + 50% COA' : '30% Spot + 70% COA',
    expected_cost_difference: round(costDiff, 0),
    expected_saving: costDiff < 0 ? round(-costDiff, 0) : 0,
    decision_impact: `${scenarioInputs.cargo_quantity > baselineInputs.cargo_quantity ? 'Increasing' : 'Changing'} cargo to ${scenarioInputs.cargo_quantity.toLocaleString()} MT moves expected cost by ${costDiff >= 0 ? '+' : ''}$${Math.round(costDiff).toLocaleString()} versus baseline, with spot exposure at ${scen.spot_exposure_pct}%.`,
  };

  await logRun('what_if', { baseline: baselineInputs, scenario: scenarioInputs }, out);
  res.json(out);
}