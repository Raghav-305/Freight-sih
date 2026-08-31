import { seededRandom, round } from '../lib/sim.js';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const q = req.query || {};
  const route = q.route || q.destination || 'default';
  const rnd = seededRandom(`risk|${route}`);

  const scores = {
    market: round(35 + rnd() * 35, 0),
    port: round(35 + rnd() * 40, 0),
    weather: round(20 + rnd() * 40, 0),
    geopolitical: round(20 + rnd() * 40, 0),
    supply: round(25 + rnd() * 40, 0),
    contract: round(15 + rnd() * 35, 0),
  };
  const overall = round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length, 0);

  res.json({
    mode: 'simulated',
    route,
    overall_risk: overall,
    scores,
    events: [
      {
        type: 'Australian Cyclone', region: 'Queensland', severity: 'HIGH',
        start: '2026-09-01', end: '2026-09-04', affected_routes: ['Gladstone', 'Hay Point'],
        expected_impact_days: 1.8, source: 'demonstration feed', last_updated: new Date().toISOString(),
      },
    ],
  });
}