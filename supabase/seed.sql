-- ============================================================
-- SHIFTShield 2.0 — Seed Data
-- Run AFTER schema.sql and policies.sql
-- Inserts realistic demo data for the hackathon presentation
-- NOTE: Auth users (supervisor/worker demo accounts) must be
--       created via Supabase Auth before running this script.
--       See SETUP.md for step-by-step instructions.
-- ============================================================

-- ============================================================
-- STEP 0: Create demo auth users first via Supabase Auth UI
-- (Authentication > Users > Add User)
-- supervisor@shiftshield.demo / ShiftShield2026!
-- worker01@shiftshield.demo / ShiftShield2026!
-- Then get their UUIDs and replace below.
-- ============================================================

-- Use fixed UUIDs for reproducibility (replace if needed)
-- Supervisor: sup-00000000-0000-0000-0000-000000000001
-- Worker01:   wk-000000-0000-0000-0000-000000000001

-- ---- Workplace ----------------------------------------------

INSERT INTO workplaces (id, name, address, latitude, longitude)
VALUES (
    '00000000-0000-0000-0001-000000000001',
    'Riverside Construction Site',
    '45 Riverside Drive, Sydney NSW 2000',
    -33.8688,
    151.2093
)
ON CONFLICT (id) DO NOTHING;

-- ---- Cooling Resources --------------------------------------

INSERT INTO cooling_resources (id, workplace_id, name, category, latitude, longitude, address, status, last_verified)
VALUES
    ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Site Water Station A', 'water', -33.8681, 151.2088, 'Near Eastern Site Entrance', 'available', now() - interval '2 hours'),
    ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Site Water Station B', 'water', -33.8695, 151.2098, 'Western Site Compound', 'available', now() - interval '1 hour'),
    ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 'Shaded Rest Area — Mess Tent', 'shade', -33.8692, 151.2085, 'Central Site, near Site Office', 'available', now() - interval '30 minutes'),
    ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000001', 'Shaded Seating — North Boundary', 'shade', -33.8678, 151.2100, 'Northern boundary fence, near Gate 2', 'available', now() - interval '4 hours'),
    ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000001', 'First Aid Station', 'first_aid', -33.8688, 151.2080, 'Site Office — Ground Floor', 'available', now() - interval '6 hours'),
    ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000001', 'Water Cooler — Level 1', 'water', -33.8685, 151.2095, 'Level 1 stairwell landing', 'unverified', now() - interval '24 hours')
ON CONFLICT (id) DO NOTHING;

-- ---- Environmental Reading ----------------------------------

INSERT INTO environmental_readings (id, workplace_id, source, temperature_c, humidity_pct, wind_speed_ms, solar_radiation, weather_code, recorded_at)
VALUES (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'demo_fallback',
    34.2,
    68.0,
    3.1,
    780.0,
    0,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- ---- Risk Assessment ----------------------------------------

INSERT INTO risk_assessments (id, workplace_id, reading_id, risk_level, workload, exposure_mins, contributing_factors, recommendations, explanation, data_source)
VALUES (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0003-000000000001',
    'elevated',
    'heavy',
    120,
    '["High environmental temperature (34.2°C)", "Elevated relative humidity (68%)", "Direct sun exposure (outdoor, unshaded)", "Heavy physical workload", "Extended exposure duration (120 minutes)"]',
    '["Review the planned outdoor work period — reschedule heavy tasks to before 9:00 AM or after 4:00 PM.", "Ensure mandatory recovery breaks every 30 minutes for workers on heavy outdoor tasks.", "Confirm drinking water access within 50 metres of all active work areas.", "Identify and use available shaded recovery areas during breaks.", "Monitor workers closely for signs of heat stress.", "Follow the site heat illness emergency response protocol if any symptoms are reported."]',
    'Current conditions present an elevated heat exposure concern. The combination of high ambient temperature (34.2°C), significant relative humidity (68%), direct sun exposure, and heavy physical workload creates conditions where heat stress risk is substantially higher than baseline.',
    'SHIFTShield deterministic risk engine — demo data'
)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Worker profiles and tasks require auth users to be created first.
-- See SETUP.md for the complete step-by-step setup guide.
