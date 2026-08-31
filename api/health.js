import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  let dbStatus = 'unknown';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }
  res.json({
    status: 'ok',
    mode: 'simulated-backend',
    service: 'freight-chartering-api',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}