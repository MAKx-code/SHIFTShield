// ============================================================
// SHIFTShield 2.0 — API Client
// Axios instance with demo-mode bypass
// In demo mode, returns fixture data instead of HTTP calls
// ============================================================

import axios from 'axios'
import type {
  DashboardOverview, WeatherCurrentResponse, RiskAssessRequest, RiskAssessResponse,
  Worker, Task, Schedule, ScheduleGenerateRequest, ScheduleGenerateResponse,
  CoolingResource, EmergencyAlert, SafetyAction, Notification, AnalyticsData,
  DemoScenario, RiskAssessment,
} from '@/types'
import {
  DEMO_DASHBOARD, DEMO_WEATHER, DEMO_WORKERS, DEMO_TASKS, DEMO_SCHEDULES,
  DEMO_RESOURCES, DEMO_ALERTS, DEMO_SAFETY_ACTIONS, DEMO_NOTIFICATIONS,
  DEMO_ANALYTICS, DEMO_RISK_ASSESSMENT, SCENARIO_OVERRIDES, DEMO_WORKPLACE,
} from './demo-data'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// --- Axios instance -------------------------------------------

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Attach Supabase JWT to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Get token from localStorage (set by auth store)
    const token = localStorage.getItem('shiftshield_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('shiftshield_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// --- Demo delay helper ----------------------------------------
const demoDelay = (ms = 400) => new Promise<void>(resolve => setTimeout(resolve, ms))

// --- Tracked demo state (scenario overrides) -----------------
let _currentScenario: DemoScenario | null = null

// ---- Dashboard -----------------------------------------------

export const api = {
  // Dashboard
  dashboard: {
    overview: async (): Promise<DashboardOverview> => {
      if (isDemoMode) {
        await demoDelay()
        if (_currentScenario) {
          const override = SCENARIO_OVERRIDES[_currentScenario]
          return {
            ...DEMO_DASHBOARD,
            site_risk_level: override.risk_level,
            workforce_status: override.workforce_status,
            workers_requiring_attention: Object.entries(override.workforce_status)
              .filter(([k]) => k !== 'safe')
              .reduce((sum, [, v]) => sum + v, 0),
          }
        }
        return DEMO_DASHBOARD
      }
      const res = await apiClient.get<DashboardOverview>('/dashboard/overview')
      return res.data
    },
  },

  // Weather
  weather: {
    current: async (lat?: number, lng?: number): Promise<WeatherCurrentResponse> => {
      if (isDemoMode) {
        await demoDelay(300)
        if (_currentScenario) {
          const override = SCENARIO_OVERRIDES[_currentScenario]
          return { ...DEMO_WEATHER, ...override.weather, source: 'demo_fallback' }
        }
        return DEMO_WEATHER
      }
      const params = lat && lng ? { lat, lng } : {}
      const res = await apiClient.get<WeatherCurrentResponse>('/weather/current', { params })
      return res.data
    },
  },

  // Risk
  risk: {
    assess: async (data: RiskAssessRequest): Promise<RiskAssessResponse> => {
      if (isDemoMode) {
        await demoDelay(600)
        return { ...DEMO_RISK_ASSESSMENT, workload: data.workload, exposure_mins: data.duration_mins }
      }
      const res = await apiClient.post<RiskAssessResponse>('/risk/assess', data)
      return res.data
    },
    history: async (): Promise<RiskAssessment[]> => {
      if (isDemoMode) {
        await demoDelay()
        return [DEMO_RISK_ASSESSMENT]
      }
      const res = await apiClient.get<RiskAssessment[]>('/risk/history')
      return res.data
    },
  },

  // Workers
  workers: {
    list: async (): Promise<Worker[]> => {
      if (isDemoMode) {
        await demoDelay()
        if (_currentScenario) {
          const override = SCENARIO_OVERRIDES[_currentScenario]
          const { safe, attention, recovery, sos } = override.workforce_status
          return DEMO_WORKERS.map((w, i) => ({
            ...w,
            status: i < sos ? 'sos' : i < sos + attention ? 'attention' : i < sos + attention + recovery ? 'recovery' : 'safe',
          }))
        }
        return DEMO_WORKERS
      }
      const res = await apiClient.get<Worker[]>('/workers')
      return res.data
    },
    get: async (id: string): Promise<Worker> => {
      if (isDemoMode) {
        await demoDelay(200)
        return DEMO_WORKERS.find(w => w.id === id) || DEMO_WORKERS[0]
      }
      const res = await apiClient.get<Worker>(`/workers/${id}`)
      return res.data
    },
    updateStatus: async (id: string, status: Worker['status']): Promise<Worker> => {
      if (isDemoMode) {
        await demoDelay(300)
        const w = DEMO_WORKERS.find(w => w.id === id)
        return { ...(w || DEMO_WORKERS[0]), status }
      }
      const res = await apiClient.patch<Worker>(`/workers/${id}/status`, { status })
      return res.data
    },
  },

  // Tasks
  tasks: {
    list: async (): Promise<Task[]> => {
      if (isDemoMode) { await demoDelay(); return DEMO_TASKS }
      const res = await apiClient.get<Task[]>('/tasks')
      return res.data
    },
    create: async (data: Omit<Task, 'id' | 'created_at' | 'created_by'>): Promise<Task> => {
      if (isDemoMode) {
        await demoDelay(400)
        return { ...data, id: `tk-${Date.now()}`, created_by: 'sup-001', created_at: new Date().toISOString() }
      }
      const res = await apiClient.post<Task>('/tasks', data)
      return res.data
    },
    update: async (id: string, data: Partial<Task>): Promise<Task> => {
      if (isDemoMode) {
        await demoDelay(300)
        return { ...(DEMO_TASKS.find(t => t.id === id) || DEMO_TASKS[0]), ...data }
      }
      const res = await apiClient.patch<Task>(`/tasks/${id}`, data)
      return res.data
    },
    delete: async (id: string): Promise<void> => {
      if (isDemoMode) { await demoDelay(200); return }
      await apiClient.delete(`/tasks/${id}`)
    },
  },

  // Schedules
  schedules: {
    list: async (date?: string): Promise<Schedule[]> => {
      if (isDemoMode) {
        await demoDelay()
        return DEMO_SCHEDULES
      }
      const params = date ? { date } : {}
      const res = await apiClient.get<Schedule[]>('/schedules', { params })
      return res.data
    },
    generate: async (data: ScheduleGenerateRequest): Promise<ScheduleGenerateResponse> => {
      if (isDemoMode) {
        await demoDelay(800)
        return {
          schedule: DEMO_SCHEDULES.map(s => ({
            task_id: s.task_id,
            worker_id: s.worker_id,
            scheduled_start: s.scheduled_start,
            scheduled_end: s.scheduled_end,
            is_recovery: false,
            task: s.task,
            worker: s.worker,
          })),
          conflicts: [],
          explanation: 'Schedule optimised: Heavy outdoor tasks assigned to early morning slots to minimise heat exposure. Recovery breaks of 15 minutes inserted every 45 minutes for outdoor workers. All tasks assigned within deadline constraints.',
        }
      }
      const res = await apiClient.post<ScheduleGenerateResponse>('/scheduler/generate', data)
      return res.data
    },
    apply: async (schedule: ScheduleGenerateRequest & { schedule: ScheduleGenerateResponse['schedule'] }): Promise<void> => {
      if (isDemoMode) { await demoDelay(500); return }
      await apiClient.post('/scheduler/apply', schedule)
    },
    update: async (id: string, data: Partial<Schedule>): Promise<Schedule> => {
      if (isDemoMode) {
        await demoDelay(300)
        return { ...(DEMO_SCHEDULES.find(s => s.id === id) || DEMO_SCHEDULES[0]), ...data }
      }
      const res = await apiClient.patch<Schedule>(`/schedules/${id}`, data)
      return res.data
    },
  },

  // Resources
  resources: {
    list: async (category?: string): Promise<CoolingResource[]> => {
      if (isDemoMode) {
        await demoDelay()
        return category ? DEMO_RESOURCES.filter(r => r.category === category) : DEMO_RESOURCES
      }
      const params = category ? { category } : {}
      const res = await apiClient.get<CoolingResource[]>('/resources', { params })
      return res.data
    },
    create: async (data: Omit<CoolingResource, 'id' | 'created_at'>): Promise<CoolingResource> => {
      if (isDemoMode) {
        await demoDelay(400)
        return { ...data, id: `cr-${Date.now()}`, created_at: new Date().toISOString() }
      }
      const res = await apiClient.post<CoolingResource>('/resources', data)
      return res.data
    },
    update: async (id: string, data: Partial<CoolingResource>): Promise<CoolingResource> => {
      if (isDemoMode) {
        await demoDelay(300)
        return { ...(DEMO_RESOURCES.find(r => r.id === id) || DEMO_RESOURCES[0]), ...data }
      }
      const res = await apiClient.patch<CoolingResource>(`/resources/${id}`, data)
      return res.data
    },
    delete: async (id: string): Promise<void> => {
      if (isDemoMode) { await demoDelay(200); return }
      await apiClient.delete(`/resources/${id}`)
    },
  },

  // Emergency
  emergency: {
    list: async (): Promise<EmergencyAlert[]> => {
      if (isDemoMode) {
        await demoDelay()
        if (_currentScenario) {
          const override = SCENARIO_OVERRIDES[_currentScenario]
          return DEMO_ALERTS.slice(0, override.active_alerts)
        }
        return DEMO_ALERTS
      }
      const res = await apiClient.get<EmergencyAlert[]>('/emergency')
      return res.data
    },
    create: async (data: { alert_type: EmergencyAlert['alert_type']; notes?: string; latitude?: number; longitude?: number }): Promise<EmergencyAlert> => {
      if (isDemoMode) {
        await demoDelay(500)
        return {
          id: `ea-${Date.now()}`,
          worker_id: 'wk-demo',
          workplace_id: 'wp-001',
          status: 'active',
          created_at: new Date().toISOString(),
          ...data,
        }
      }
      const res = await apiClient.post<EmergencyAlert>('/emergency', data)
      return res.data
    },
    acknowledge: async (id: string): Promise<EmergencyAlert> => {
      if (isDemoMode) {
        await demoDelay(400)
        const alert = DEMO_ALERTS.find(a => a.id === id) || DEMO_ALERTS[0]
        return { ...alert, status: 'acknowledged', acknowledged_at: new Date().toISOString() }
      }
      const res = await apiClient.patch<EmergencyAlert>(`/emergency/${id}/acknowledge`)
      return res.data
    },
    respond: async (id: string, responder?: string): Promise<EmergencyAlert> => {
      if (isDemoMode) {
        await demoDelay(400)
        const alert = DEMO_ALERTS.find(a => a.id === id) || DEMO_ALERTS[0]
        return { ...alert, status: 'responding', notes: responder ? `Responder: ${responder}` : alert.notes }
      }
      const res = await apiClient.patch<EmergencyAlert>(`/emergency/${id}/respond`, { responder })
      return res.data
    },
    resolve: async (id: string): Promise<EmergencyAlert> => {
      if (isDemoMode) {
        await demoDelay(400)
        const alert = DEMO_ALERTS.find(a => a.id === id) || DEMO_ALERTS[0]
        return { ...alert, status: 'resolved', resolved_at: new Date().toISOString() }
      }
      const res = await apiClient.patch<EmergencyAlert>(`/emergency/${id}/resolve`)
      return res.data
    },
  },

  // Safety / Audit
  safety: {
    auditLog: async (params?: { action_type?: string; status?: string; search?: string; page?: number }): Promise<SafetyAction[]> => {
      if (isDemoMode) { await demoDelay(); return DEMO_SAFETY_ACTIONS }
      const res = await apiClient.get<SafetyAction[]>('/audit-log', { params })
      return res.data
    },
  },

  // Notifications
  notifications: {
    list: async (): Promise<Notification[]> => {
      if (isDemoMode) { await demoDelay(200); return DEMO_NOTIFICATIONS }
      const res = await apiClient.get<Notification[]>('/notifications')
      return res.data
    },
    markRead: async (id: string): Promise<void> => {
      if (isDemoMode) { await demoDelay(100); return }
      await apiClient.patch(`/notifications/${id}/read`)
    },
  },

  // Analytics
  analytics: {
    getData: async (params?: { date_from?: string; date_to?: string }): Promise<AnalyticsData> => {
      if (isDemoMode) { await demoDelay(500); return DEMO_ANALYTICS }
      const res = await apiClient.get<AnalyticsData>('/analytics', { params })
      return res.data
    },
    exportCsv: async (): Promise<Blob> => {
      if (isDemoMode) {
        await demoDelay(800)
        const csv = `Date,Risk Level,Temperature,Humidity,Active Workers,Emergencies\n${
          DEMO_ANALYTICS.daily_risk_trend.map(d =>
            `${d.date},${d.risk_level},34.2,68,20,${DEMO_ANALYTICS.emergency_requests.find(e => e.date === d.date)?.count || 0}`
          ).join('\n')
        }`
        return new Blob([csv], { type: 'text/csv' })
      }
      const res = await apiClient.get('/analytics/export', { responseType: 'blob' })
      return res.data
    },
  },

  // Demo controls
  demo: {
    reset: async (): Promise<void> => {
      _currentScenario = null
      if (isDemoMode) { await demoDelay(600); return }
      await apiClient.post('/demo/reset')
    },
    setScenario: async (scenario: DemoScenario): Promise<void> => {
      _currentScenario = scenario
      if (isDemoMode) { await demoDelay(300); return }
      await apiClient.post('/demo/scenario', { scenario })
    },
    getCurrentScenario: () => _currentScenario,
    getWorkplace: async () => {
      if (isDemoMode) { await demoDelay(200); return DEMO_WORKPLACE }
      const res = await apiClient.get('/workplaces/current')
      return res.data
    },
  },
}

export default api
