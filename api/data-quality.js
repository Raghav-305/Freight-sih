import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const r = await db.query('SELECT run_type, COUNT(*)::int AS n, MAX(created_at) AS last FROM scenario_runs GROUP BY run_type');
  const byType = Object.fromEntries(r.rows.map((row) => [row.run_type, row]));
  const totalRuns = r.rows.reduce((s, row) => s + row.n, 0);

  const datasets = [
    { name: 'Freight', missing_pct: 0.8, duplicates_pct: 0.1, invalid_values: 3, status: 'HEALTHY' },
    { name: 'Vessel', missing_pct: 1.4, duplicates_pct: 0.2, invalid_values: 7, status: 'HEALTHY' },
    { name: 'Ports', missing_pct: 0.3, duplicates_pct: 0.0, invalid_values: 1, status: 'HEALTHY' },
    { name: 'AIS', missing_pct: 4.6, duplicates_pct: 1.7, invalid_values: 38, status: 'WARNING' },
    { name: 'Weather', missing_pct: 2.2, duplicates_pct: 0.4, invalid_values: 5, status: 'HEALTHY' },
    { name: 'Commodity', missing_pct: 1.8, duplicates_pct: 0.2, invalid_values: 4, status: 'HEALTHY' },
    { name: 'Bunker', missing_pct: 0.5, duplicates_pct: 0.1, invalid_values: 1, status: 'HEALTHY' },
    { name: 'FFA', missing_pct: 1.1, duplicates_pct: 0.0, invalid_values: 2, status: 'HEALTHY' },
    { name: 'Fixtures', missing_pct: 3.8, duplicates_pct: 0.8, invalid_values: 12, status: 'WARNING' },
    {
      name: 'Scenario Runs (live)',
      missing_pct: 0,
      duplicates_pct: 0,
      invalid_values: 0,
      status: totalRuns > 0 ? 'HEALTHY' : 'WARNING',
      row_count: totalRuns,
      last_updated: byType && Object.values(byType).length ? Object.values(byType).map((v) => v.last).sort().reverse()[0] : null,
      note: 'The only dataset here backed by real rows — every run through the UI logs to scenario_runs. Others are placeholder demo datasets.',
    },
  ];

  res.json({ mode: 'simulated', datasets, run_counts_by_type: byType });
}