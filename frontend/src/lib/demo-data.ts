// ============================================================
// SHIFTShield 2.0 — Static Demo Fixture Data
// Used when VITE_DEMO_MODE=true (no backend / Supabase required)
// All data is clearly labelled as simulated
// ============================================================

import type {
  Workplace, Worker, Task, Schedule, EnvironmentalReading,
  RiskAssessment, CoolingResource, EmergencyAlert, SafetyAction,
  Notification, DashboardOverview, WeatherCurrentResponse, AnalyticsData,
} from '@/types'

// ---- Workplace -----------------------------------------------

export const DEMO_WORKPLACE: Workplace = {
  id: 'wp-001',
  name: 'Riverside Construction Site',
  address: '45 Riverside Drive, Sydney NSW 2000',
  latitude: -33.8688,
  longitude: 151.2093,
  created_at: '2026-01-15T08:00:00Z',
}

// ---- Workers -------------------------------------------------

const WORKER_NAMES = [
  { full_name: 'Marcus Johnson', job_title: 'Formwork Carpenter' },
  { full_name: 'Priya Sharma', job_title: 'Site Labourer' },
  { full_name: 'Daniel Nguyen', job_title: 'Steel Fixer' },
  { full_name: 'Amara Okonkwo', job_title: 'Concreter' },
  { full_name: 'Ryan Fitzgerald', job_title: 'Crane Operator' },
  { full_name: 'Sophie Chen', job_title: 'Site Supervisor' },
  { full_name: 'Liam Torres', job_title: 'Excavator Operator' },
  { full_name: 'Fatima Al-Hassan', job_title: 'Safety Officer' },
  { full_name: 'Carlos Mendoza', job_title: 'Bricklayer' },
  { full_name: 'Yuki Nakamura', job_title: 'Plumber' },
  { full_name: 'James O\'Brien', job_title: 'Electrician' },
  { full_name: 'Asha Patel', job_title: 'Site Labourer' },
  { full_name: 'Tom Williams', job_title: 'Scaffolder' },
  { full_name: 'Nina Kowalski', job_title: 'Tiler' },
  { full_name: 'David Kim', job_title: 'Formwork Carpenter' },
  { full_name: 'Grace Adeyemi', job_title: 'Concreter' },
  { full_name: 'Ethan Brown', job_title: 'Steel Fixer' },
  { full_name: 'Maria Santos', job_title: 'Site Labourer' },
  { full_name: 'Ahmed Khalil', job_title: 'Bricklayer' },
  { full_name: 'Chloe Thompson', job_title: 'Scaffolder' },
]

export const DEMO_WORKERS: Worker[] = WORKER_NAMES.map((w, i) => ({
  id: `wk-${String(i + 1).padStart(3, '0')}`,
  workplace_id: 'wp-001',
  job_title: w.job_title,
  acclimatisation_days: [14, 7, 21, 3, 28, 14, 5, 21, 10, 14, 7, 3, 21, 14, 10, 5, 28, 7, 14, 21][i],
  status: i === 0 ? 'sos' : i < 3 ? 'attention' : i < 6 ? 'recovery' : 'safe',
  last_seen: new Date(Date.now() - (i + 1) * 5 * 60000).toISOString(),
  full_name: w.full_name,
  avatar_url: undefined,
}))

// ---- Tasks ---------------------------------------------------

