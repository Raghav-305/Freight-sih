import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

// Keyset-paginated log of every scenario run made through the UI/API.
// GET /api/history?type=forecast&limit=20&before_id=123
export default async function (req, res) {
  const q = req.query || {};
  const limit = Math.min(100, Number(q.limit) || 25);
  const type = q.type || null;
  const beforeId = q.before_id ? Number(q.before_id) : null;

  const clauses = [];
  const params = [];
  if (type) { params.push(type); clauses.push(`run_type = $${params.length}`); }
  if (beforeId) { params.push(beforeId); clauses.push(`id < $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  params.push(limit);

  const r = await db.query(
    `SELECT id, run_type, inputs, outputs, created_at FROM scenario_runs ${where} ORDER BY id DESC LIMIT $${params.length}`,
    params
  );

  res.json({ runs: r.rows, next_cursor: r.rows.length === limit ? r.rows[r.rows.length - 1].id : null });
}