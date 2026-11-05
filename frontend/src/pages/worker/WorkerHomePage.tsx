// ============================================================
// SHIFTShield 2.0 — Worker Home Page (Mobile)
// Sub-Task 6 — Full Implementation
//
// Worker's daily overview:
// - Welcome message
// - Today's work schedule
// - Current site safety status
// - Next recovery break
// - Nearby water and shade (top 3)
// - Safety announcements
// ============================================================

import { useQuery } from '@tanstack/react-query'
import {
  Sun, Clock, Droplets, Trees, Bell,
  CheckCircle, ChevronRight, Activity
} from 'lucide-react'
import { clsx } from 'clsx'
import { Badge, RiskBadge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { format, parseISO } from 'date-fns'
import type { RiskLevel } from '@/types'
import { useNavigate } from 'react-router-dom'

// ---- Risk level visual config ------------------------------
const RISK_BG: Record<RiskLevel, string> = {
  low:      'from-success/10 to-success/5 border-success/20',
  moderate: 'from-warning/10 to-warning/5 border-warning/20',
  elevated: 'from-orange-500/10 to-orange-500/5 border-orange-300',
  high:     'from-critical/10 to-critical/5 border-critical/20',
}

const RISK_ICON_BG: Record<RiskLevel, string> = {
  low:      'bg-success text-white',
  moderate: 'bg-warning text-white',
  elevated: 'bg-orange-500 text-white',
  high:     'bg-critical text-white',
}

// ============================================================
// Main Component
// ============================================================

export default function WorkerHomePage() {
  const { profile: user } = useAuthStore()
  const navigate  = useNavigate()
  const today     = new Date()
  const todayStr  = today.toISOString().split('T')[0]
  const hourNow   = today.getHours()

  const greeting = hourNow < 12 ? 'Good morning' : hourNow < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.full_name?.split(' ')[0] || 'there'

  // ---- Fetch dashboard ---------------------------------------
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.overview(),
    refetchInterval: 60000,
  })

  // ---- Fetch weather ------------------------------------------
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather-current'],
    queryFn: () => api.weather.current(),
    refetchInterval: 300000,
  })

  // ---- Fetch today's schedules --------------------------------
  const { data: schedules = [], isLoading: schedLoading } = useQuery({
    queryKey: ['schedules', todayStr],
    queryFn: () => api.schedules.list(todayStr),
    refetchInterval: 120000,
  })

  // ---- Fetch nearby resources --------------------------------
  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.resources.list(),
  })

  // ---- Fetch notifications -----------------------------------
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  })

  const riskLevel = dashboard?.site_risk_level || 'low'
  const nearbyWater = resources.filter(r => r.category === 'water' && r.status === 'available').slice(0, 2)
  const nearbyShade = resources.filter(r => r.category === 'shade' && r.status === 'available').slice(0, 2)
  const unreadNotifs = notifications.filter(n => !n.read)
  const todaySchedule = schedules.slice(0, 4)

  return (
    <div className="space-y-4 pb-4">
      {/* Welcome banner */}
      <div className={clsx(
        'mx-4 mt-4 rounded-2xl p-5 bg-gradient-to-br border',
        RISK_BG[riskLevel]
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-secondary">{format(today, 'EEEE d MMMM')}</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{greeting}, {firstName}</h2>
            <p className="text-sm text-secondary mt-1">Stay safe and hydrated today.</p>
          </div>
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', RISK_ICON_BG[riskLevel])}>
            <Activity size={22} />
          </div>
        </div>

        {/* Site risk pill */}
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-secondary">Site risk level:</p>
          <RiskBadge level={riskLevel} />
          {isDemoMode && <SimulatedDataBadge />}
        </div>
      </div>

      {/* Weather strip */}
      {!weatherLoading && weather && (
        <div className="mx-4 bg-white rounded-2xl shadow-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
            <Sun size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-secondary">{weather.weather_description}</p>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="text-xl font-bold text-gray-900">{weather.temperature_c.toFixed(1)}°C</span>
              <span className="text-sm text-secondary"><Droplets size={12} className="inline" /> {weather.humidity_pct}%</span>
            </div>
          </div>
          {weather.source === 'demo_fallback' && (
            <Badge variant="outline" size="sm" className="text-xs flex-shrink-0">Simulated</Badge>
          )}
        </div>
      )}
      {weatherLoading && <div className="mx-4"><Skeleton className="h-16 rounded-2xl" /></div>}

      {/* Notifications */}
      {unreadNotifs.length > 0 && (
        <div className="mx-4">
          <div className="bg-warning-light border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
            <Bell size={18} className="text-warning-dark flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning-dark">
                {unreadNotifs.length} new announcement{unreadNotifs.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-warning-dark/80 mt-0.5 line-clamp-2">
                {unreadNotifs[0]?.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's schedule */}
      <div className="mx-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Today's Schedule</h3>
          <button
            className="text-xs text-accent font-medium"
            onClick={() => navigate('/worker/tasks')}
          >
            View all
          </button>
        </div>

        {schedLoading ? (
          <div className="space-y-2">
            {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : todaySchedule.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-4 text-center">
            <p className="text-sm text-secondary">No tasks scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySchedule.map(schedule => (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {schedule.task?.title || 'Assigned Task'}
                  </p>
                  <p className="text-xs text-secondary">
                    {format(parseISO(schedule.scheduled_start), 'HH:mm')} – {format(parseISO(schedule.scheduled_end), 'HH:mm')}
                    {schedule.task?.workload && ` · ${schedule.task.workload.replace('_', ' ')}`}
                  </p>
                </div>
                <Badge
                  variant={schedule.status === 'complete' ? 'success' : schedule.status === 'active' ? 'info' : 'default'}
                  size="sm"
                >
                  {schedule.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next recovery break */}
      <div className="mx-4">
        <div className="bg-accent-50 border border-accent/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Clock size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-accent font-semibold uppercase tracking-wide">Next Recovery Break</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">Approx. every 45 min of outdoor work</p>
            <p className="text-xs text-secondary mt-0.5">Minimum 15 min in shade with water</p>
          </div>
        </div>
      </div>

      {/* Nearby resources */}
      <div className="mx-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Nearby Recovery Resources</h3>
        {[...nearbyWater, ...nearbyShade].length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-4 text-center">
            <p className="text-sm text-secondary">No verified resources nearby.</p>
          </div>
        ) : (
          [...nearbyWater, ...nearbyShade].map(resource => (
            <button
              key={resource.id}
              className="w-full bg-white rounded-2xl shadow-card p-3.5 flex items-center gap-3 text-left"
              onClick={() => navigate('/worker/map')}
            >
              <div className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                resource.category === 'water' ? 'bg-accent-50 text-accent' : 'bg-success-light text-success-dark'
              )}>
                {resource.category === 'water' ? <Droplets size={16} /> : <Trees size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
                <p className="text-xs text-secondary truncate">{resource.address || resource.category}</p>
              </div>
              <ChevronRight size={15} className="text-secondary flex-shrink-0" />
            </button>
          ))
        )}
        <button
          className="w-full text-xs text-accent font-medium py-2"
          onClick={() => navigate('/worker/map')}
        >
          View full map →
        </button>
      </div>

      {/* Safety tip */}
      <div className="mx-4 mb-2">
        <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-success">
          <div className="flex items-start gap-2">
            <CheckCircle size={15} className="text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Safety Reminder</p>
              <p className="text-xs text-secondary mt-0.5">
                Drink water regularly even if you don't feel thirsty. Report any heat symptoms (dizziness, nausea, headache) to your supervisor immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
