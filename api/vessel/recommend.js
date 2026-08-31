import { getVessel, getVessels, getPort, checkVesselFeasibility, voyageEconomics, economicScore, logRun } from '../../lib/sim.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const b = req.body || {};
  const cargo_quantity = Number(b.cargo_quantity) || 80000;
  const destination = b.destination || null;
  const origin = b.origin || null;
  const freight_rate = Number(b.freight_rate) || 19.4;
  const requestedClass = b.vessel_type || null;

  const port = destination ? await getPort(destination) : null;
  const candidates = requestedClass ? [await getVessel(requestedClass)].filter(Boolean) : await getVessels();

  if (!candidates.length) {
    const out = { mode: 'simulated', feasible: false, reason: `Unknown vessel class "${requestedClass}".` };
    await logRun('vessel_recommend', b, out);
    return res.json(out);
  }

  const baselineCost = freight_rate * cargo_quantity * 1.25;
  const scored = candidates.map((v) => {
    const { checks, feasible, failedReasons } = checkVesselFeasibility(v, port, cargo_quantity);
    const econ = voyageEconomics(v, port, cargo_quantity, freight_rate);
    const score = economicScore(feasible, econ.voyageCost, baselineCost);
    return { vessel: v, checks, feasible, failedReasons, econ, score };
  }).sort((a, b2) => b2.score - a.score);

  const best = scored[0];
  const out = {
    mode: 'simulated',
    recommended_vessel: best.vessel.vessel_class,
    feasible: best.feasible,
    economic_score: best.score,
    checks: best.checks,
    voyage_cost: best.econ.voyageCost,
    reason: best.feasible
      ? `${best.vessel.vessel_class} passes all hard constraints${port ? ` at ${port.name}` : ''} and has the lowest total voyage cost among evaluated classes.`
      : `${best.vessel.vessel_class} fails: ${best.failedReasons.join(', ')}.`,
    alternatives: scored.slice(1, 4).map((s) => ({ vessel_class: s.vessel.vessel_class, feasible: s.feasible, economic_score: s.score })),
  };

  await logRun('vessel_recommend', { cargo_quantity, destination, origin, freight_rate, vessel_type: requestedClass }, out);
  res.json(out);
}