export const DEMO_TASKS: Task[] = [
  {
    id: 'tk-001',
    workplace_id: 'wp-001',
    title: 'Formwork Installation — Level 3',
    description: 'Install formwork panels on the eastern face of Level 3.',
    workload: 'heavy',
    environment: 'outdoor_sun',
    duration_mins: 120,
    deadline: new Date(Date.now() + 4 * 3600000).toISOString(),
    assigned_to: 'wk-001',
    created_by: 'sup-001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tk-002',
    workplace_id: 'wp-001',
    title: 'Concrete Pour — Ground Slab',
    description: 'Pour and finish the ground floor slab in Zone B.',
    workload: 'very_heavy',
    environment: 'outdoor_sun',
    duration_mins: 180,
    deadline: new Date(Date.now() + 6 * 3600000).toISOString(),
    assigned_to: 'wk-004',
    created_by: 'sup-001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tk-003',
    workplace_id: 'wp-001',
    title: 'Rebar Tying — Column Foundations',
    description: 'Tie rebar cages for the northern column foundations.',
    workload: 'heavy',
    environment: 'outdoor_shade',
    duration_mins: 90,
    deadline: new Date(Date.now() + 5 * 3600000).toISOString(),
    assigned_to: 'wk-003',
    created_by: 'sup-001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tk-004',
    workplace_id: 'wp-001',
    title: 'Safety Inspection — Zone A',
    description: 'Conduct routine safety walkthrough of Zone A.',
    workload: 'light',
    environment: 'outdoor_shade',
    duration_mins: 45,
    deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
    assigned_to: 'wk-008',
    created_by: 'sup-001',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'tk-005',
    workplace_id: 'wp-001',
    title: 'Scaffolding Assembly — West Face',
    description: 'Erect scaffolding along the western face up to Level 2.',
    workload: 'heavy',
    environment: 'outdoor_sun',
    duration_mins: 150,
    deadline: new Date(Date.now() + 8 * 3600000).toISOString(),
    assigned_to: 'wk-013',
    created_by: 'sup-001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

// ---- Schedules -----------------------------------------------

const now = new Date()
const todayStr = now.toISOString().split('T')[0]

export const DEMO_SCHEDULES: Schedule[] = [
  {
    id: 'sc-001',
    task_id: 'tk-001',
    worker_id: 'wk-001',
    scheduled_start: `${todayStr}T07:00:00Z`,
    scheduled_end: `${todayStr}T09:00:00Z`,
    status: 'active',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    task: DEMO_TASKS[0],
    worker: DEMO_WORKERS[0],
  },
  {
    id: 'sc-002',
    task_id: 'tk-002',
    worker_id: 'wk-004',
    scheduled_start: `${todayStr}T06:30:00Z`,
    scheduled_end: `${todayStr}T09:30:00Z`,
    status: 'complete',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    task: DEMO_TASKS[1],
    worker: DEMO_WORKERS[3],
  },
  {
    id: 'sc-003',
    task_id: 'tk-003',
    worker_id: 'wk-003',
    scheduled_start: `${todayStr}T09:30:00Z`,
    scheduled_end: `${todayStr}T11:00:00Z`,
    status: 'pending',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    task: DEMO_TASKS[2],
    worker: DEMO_WORKERS[2],
  },
]

// ---- Environmental Readings ----------------------------------

export const DEMO_WEATHER: WeatherCurrentResponse = {
  temperature_c: 34.2,
  humidity_pct: 68,
  wind_speed_ms: 3.1,
  solar_radiation: 780,
  weather_code: 0,
  weather_description: 'Clear sky',
  source: 'demo_fallback',
  recorded_at: new Date().toISOString(),
  warning: undefined,
  hourly_forecast: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() + i * 3600000).toISOString(),
    temperature_c: 28 + Math.sin((i - 6) * Math.PI / 12) * 8,
    humidity_pct: 60 + Math.cos(i * Math.PI / 12) * 10,
  })),
}

export const DEMO_READING: EnvironmentalReading = {
  id: 'er-001',
  workplace_id: 'wp-001',
  source: 'demo_fallback',
  temperature_c: 34.2,
  humidity_pct: 68,
  wind_speed_ms: 3.1,
  solar_radiation: 780,
  weather_code: 0,
  recorded_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
}

// ---- Risk Assessment -----------------------------------------

