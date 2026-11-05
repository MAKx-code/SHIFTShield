// ============================================================
// SHIFTShield 2.0 — Overview Dashboard (Supervisor)
// Full implementation in Sub-Task 4
// Placeholder: functional skeleton that routes and loads
// ============================================================

import { useQuery } from '@tanstack/react-query'
import {
  Users, Activity, AlertTriangle, CheckCircle, TrendingUp,
  Thermometer, Droplets, Wind, Eye, RefreshCw
} from 'lucide-react'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge, RiskBadge, WorkerStatusBadge, SimulatedDataBadge } from '@/components/ui/Badge'
import { KpiCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { format } from 'date-fns'
import type { RiskLevel } from '@/types'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#16A36A',
  moderate: '#F2A93B',
  elevated: '#F97316',
  high: '#DC4545',
}

const STATUS_COLORS = {
  safe: '#16A36A',
  attention: '#F2A93B',
  recovery: '#12B8A6',
  sos: '#DC4545',
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 61: 'Light rain',
  71: 'Light snow', 80: 'Rain showers', 95: 'Thunderstorm',
}

export default function OverviewPage() {
  const { data: overview, isLoading: ovLoading, error: ovError, refetch: refetchOv } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.dashboard.overview(),
    refetchInterval: 60000,
  })

  const { data: weather, isLoading: wxLoading, refetch: refetchWx } = useQuery({
    queryKey: ['weather-current'],
    queryFn: () => api.weather.current(),
    refetchInterval: 300000,
  })

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.analytics.getData(),
  })

  if (ovError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description="Could not retrieve overview data."
        onRetry={() => refetchOv()}
      />
    )
  }

  const donutData = overview ? [
    { name: 'Safe', value: overview.workforce_status.safe, color: STATUS_COLORS.safe },
    { name: 'Attention', value: overview.workforce_status.attention, color: STATUS_COLORS.attention },
    { name: 'Recovery', value: overview.workforce_status.recovery, color: STATUS_COLORS.recovery },
    { name: 'SOS', value: overview.workforce_status.sos, color: STATUS_COLORS.sos },
  ] : []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site Overview</h1>
          <p className="text-sm text-secondary mt-0.5">Riverside Construction Site — Real-time safety dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <SimulatedDataBadge />
          <button
            onClick={() => { refetchOv(); refetchWx() }}
            className="p-2 rounded-lg hover:bg-gray-100 text-secondary transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {ovLoading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : overview ? (
          <>
            <KpiCard
              title="Active Workers"
              value={overview.total_active_workers}
              icon={<Users size={18} />}
              variant="default"
            />
            <KpiCard
              title="Site Risk Level"
              value={overview.site_risk_level.charAt(0).toUpperCase() + overview.site_risk_level.slice(1)}
              icon={<Activity size={18} />}
              variant={
                overview.site_risk_level === 'high' ? 'critical' :
                overview.site_risk_level === 'elevated' ? 'warning' :
                overview.site_risk_level === 'moderate' ? 'warning' : 'success'
              }
            />
            <KpiCard
              title="Needs Attention"
              value={overview.workers_requiring_attention}
              icon={<AlertTriangle size={18} />}
              variant={overview.workers_requiring_attention > 0 ? 'warning' : 'success'}
            />
            <KpiCard
              title="Pending Actions"
              value={overview.pending_safety_actions}
              icon={<TrendingUp size={18} />}
              variant={overview.pending_safety_actions > 0 ? 'critical' : 'success'}
            />
            <KpiCard
              title="Resolved Today"
              value={overview.completed_interventions_today}
              icon={<CheckCircle size={18} />}
              variant="success"
            />
          </>
        ) : null}
      </div>

      {/* Live Conditions + Workforce Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live conditions */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Live Site Conditions</h2>
                <p className="text-xs text-secondary mt-0.5">Environmental data for risk assessment</p>
              </div>
              {weather && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {weather.source !== 'open_meteo' && (
                    <Badge variant="outline" size="sm">⚠ {weather.source === 'demo_fallback' ? 'Demo Data' : 'Cached'}</Badge>
                  )}
                  <p className="text-xs text-secondary">
                    Updated {format(new Date(weather.recorded_at), 'HH:mm')}
                  </p>
                </div>
              )}
            </div>

            {wxLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton variant="text" className="h-3 w-16" />
                    <Skeleton variant="text" className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : weather ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <WeatherMetric
                    icon={<Thermometer size={20} />}
                    label="Temperature"
                    value={`${weather.temperature_c.toFixed(1)}°C`}
                    color="text-critical"
                    bg="bg-critical-light"
                  />
                  <WeatherMetric
                    icon={<Droplets size={20} />}
                    label="Humidity"
                    value={`${weather.humidity_pct}%`}
                    color="text-accent-700"
                    bg="bg-accent-50"
                  />
                  <WeatherMetric
                    icon={<Wind size={20} />}
                    label="Wind Speed"
                    value={`${weather.wind_speed_ms.toFixed(1)} m/s`}
                    color="text-secondary"
                    bg="bg-gray-100"
                  />
                  <WeatherMetric
                    icon={<Eye size={20} />}
                    label="Conditions"
                    value={WEATHER_CODES[weather.weather_code] || 'Clear'}
                    color="text-primary"
                    bg="bg-primary/10"
                  />
                </div>

                {weather.warning && (
                  <InfoBanner
                    variant="warning"
                    message={weather.warning}
                    className="mt-4"
                  />
                )}

                {/* Hourly forecast chart */}
                {weather.hourly_forecast && weather.hourly_forecast.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-secondary mb-2">24-Hour Temperature Forecast</p>
                    <ResponsiveContainer width="100%" height={90}>
                      <BarChart data={weather.hourly_forecast.slice(0, 24)} barSize={8}>
                        <XAxis
                          dataKey="time"
                          tickFormatter={t => format(new Date(t), 'HH')}
                          tick={{ fontSize: 10, fill: '#526579' }}
                          axisLine={false}
                          tickLine={false}
                          interval={3}
                        />
                        <Tooltip
                          formatter={(v: number) => [`${v.toFixed(1)}°C`, 'Temp']}
                          labelFormatter={t => format(new Date(t as string), 'HH:mm')}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        />
                        <Bar
                          dataKey="temperature_c"
                          fill="#DC4545"
                          opacity={0.75}
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : null}
          </Card>
        </div>

        {/* Workforce status donut */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Workforce Status</h2>
          {ovLoading ? (
            <div className="flex items-center justify-center h-40">
              <Skeleton className="w-32 h-32 rounded-full" variant="circle" />
            </div>
          ) : donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Workers']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-secondary">{d.name}</span>
                    <span className="text-xs font-semibold text-gray-900 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </Card>
      </div>

      {/* Risk Trend + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk trend */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">14-Day Risk Trend</h2>
            {analytics ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={analytics.daily_risk_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => format(new Date(d), 'dd/MM')}
                    tick={{ fontSize: 11, fill: '#526579' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#526579' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    formatter={(v) => [`${v}/100`, 'Risk Score']}
                    labelFormatter={d => format(new Date(d as string), 'dd MMM')}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#DC4545"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#DC4545' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-36 w-full" />
            )}
          </Card>
        </div>

        {/* Recent alerts */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Alerts</h2>
          {ovLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" variant="circle" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton variant="text" className="h-3 w-32" />
                    <Skeleton variant="text" className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : overview?.recent_alerts?.length ? (
            <div className="space-y-3">
              {overview.recent_alerts.slice(0, 4).map(alert => (
                <div key={alert.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.status === 'active' ? 'bg-critical' :
                    alert.status === 'acknowledged' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {alert.worker?.full_name || 'Unknown worker'}
                    </p>
                    <p className="text-xs text-secondary">
                      {alert.alert_type.replace('_', ' ')} · {format(new Date(alert.created_at), 'HH:mm')}
                    </p>
                  </div>
                  <Badge
                    variant={alert.status === 'active' ? 'critical' : alert.status === 'resolved' ? 'success' : 'warning'}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {alert.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary text-center py-6">No recent alerts</p>
          )}
        </Card>
      </div>

      {/* Upcoming tasks */}
      {overview?.upcoming_tasks && overview.upcoming_tasks.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Scheduled Tasks</h2>
          <div className="space-y-2">
            {overview.upcoming_tasks.slice(0, 5).map(schedule => (
              <div key={schedule.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <div className="text-xs font-medium text-secondary w-16 flex-shrink-0">
                  {format(new Date(schedule.scheduled_start), 'HH:mm')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {schedule.task?.title || 'Task'}
                  </p>
                  <p className="text-xs text-secondary">{schedule.worker?.full_name}</p>
                </div>
                <Badge variant="outline" size="sm">
                  {schedule.task?.workload?.replace('_', ' ') || 'moderate'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ---- Weather metric component ------------------------------
function WeatherMetric({ icon, label, value, color, bg }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bg: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-secondary">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
