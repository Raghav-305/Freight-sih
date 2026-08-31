INSERT INTO reference_vessels (vessel_class, dwt_mt, loa_m, beam_m, draft_m, speed_kn, fuel_mt_day, daily_hire_usd) VALUES
  ('Handysize', 38000, 180, 30.0, 10.2, 14.0, 22, 9500),
  ('Supramax',  58000, 190, 32.3, 12.8, 14.0, 26, 11800),
  ('Panamax',   82000, 228, 32.3, 13.6, 14.0, 28, 13600),
  ('Capesize', 180000, 292, 45.0, 17.0, 14.5, 42, 19800)
ON CONFLICT (vessel_class) DO NOTHING;

INSERT INTO reference_ports (name, draft_limit_m, loa_limit_m, beam_limit_m, dwt_limit_mt, berth_count, berth_length_m, loading_rate_mt_hr, discharge_rate_mt_hr, base_queue, base_wait_days, risk) VALUES
  ('Dhamra',         14.5, 230, 33.0, 85000,  4, 320, 4000, 5000, 18, 2.3, 'Medium'),
  ('Paradip',         13.2, 225, 32.5, 82000,  5, 300, 3600, 4500, 14, 1.9, 'Medium'),
  ('Visakhapatnam',   18.0, 300, 45.0, 185000, 6, 340, 3200, 4200,  9, 1.2, 'Low'),
  ('Gangavaram',      18.0, 300, 45.0, 185000, 3, 310, 3400, 4400,  7, 0.9, 'Low'),
  ('Gopalpur',        13.0, 220, 32.0, 80000,  3, 260, 2800, 3600, 11, 1.5, 'Medium'),
  ('Haldia',           9.5, 186, 28.0, 40000,  8, 400, 2200, 2800, 16, 2.0, 'High'),
  ('Gladstone',       17.0, 290, 45.0, 180000, 5, 350, 4500, 4800,  5, 0.6, 'Low'),
  ('Hay Point',       17.5, 300, 47.0, 190000, 4, 360, 4800, 5000,  6, 0.8, 'Low'),
  ('Newcastle',       16.5, 300, 47.0, 180000, 4, 340, 4600, 4900,  8, 1.0, 'Low')
ON CONFLICT (name) DO NOTHING;