export const DEMO_RISK_ASSESSMENT: RiskAssessment = {
  id: 'ra-001',
  workplace_id: 'wp-001',
  risk_level: 'elevated',
  workload: 'heavy',
  exposure_mins: 120,
  contributing_factors: [
    'High environmental temperature (34.2°C)',
    'Elevated relative humidity (68%)',
    'Direct sun exposure (outdoor, unshaded)',
    'Heavy physical workload',
    'Extended exposure duration (120 minutes)',
  ],
  recommendations: [
    'Review the planned outdoor work period and consider rescheduling the heaviest tasks to early morning (before 9:00 AM) or late afternoon (after 4:00 PM).',
    'Ensure mandatory recovery breaks every 30 minutes for workers on heavy outdoor tasks.',
    'Confirm drinking water access within 50 metres of all active work areas.',
    'Identify and use available shaded recovery areas during breaks.',
    'Monitor workers closely for signs of heat stress (dizziness, nausea, heavy sweating, confusion).',
    'Follow the site heat illness emergency response protocol if any symptoms are reported.',
  ],
  explanation: 'Current conditions present an elevated heat exposure concern. The combination of high ambient temperature (34.2°C), significant relative humidity (68%), direct sun exposure, and heavy physical workload creates conditions where heat stress risk is substantially higher than baseline. Workers without full acclimatisation are particularly vulnerable. The planned 120-minute task duration compounds cumulative heat load.',
  data_source: 'Simulated demo data — not from a live weather service',
  disclaimer: 'This assessment is an estimated heat exposure concern based on environmental and workload inputs. It is not a medically validated measurement (such as WBGT). It should be used as a decision-support tool alongside qualified occupational health guidance and your organisation\'s heat management policy.',
  assessed_at: new Date().toISOString(),
}

// ---- Cooling Resources ---------------------------------------

