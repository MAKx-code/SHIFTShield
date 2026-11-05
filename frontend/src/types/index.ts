// ============================================================
// SHIFTShield 2.0 — Shared TypeScript Types
// ============================================================

// ---- Enums / Union Types -----------------------------------

export type UserRole = 'supervisor' | 'worker'

export type WorkerStatus = 'safe' | 'attention' | 'recovery' | 'sos'

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high'

export type Workload = 'light' | 'moderate' | 'heavy' | 'very_heavy'

export type Environment = 'outdoor_sun' | 'outdoor_shade' | 'indoor'

export type WeatherSource = 'open_meteo' | 'cached' | 'demo_fallback' | 'manual' | 'sensor'

export type ScheduleStatus = 'pending' | 'active' | 'complete' | 'skipped'

export type AlertType = 'sos' | 'heat_stress' | 'injury' | 'water_unavailable' | 'shade_unavailable'

export type AlertStatus = 'active' | 'acknowledged' | 'responding' | 'resolved'

export type ResourceCategory = 'water' | 'shade' | 'first_aid'

export type ResourceStatus = 'available' | 'unavailable' | 'unverified'

export type ActionType =
  | 'risk_assessed'
  | 'alert_created'
  | 'alert_acknowledged'
  | 'schedule_changed'
  | 'worker_sos'
  | 'response_initiated'
  | 'action_resolved'
  | 'resource_reported'

export type ActionStatus = 'open' | 'in_progress' | 'resolved'

export type DemoScenario = 'A' | 'B' | 'C' | 'D'

// ---- Entities ----------------------------------------------

export interface Workplace {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  workplace_id: string
  avatar_url?: string
  created_at: string
}

export interface Worker {
  id: string
  workplace_id: string
  job_title: string
  acclimatisation_days: number
  status: WorkerStatus
  last_seen: string
  // Joined from profiles
  full_name: string
  avatar_url?: string
}

export interface Task {
  id: string
  workplace_id: string
  title: string
  description?: string
  workload: Workload
  environment: Environment
  duration_mins: number
  deadline?: string
  assigned_to?: string
  created_by: string
  created_at: string
}

export interface Schedule {
  id: string
  task_id: string
  worker_id: string
  scheduled_start: string
  scheduled_end: string
  status: ScheduleStatus
  notes?: string
  created_at: string
  // Joined
  task?: Task
  worker?: Worker
}

export interface EnvironmentalReading {
  id: string
  workplace_id: string
  source: WeatherSource
  temperature_c: number
  humidity_pct: number
  wind_speed_ms: number
  solar_radiation: number
  weather_code: number
  recorded_at: string
  created_at: string
}

export interface RiskAssessment {
  id: string
  workplace_id: string
  reading_id?: string
  risk_level: RiskLevel
  workload: Workload
  exposure_mins: number
  contributing_factors: string[]
  recommendations: string[]
  explanation: string
  data_source: string
  disclaimer?: string
  assessed_at: string
}

export interface CoolingResource {
  id: string
  workplace_id: string
  name: string
  category: ResourceCategory
  latitude: number
  longitude: number
  address?: string
  status: ResourceStatus
  last_verified?: string
  added_by?: string
  created_at: string
}

export interface EmergencyAlert {
  id: string
  worker_id: string
  workplace_id: string
  alert_type: AlertType
  latitude?: number
  longitude?: number
  status: AlertStatus
  notes?: string
  created_at: string
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  // Joined
  worker?: Worker
}

export interface SafetyAction {
  id: string
  alert_id?: string
  assessment_id?: string
  schedule_id?: string
  actor_id: string
  action_type: ActionType
  description: string
  related_worker?: string
  workplace_id: string
  status: ActionStatus
  created_at: string
  // Joined
  actor_name?: string
  worker_name?: string
}

export interface Notification {
  id: string
  recipient_id: string
  type: 'risk_alert' | 'sos' | 'schedule' | 'system'
  title: string
  body: string
  read: boolean
  reference_id?: string
  reference_type?: string
  created_at: string
}

// ---- API Request / Response Types ---------------------------

export interface WeatherCurrentResponse {
  temperature_c: number
  humidity_pct: number
  wind_speed_ms: number
  solar_radiation: number
  weather_code: number
  weather_description: string
  source: WeatherSource
  recorded_at: string
  warning?: string
  hourly_forecast?: HourlyForecast[]
}

export interface HourlyForecast {
  time: string
  temperature_c: number
  humidity_pct: number
}

export interface RiskAssessRequest {
  temperature: number
  humidity: number
  workload: Workload
  duration_mins: number
  environment: Environment
  acclimatisation_days?: number
  workplace_id?: string
}

export interface RiskAssessResponse extends RiskAssessment {}

export interface ScheduleGenerateRequest {
  tasks: Task[]
  date: string
  workplace_id: string
}

export interface ScheduleGenerateResponse {
  schedule: ScheduledSlot[]
  conflicts: ScheduleConflict[]
  explanation: string
}

export interface ScheduledSlot {
  task_id: string
  worker_id: string
  scheduled_start: string
  scheduled_end: string
  is_recovery: boolean
  explanation?: string
  task?: Task
  worker?: Worker
}

export interface ScheduleConflict {
  type: 'safety_override_required' | 'deadline_miss' | 'overlap' | 'insufficient_recovery'
  description: string
  task_id?: string
  worker_id?: string
}

export interface DashboardOverview {
  total_active_workers: number
  site_risk_level: RiskLevel
  workers_requiring_attention: number
  pending_safety_actions: number
  completed_interventions_today: number
  workforce_status: {
    safe: number
    attention: number
    recovery: number
    sos: number
  }
  recent_alerts: EmergencyAlert[]
  upcoming_tasks: Schedule[]
}

export interface AnalyticsData {
  daily_risk_trend: { date: string; risk_level: RiskLevel; score: number }[]
  workforce_distribution: { status: WorkerStatus; count: number }[]
  task_exposure: { workload: Workload; count: number; avg_duration_mins: number }[]
  recovery_compliance: { date: string; compliance_pct: number }[]
  emergency_requests: { date: string; count: number }[]
  action_completion: { action_type: ActionType; completed: number; total: number }[]
}

// ---- Utility Types ------------------------------------------

export interface ApiError {
  detail: string
  code: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
