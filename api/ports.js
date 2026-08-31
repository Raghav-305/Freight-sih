import { getPorts } from '../lib/sim.js';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const ports = await getPorts();
  res.json({
    mode: 'live-reference',
    ports: ports.map((p) => ({
      name: p.name,
      queue: p.base_queue,
      average_wait_days: Number(p.base_wait_days),
      p90_wait_days: Number((p.base_wait_days * 1.8).toFixed(1)),
      berth_utilization: Math.min(95, 55 + p.base_queue * 2),
      draft_limit_m: Number(p.draft_limit_m),
      loa_limit_m: Number(p.loa_limit_m),
      beam_limit_m: Number(p.beam_limit_m),
      dwt_limit_mt: Number(p.dwt_limit_mt),
      berth_count: p.berth_count,
      berth_length_m: Number(p.berth_length_m),
      loading_rate_mt_hr: Number(p.loading_rate_mt_hr),
      discharge_rate_mt_hr: Number(p.discharge_rate_mt_hr),
      risk: p.risk,
    })),
    note: 'Sourced from the reference_ports table (seed.sql). Replace with a live port-ops feed by updating this table or swapping the query in lib/sim.js:getPorts().',
  });
}