-- Initial placeholder schema for local PostgreSQL.
-- Expand these tables before production ingestion.

CREATE TABLE IF NOT EXISTS model_versions (
  id SERIAL PRIMARY KEY,
  model_version TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL,
  dataset_version TEXT,
  feature_version TEXT,
  training_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  vessel_type TEXT NOT NULL,
  cargo_type TEXT,
  cargo_quantity NUMERIC,
  model_version TEXT,
  response_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recommendation_type TEXT NOT NULL,
  inputs_json JSONB NOT NULL,
  outputs_json JSONB NOT NULL,
  reviewer_status TEXT NOT NULL DEFAULT 'pending'
);
