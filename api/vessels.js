import { getVessels, getPort, checkVesselFeasibility, voyageEconomics, economicScore, round } from '../lib/sim.js';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const q = req.query || {};
  const destination = q.destination || null;
  const cargo_quantity = Number(q.cargo_quantity) || 80000;
  const freight_rate = Number(q.freight_rate) || 19.4;

  const vessels = await getVessels();
  const port = destination ? await getPort(destination) : null;

  const baselineCost = freight_rate * cargo_quantity * 1.25; // rough spot-market baseline for scoring

  const rows = vessels.map((v) => {
    const { checks, feasible, failedReasons } = checkVesselFeasibility(v, port, cargo_quantity);
    const econ = voyageEconomics(v, port, cargo_quantity, freight_rate);
    const score = economicScore(feasible, econ.voyageCost, baselineCost);
    return {
      vessel_class: v.vessel_class,
      feasible,
      capacity_mt: Number(v.dwt_mt),
      draft_m: Number(v.draft_m),
      port_compatibility: feasible ? 'Compatible' : `Fails: ${failedReasons.join(', ') || 'capacity'}`,
      freight_cost: econ.freightCost,
      fuel_cost: econ.fuelCost,
      waiting_cost: econ.waitingCost,
      voyage_cost: econ.voyageCost,
      risk: feasible ? (score > 70 ? 'Low' : 'Medium') : 'High',
      economic_score: score,
      checks,
    };
  });

  rows.sort((a, b) => b.economic_score - a.economic_score);
  rows.forEach((r, i) => { r.rank = i + 1; r.recommendation = !r.feasible ? 'Not feasible' : i === 0 ? 'Preferred' : 'Alternative'; });

  res.json({ mode: 'simulated', query: { destination, cargo_quantity, freight_rate }, vessels: rows });
}