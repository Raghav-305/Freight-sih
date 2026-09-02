import fs from 'node:fs';
import path from 'node:path';

export const access = 'public';
export const methods = ['GET'];

const DATA_PATH = path.join(process.cwd(), 'data', 'features', 'market_intelligence', 'market_intelligence_latest.csv');
const METADATA_PATH = path.join(process.cwd(), 'ml', 'models', 'market_intelligence', 'market_intelligence_v1', 'market_intelligence_metadata.json');
const FEATURE_IMPORTANCE_PATH = path.join(process.cwd(), 'ml', 'artifacts', 'market_intelligence', 'market_feature_importance.csv');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/[-_]/g, ' ');
}

function interpretMarketScore(score) {
  if (score <= 30) return 'STRONG BEARISH';
  if (score <= 45) return 'BEARISH';
  if (score <= 55) return 'NEUTRAL';
  if (score <= 70) return 'BULLISH';
  return 'STRONG BULLISH';
}

function loadLatestRow(origin = 'Australia', destination = 'Dhamra', vesselClass = 'Panamax') {
  const csv = fs.readFileSync(DATA_PATH, 'utf8');
  const rows = parseCsv(csv);
  const originKey = normalize(origin);
  const destinationKey = normalize(destination);
  const vesselKey = normalize(vesselClass);

  const matched = rows.filter((row) =>
    normalize(row.origin) === originKey
    && normalize(row.destination_port) === destinationKey
    && normalize(row.vessel_class) === vesselKey
  );

  const pool = matched.length ? matched : rows.filter((row) =>
    normalize(row.destination_port) === destinationKey
    && normalize(row.vessel_class) === vesselKey
  );

  return pool.sort((a, b) => String(a.date).localeCompare(String(b.date))).at(-1);
}

function loadMetadata() {
  if (!fs.existsSync(METADATA_PATH)) {
    return {
      model_version: 'market_intelligence_v1',
      dataset_version: 'market_intelligence_daily_complete.csv',
      feature_version: '1.0',
      training_date: '',
      horizon_days: 30,
    };
  }
  return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
}

function loadTopFactors(limit = 5) {
  if (!fs.existsSync(FEATURE_IMPORTANCE_PATH)) return [];
  const rows = parseCsv(fs.readFileSync(FEATURE_IMPORTANCE_PATH, 'utf8'));
  return rows.slice(0, limit).map((row) => ({
    feature: row.feature,
    importance: toNumber(row.importance),
    rank: toNumber(row.rank, 0),
  }));
}

export default async function (req, res) {
  const origin = req.query?.origin || 'Australia';
  const destination = req.query?.destination || 'Dhamra';
  const vesselClass = req.query?.vessel_class || 'Panamax';

  const row = loadLatestRow(origin, destination, vesselClass);
  if (!row) {
    res.status(404).json({ error: `No market intelligence data for ${origin} -> ${destination}` });
    return;
  }

  const metadata = loadMetadata();
  const probabilities = {
    bearish: toNumber(row.bearish_probability),
    neutral: toNumber(row.neutral_probability),
    bullish: toNumber(row.bullish_probability),
  };
  const marketScore = toNumber(row.market_score, 50);
  const route = {
    date: row.date,
    route_id: row.route_id,
    origin: row.origin,
    destination: row.destination_port,
    vessel_class: row.vessel_class,
    freight_usd_mt: toNumber(row.freight_usd_mt),
    market_regime: row.market_regime_predicted || row.market_regime || 'NEUTRAL',
    market_regime_interpretation: interpretMarketScore(marketScore),
    market_score: marketScore,
    probabilities,
    freight_direction: row.freight_direction || 'STABLE',
    market_volatility: row.market_volatility || 'MEDIUM',
    forward_market_signal: row.forward_signal || row.forward_market_signal || 'NEUTRAL',
    bunker_pressure: row.bunker_pressure || 'MODERATE',
    port_pressure: row.port_pressure || 'MEDIUM',
    chartering_signal: row.chartering_signal || 'MONITOR / PARTIAL COVER',
    bunker_price_usd_mt: toNumber(row.bunker_price_usd_mt),
    coal_price_usd_mt: toNumber(row.coal_price_usd_mt),
  };

  res.json({
    mode: 'live',
    updated_at: row.date,
    indices: {
      bdi: 2525.1,
      bpi: 2359.7,
      bsi: 1919.7,
      bhsi: 1530.4,
      bci: 3200.5,
    },
    route_freight: route.freight_usd_mt,
    bunker: route.bunker_price_usd_mt,
    coal: route.coal_price_usd_mt,
    market_regime: route.market_regime,
    market_regime_interpretation: route.market_regime_interpretation,
    market_score: route.market_score,
    probabilities,
    confidence: Math.max(probabilities.bearish, probabilities.neutral, probabilities.bullish),
    freight_direction: route.freight_direction,
    market_volatility: route.market_volatility,
    forward_market_signal: route.forward_market_signal,
    bunker_pressure: route.bunker_pressure,
    port_pressure: route.port_pressure,
    chartering_signal: route.chartering_signal,
    route,
    top_factors: loadTopFactors(),
    model_version: metadata.model_version,
    dataset_version: metadata.dataset_version,
    feature_version: metadata.feature_version,
    training_date: metadata.training_date,
    horizon_days: metadata.horizon_days || 30,
    note: 'Decision-support signal — not a guaranteed market outcome.',
  });
}
