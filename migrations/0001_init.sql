-- Reference vessel classes (used by vessel recommendation + feasibility checks)
CREATE TABLE reference_vessels (
  id BIGSERIAL PRIMARY KEY,
  vessel_class TEXT NOT NULL UNIQUE,
  dwt_mt NUMERIC NOT NULL,
  loa_m NUMERIC NOT NULL,
  beam_m NUMERIC NOT NULL,
  draft_m NUMERIC NOT NULL,
  speed_kn NUMERIC NOT NULL,
  fuel_mt_day NUMERIC NOT NULL,
  daily_hire_usd NUMERIC NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Reference port master data (used by port checks + congestion lookups)
CREATE TABLE reference_ports (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  draft_limit_m NUMERIC NOT NULL,
  loa_limit_m NUMERIC NOT NULL,
  beam_limit_m NUMERIC NOT NULL,
  dwt_limit_mt NUMERIC NOT NULL,
  berth_count INT NOT NULL,
  berth_length_m NUMERIC NOT NULL,
  loading_rate_mt_hr NUMERIC NOT NULL,
  discharge_rate_mt_hr NUMERIC NOT NULL,
  base_queue INT NOT NULL,
  base_wait_days NUMERIC NOT NULL,
  risk TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Every scenario a user runs through the UI (forecast, vessel check, charter
-- strategy, what-if, etc) is logged here. This is what makes the platform
-- testable end-to-end: run something in the UI, then see it appear in
-- Run History with its exact inputs and outputs.
CREATE TABLE scenario_runs (
  id BIGSERIAL PRIMARY KEY,
  run_type TEXT NOT NULL,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenario_runs_type ON scenario_runs(run_type);
CREATE INDEX idx_scenario_runs_created_at ON scenario_runs(created_at DESC);