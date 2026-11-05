-- ============================================================
-- SHIFTShield 2.0 — Supabase Database Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- ---- Enable extensions --------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- Custom enum types --------------------------------------

CREATE TYPE user_role AS ENUM ('supervisor', 'worker');
CREATE TYPE worker_status AS ENUM ('safe', 'attention', 'recovery', 'sos');
CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'elevated', 'high');
CREATE TYPE workload_level AS ENUM ('light', 'moderate', 'heavy', 'very_heavy');
CREATE TYPE environment_type AS ENUM ('outdoor_sun', 'outdoor_shade', 'indoor');
CREATE TYPE weather_source AS ENUM ('open_meteo', 'cached', 'demo_fallback', 'manual', 'sensor');
CREATE TYPE schedule_status AS ENUM ('pending', 'active', 'complete', 'skipped');
CREATE TYPE alert_type AS ENUM ('sos', 'heat_stress', 'injury', 'water_unavailable', 'shade_unavailable');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'responding', 'resolved');
CREATE TYPE resource_category AS ENUM ('water', 'shade', 'first_aid');
CREATE TYPE resource_status AS ENUM ('available', 'unavailable', 'unverified');
CREATE TYPE action_type AS ENUM (
    'risk_assessed', 'alert_created', 'alert_acknowledged',
    'schedule_changed', 'worker_sos', 'response_initiated',
    'action_resolved', 'resource_reported'
);
CREATE TYPE action_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE notification_type AS ENUM ('risk_alert', 'sos', 'schedule', 'system');

-- ---- workplaces ---------------------------------------------

CREATE TABLE workplaces (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text NOT NULL,
    address     text,
    latitude    double precision NOT NULL,
    longitude   double precision NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- profiles (extends auth.users) -------------------------

CREATE TABLE profiles (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       text NOT NULL,
    role            user_role NOT NULL DEFAULT 'worker',
    workplace_id    uuid REFERENCES workplaces(id),
    avatar_url      text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'worker')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---- workers ------------------------------------------------

CREATE TABLE workers (
    id                      uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    workplace_id            uuid NOT NULL REFERENCES workplaces(id),
    job_title               text,
    acclimatisation_days    int NOT NULL DEFAULT 0,
    status                  worker_status NOT NULL DEFAULT 'safe',
    last_seen               timestamptz NOT NULL DEFAULT now()
);

-- ---- tasks --------------------------------------------------

CREATE TABLE tasks (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workplace_id    uuid NOT NULL REFERENCES workplaces(id),
    title           text NOT NULL,
    description     text,
    workload        workload_level NOT NULL DEFAULT 'moderate',
    environment     environment_type NOT NULL DEFAULT 'outdoor_sun',
    duration_mins   int NOT NULL CHECK (duration_mins > 0),
    deadline        timestamptz,
    assigned_to     uuid REFERENCES workers(id),
    created_by      uuid REFERENCES profiles(id),
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- schedules ----------------------------------------------

CREATE TABLE schedules (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    worker_id           uuid NOT NULL REFERENCES workers(id),
    scheduled_start     timestamptz NOT NULL,
    scheduled_end       timestamptz NOT NULL,
    status              schedule_status NOT NULL DEFAULT 'pending',
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- environmental_readings ---------------------------------

CREATE TABLE environmental_readings (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workplace_id    uuid NOT NULL REFERENCES workplaces(id),
    source          weather_source NOT NULL DEFAULT 'open_meteo',
    temperature_c   double precision NOT NULL,
    humidity_pct    double precision NOT NULL,
    wind_speed_ms   double precision,
    solar_radiation double precision,
    weather_code    int,
    recorded_at     timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- risk_assessments ---------------------------------------

CREATE TABLE risk_assessments (
    id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workplace_id            uuid NOT NULL REFERENCES workplaces(id),
    reading_id              uuid REFERENCES environmental_readings(id),
    risk_level              risk_level NOT NULL,
    workload                workload_level NOT NULL,
    exposure_mins           int NOT NULL,
    contributing_factors    jsonb NOT NULL DEFAULT '[]',
    recommendations         jsonb NOT NULL DEFAULT '[]',
    explanation             text NOT NULL,
    data_source             text NOT NULL,
    assessed_at             timestamptz NOT NULL DEFAULT now()
);

-- ---- cooling_resources --------------------------------------

CREATE TABLE cooling_resources (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workplace_id    uuid NOT NULL REFERENCES workplaces(id),
    name            text NOT NULL,
    category        resource_category NOT NULL,
    latitude        double precision NOT NULL,
    longitude       double precision NOT NULL,
    address         text,
    status          resource_status NOT NULL DEFAULT 'available',
    last_verified   timestamptz,
    added_by        uuid REFERENCES profiles(id),
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- emergency_alerts ---------------------------------------

CREATE TABLE emergency_alerts (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id           uuid NOT NULL REFERENCES workers(id),
    workplace_id        uuid NOT NULL REFERENCES workplaces(id),
    alert_type          alert_type NOT NULL,
    latitude            double precision,
    longitude           double precision,
    status              alert_status NOT NULL DEFAULT 'active',
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    acknowledged_by     uuid REFERENCES profiles(id),
    acknowledged_at     timestamptz,
    resolved_at         timestamptz
);

-- ---- safety_actions -----------------------------------------

CREATE TABLE safety_actions (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id        uuid REFERENCES emergency_alerts(id),
    assessment_id   uuid REFERENCES risk_assessments(id),
    schedule_id     uuid REFERENCES schedules(id),
    actor_id        uuid NOT NULL REFERENCES profiles(id),
    action_type     action_type NOT NULL,
    description     text NOT NULL,
    related_worker  uuid REFERENCES workers(id),
    workplace_id    uuid NOT NULL REFERENCES workplaces(id),
    status          action_status NOT NULL DEFAULT 'open',
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- notifications ------------------------------------------

CREATE TABLE notifications (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           text NOT NULL,
    body            text NOT NULL,
    read            boolean NOT NULL DEFAULT false,
    reference_id    uuid,
    reference_type  text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- Indexes ------------------------------------------------

CREATE INDEX idx_risk_assessments_workplace_time ON risk_assessments (workplace_id, assessed_at DESC);
CREATE INDEX idx_emergency_alerts_status_time ON emergency_alerts (status, created_at DESC);
CREATE INDEX idx_safety_actions_workplace_time ON safety_actions (workplace_id, created_at DESC);
CREATE INDEX idx_env_readings_workplace_time ON environmental_readings (workplace_id, recorded_at DESC);
CREATE INDEX idx_schedules_worker_time ON schedules (worker_id, scheduled_start);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, read, created_at DESC);
CREATE INDEX idx_workers_workplace ON workers (workplace_id, status);