export const DEMO_RESOURCES: CoolingResource[] = [
  {
    id: 'cr-001',
    workplace_id: 'wp-001',
    name: 'Site Water Station A',
    category: 'water',
    latitude: -33.8681,
    longitude: 151.2088,
    address: 'Near Eastern Site Entrance',
    status: 'available',
    last_verified: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'cr-002',
    workplace_id: 'wp-001',
    name: 'Site Water Station B',
    category: 'water',
    latitude: -33.8695,
    longitude: 151.2098,
    address: 'Western Site Compound',
    status: 'available',
    last_verified: new Date(Date.now() - 1 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'cr-003',
    workplace_id: 'wp-001',
    name: 'Shaded Rest Area — Mess Tent',
    category: 'shade',
    latitude: -33.8692,
    longitude: 151.2085,
    address: 'Central Site, near Site Office',
    status: 'available',
    last_verified: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'cr-004',
    workplace_id: 'wp-001',
    name: 'Shaded Seating — North Boundary',
    category: 'shade',
    latitude: -33.8678,
    longitude: 151.2100,
    address: 'Northern boundary fence, near Gate 2',
    status: 'available',
    last_verified: new Date(Date.now() - 4 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'cr-005',
    workplace_id: 'wp-001',
    name: 'First Aid Station',
    category: 'first_aid',
    latitude: -33.8688,
    longitude: 151.2080,
    address: 'Site Office — Ground Floor',
    status: 'available',
    last_verified: new Date(Date.now() - 6 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'cr-006',
    workplace_id: 'wp-001',
    name: 'Water Cooler — Level 1',
    category: 'water',
    latitude: -33.8685,
    longitude: 151.2095,
    address: 'Level 1 stairwell landing',
    status: 'unverified',
    last_verified: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

// ---- Emergency Alerts ----------------------------------------

export const DEMO_ALERTS: EmergencyAlert[] = [
  {
    id: 'ea-001',
    worker_id: 'wk-001',
    workplace_id: 'wp-001',
    alert_type: 'sos',
    latitude: -33.8685,
    longitude: 151.2090,
    status: 'active',
    notes: 'Feeling dizzy and overheated. Cannot continue work.',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    worker: DEMO_WORKERS[0],
  },
  {
    id: 'ea-002',
    worker_id: 'wk-002',
    workplace_id: 'wp-001',
    alert_type: 'heat_stress',
    status: 'acknowledged',
    notes: 'Mild headache and heavy sweating.',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    acknowledged_at: new Date(Date.now() - 40 * 60000).toISOString(),
    worker: DEMO_WORKERS[1],
  },
  {
    id: 'ea-003',
    worker_id: 'wk-009',
    workplace_id: 'wp-001',
    alert_type: 'water_unavailable',
    status: 'resolved',
    notes: 'Water cooler on Level 1 is empty.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    acknowledged_at: new Date(Date.now() - 115 * 60000).toISOString(),
    resolved_at: new Date(Date.now() - 90 * 60000).toISOString(),
    worker: DEMO_WORKERS[8],
  },
]

// ---- Safety Actions ------------------------------------------

export const DEMO_SAFETY_ACTIONS: SafetyAction[] = [
  {
    id: 'sa-001',
    alert_id: 'ea-001',
    actor_id: 'wk-001',
    action_type: 'worker_sos',
    description: 'Worker Marcus Johnson activated SOS — Heat stress symptoms reported.',
    related_worker: 'wk-001',
    workplace_id: 'wp-001',
    status: 'open',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    actor_name: 'Marcus Johnson',
    worker_name: 'Marcus Johnson',
  },
  {
    id: 'sa-002',
    assessment_id: 'ra-001',
    actor_id: 'sup-001',
    action_type: 'risk_assessed',
    description: 'Risk assessment generated: Elevated heat exposure concern for current site conditions.',
    workplace_id: 'wp-001',
    status: 'in_progress',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    actor_name: 'Site Supervisor',
  },
  {
    id: 'sa-003',
    alert_id: 'ea-002',
    actor_id: 'sup-001',
    action_type: 'alert_acknowledged',
    description: 'Supervisor acknowledged heat stress alert for Priya Sharma. Recovery break assigned.',
    related_worker: 'wk-002',
    workplace_id: 'wp-001',
    status: 'in_progress',
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    actor_name: 'Site Supervisor',
    worker_name: 'Priya Sharma',
  },
  {
    id: 'sa-004',
    schedule_id: 'sc-001',
    actor_id: 'sup-001',
    action_type: 'schedule_changed',
    description: 'Schedule updated: Formwork Installation rescheduled to 07:00 to reduce peak heat exposure.',
    workplace_id: 'wp-001',
    status: 'resolved',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    actor_name: 'Site Supervisor',
  },
  {
    id: 'sa-005',
    alert_id: 'ea-003',
    actor_id: 'sup-001',
    action_type: 'action_resolved',
    description: 'Water cooler Level 1 refilled and confirmed operational.',
    related_worker: 'wk-009',
    workplace_id: 'wp-001',
    status: 'resolved',
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    actor_name: 'Site Supervisor',
    worker_name: 'Carlos Mendoza',
  },
]

// ---- Notifications -------------------------------------------

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-001',
    recipient_id: 'sup-001',
    type: 'sos',
    title: 'SOS Alert — Marcus Johnson',
    body: 'Worker has activated emergency assistance. Heat stress symptoms reported.',
    read: false,
    reference_id: 'ea-001',
    reference_type: 'emergency_alert',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 'n-002',
    recipient_id: 'sup-001',
    type: 'risk_alert',
    title: 'Elevated Heat Risk — Site Conditions',
    body: 'Current conditions have been assessed as Elevated risk. Review active outdoor tasks.',
    read: false,
    reference_id: 'ra-001',
    reference_type: 'risk_assessment',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'n-003',
    recipient_id: 'sup-001',
    type: 'schedule',
    title: 'Schedule Applied for Today',
    body: 'Optimised work schedule has been applied for all 20 workers.',
    read: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
]

// ---- Dashboard Overview --------------------------------------

export const DEMO_DASHBOARD: DashboardOverview = {
  total_active_workers: 20,
  site_risk_level: 'elevated',
  workers_requiring_attention: 4,
  pending_safety_actions: 2,
  completed_interventions_today: 3,
  workforce_status: {
    safe: 14,
    attention: 3,
    recovery: 2,
    sos: 1,
  },
  recent_alerts: DEMO_ALERTS,
  upcoming_tasks: DEMO_SCHEDULES.filter(s => s.status === 'pending'),
}

// ---- Analytics -----------------------------------------------

export const DEMO_ANALYTICS: AnalyticsData = {
  daily_risk_trend: Array.from({ length: 14 }, (_, i) => {
    const levels = ['low', 'low', 'moderate', 'moderate', 'elevated', 'elevated', 'high', 'elevated', 'moderate', 'elevated', 'elevated', 'high', 'elevated', 'elevated'] as const
    return {
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
      risk_level: levels[i],
      score: [20, 25, 45, 48, 65, 68, 82, 70, 42, 67, 70, 85, 72, 68][i],
    }
  }),
  workforce_distribution: [
    { status: 'safe', count: 14 },
    { status: 'attention', count: 3 },
    { status: 'recovery', count: 2 },
    { status: 'sos', count: 1 },
  ],
  task_exposure: [
    { workload: 'light', count: 8, avg_duration_mins: 45 },
    { workload: 'moderate', count: 12, avg_duration_mins: 75 },
    { workload: 'heavy', count: 15, avg_duration_mins: 110 },
    { workload: 'very_heavy', count: 5, avg_duration_mins: 150 },
  ],
  recovery_compliance: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
    compliance_pct: [82, 78, 85, 80, 72, 68, 75, 79, 83, 76, 70, 65, 72, 77][i],
  })),
  emergency_requests: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
    count: [0, 1, 0, 2, 1, 3, 2, 1, 0, 2, 3, 4, 2, 2][i],
  })),
  action_completion: [
    { action_type: 'risk_assessed', completed: 28, total: 28 },
    { action_type: 'alert_acknowledged', completed: 14, total: 16 },
    { action_type: 'response_initiated', completed: 12, total: 14 },
    { action_type: 'action_resolved', completed: 10, total: 14 },
    { action_type: 'schedule_changed', completed: 8, total: 8 },
  ],
}

