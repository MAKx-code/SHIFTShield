-- ============================================================
-- SHIFTShield 2.0 — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- ---- Enable RLS on all tables -------------------------------

ALTER TABLE workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooling_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ---- Helper: get user role from profiles --------------------

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
    SELECT role::text FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_workplace()
RETURNS uuid AS $$
    SELECT workplace_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ---- profiles -----------------------------------------------

-- Users can read their own profile
CREATE POLICY "profiles: read own"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Supervisors can read all profiles in their workplace
CREATE POLICY "profiles: supervisor read workplace"
    ON profiles FOR SELECT
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- Users can update their own profile
CREATE POLICY "profiles: update own"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- ---- workplaces ---------------------------------------------

-- All authenticated users can read their workplace
CREATE POLICY "workplaces: read own"
    ON workplaces FOR SELECT
    USING (id = get_user_workplace());

-- ---- workers ------------------------------------------------

-- Workers: read own record
CREATE POLICY "workers: read own"
    ON workers FOR SELECT
    USING (id = auth.uid());

-- Supervisors: read all workers in their workplace
CREATE POLICY "workers: supervisor read"
    ON workers FOR SELECT
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- Supervisors: update worker status
CREATE POLICY "workers: supervisor update"
    ON workers FOR UPDATE
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- ---- tasks --------------------------------------------------

-- Workers: read tasks assigned to them
CREATE POLICY "tasks: worker read own"
    ON tasks FOR SELECT
    USING (assigned_to = auth.uid());

-- Supervisors: full access to their workplace tasks
CREATE POLICY "tasks: supervisor all"
    ON tasks FOR ALL
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- ---- schedules ----------------------------------------------

-- Workers: read their own schedules
CREATE POLICY "schedules: worker read own"
    ON schedules FOR SELECT
    USING (worker_id = auth.uid());

-- Workers: update their own schedule status (check in, complete)
CREATE POLICY "schedules: worker update own"
    ON schedules FOR UPDATE
    USING (worker_id = auth.uid());

-- Supervisors: full access
CREATE POLICY "schedules: supervisor all"
    ON schedules FOR ALL
    USING (
        get_user_role() = 'supervisor' AND
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = schedules.task_id
            AND t.workplace_id = get_user_workplace()
        )
    );

-- ---- environmental_readings ---------------------------------

-- All authenticated users in workplace can read
CREATE POLICY "readings: read own workplace"
    ON environmental_readings FOR SELECT
    USING (workplace_id = get_user_workplace());

-- Supervisors can insert
CREATE POLICY "readings: supervisor insert"
    ON environmental_readings FOR INSERT
    WITH CHECK (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- ---- risk_assessments ---------------------------------------

-- All authenticated users in workplace can read
CREATE POLICY "risk: read own workplace"
    ON risk_assessments FOR SELECT
    USING (workplace_id = get_user_workplace());

-- Supervisors can insert
CREATE POLICY "risk: supervisor insert"
    ON risk_assessments FOR INSERT
    WITH CHECK (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- ---- cooling_resources --------------------------------------

-- All authenticated users in workplace can read
CREATE POLICY "resources: read own workplace"
    ON cooling_resources FOR SELECT
    USING (workplace_id = get_user_workplace());

-- Supervisors: full management
CREATE POLICY "resources: supervisor all"
    ON cooling_resources FOR ALL
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- ---- emergency_alerts ---------------------------------------

-- Workers: read own alerts
CREATE POLICY "alerts: worker read own"
    ON emergency_alerts FOR SELECT
    USING (worker_id = auth.uid());

-- Workers: create alerts
CREATE POLICY "alerts: worker create"
    ON emergency_alerts FOR INSERT
    WITH CHECK (worker_id = auth.uid());

-- Supervisors: read and update all alerts in their workplace
CREATE POLICY "alerts: supervisor all"
    ON emergency_alerts FOR ALL
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- ---- safety_actions -----------------------------------------

-- Supervisors: read all actions for their workplace
CREATE POLICY "safety_actions: supervisor read"
    ON safety_actions FOR SELECT
    USING (
        get_user_role() = 'supervisor' AND
        workplace_id = get_user_workplace()
    );

-- Backend (service role) can insert
CREATE POLICY "safety_actions: insert authenticated"
    ON safety_actions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ---- notifications ------------------------------------------

-- Users read their own notifications
CREATE POLICY "notifications: read own"
    ON notifications FOR SELECT
    USING (recipient_id = auth.uid());

-- Users can mark their own notifications read
CREATE POLICY "notifications: update own"
    ON notifications FOR UPDATE
    USING (recipient_id = auth.uid());