// ---- Scenario Overrides --------------------------------------
// Applied when POST /api/demo/scenario is called

export const SCENARIO_OVERRIDES = {
  A: {
    label: 'Normal Conditions',
    description: 'Comfortable working temperature. Low heat risk. All workers safe.',
    weather: { temperature_c: 24, humidity_pct: 55, wind_speed_ms: 4.2, solar_radiation: 380, weather_code: 1, weather_description: 'Mainly clear' },
    risk_level: 'low' as const,
    workforce_status: { safe: 20, attention: 0, recovery: 0, sos: 0 },
    active_alerts: 0,
  },
  B: {
    label: 'Elevated Heat Exposure',
    description: 'High temperature and humidity. Elevated risk. Several workers need attention.',
    weather: { temperature_c: 38, humidity_pct: 75, wind_speed_ms: 1.8, solar_radiation: 920, weather_code: 0, weather_description: 'Clear sky — extreme heat' },
    risk_level: 'elevated' as const,
    workforce_status: { safe: 12, attention: 4, recovery: 3, sos: 1 },
    active_alerts: 2,
  },
  C: {
    label: 'Heavy Workload + Hot Conditions',
    description: 'Very heavy tasks during peak heat. High risk. Multiple workers require immediate recovery.',
    weather: { temperature_c: 36, humidity_pct: 70, wind_speed_ms: 2.0, solar_radiation: 860, weather_code: 0, weather_description: 'Clear sky — hot and humid' },
    risk_level: 'high' as const,
    workforce_status: { safe: 10, attention: 3, recovery: 5, sos: 2 },
    active_alerts: 3,
  },
  D: {
    label: 'Worker Emergency — SOS Active',
    description: 'A worker has activated an emergency SOS. Supervisor response required.',
    weather: { temperature_c: 34, humidity_pct: 65, wind_speed_ms: 2.5, solar_radiation: 720, weather_code: 0, weather_description: 'Clear sky' },
    risk_level: 'moderate' as const,
    workforce_status: { safe: 16, attention: 2, recovery: 1, sos: 1 },
    active_alerts: 1,
  },
}
