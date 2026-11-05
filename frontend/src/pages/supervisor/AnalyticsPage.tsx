// ============================================================
// SHIFTShield 2.0 — Safety Analytics (Supervisor)
// Sub-Task 5 — Full Implementation
//
// 6 interactive Recharts charts:
// 1. Daily environmental risk trend (line)
// 2. Workforce status distribution (pie/donut)
// 3. Task exposure distribution (bar)
// 4. Recovery break compliance (line)
// 5. Emergency requests over time (bar)
// 6. Safety action completion (stacked bar)
//
// Date range filters, CSV export.
// All demo data clearly labelled as simulated.
// ============================================================

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import {
  BarChart2, Download, RefreshCw, TrendingUp,
  Users, Activity, Clock, AlertTriangle, CheckCircle
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SimulatedDataBadge } from '@/components/ui/Badge'
import { ErrorState, InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import type { RiskLevel, WorkerStatus } from '@/types'

// ---- Design system colours ----------------------------------
const COLORS = {
  primary:  '#10243A',
  accent:   '#12B8A6',
  success:  '#16A36A',
  warning:  '#F2A93B',
  critical: '#DC4545',
  orange:   '#EA6C27',
  slate:    '#526579',
}

const RISK_COLOURS: Record<RiskLevel, string> = {
  low:      COLORS.success,
  moderate: COLORS.warning,
  elevated: COLORS.orange,
  high:     COLORS.critical,
}

const STATUS_COLOURS: Record<WorkerStatus, string> = {
  safe:      COLORS.success,
  recovery:  COLORS.accent,
  attention: COLORS.warning,
  sos:       COLORS.critical,
}

// ============================================================
// Main Component
// ============================================================

export default function AnalyticsPage() {
  const today   = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo)
  const [dateTo,   setDateTo  ] = useState(today)
  const [exporting, setExporting] = useState(false)

  // ---- Fetch analytics data ----------------------------------
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['analytics', dateFrom, dateTo],
    queryFn: () => api.analytics.getData({ date_from: dateFrom, date_to: dateTo }),
    staleTime: 60000,
  })

  // ---- CSV export -------------------------------------------
  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await api.analytics.exportCsv()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `shiftshield-analytics-${dateFrom}-${dateTo}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <Card><ErrorState title="Failed to load analytics" onRetry={refetch} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Safety Analytics</h1>
          <p className="text-sm text-secondary mt-0.5">
            Safety trends, workforce statistics and intervention performance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDemoMode && <SimulatedDataBadge />}
          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-secondary">to</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExport}
            loading={exporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {isDemoMode && (
        <InfoBanner
          variant="warning"
          icon={<BarChart2 size={14} />}
          message="All statistics displayed are simulated demonstration data. They do not represent real safety outcomes or performance metrics."
        />
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Daily risk trend */}
        <Card>
          <CardHeader
            title="Daily Environmental Risk Trend"
            subtitle="Risk score over the selected period (0–100)"
            icon={<TrendingUp size={16} />}
          />
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics?.daily_risk_trend || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [v, 'Risk Score']}
                  labelFormatter={d => `Date: ${d}`}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={COLORS.accent}
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    const colour = RISK_COLOURS[payload.risk_level as RiskLevel] || COLORS.accent
                    return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={4} fill={colour} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {!isLoading && analytics && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {Object.entries(RISK_COLOURS).map(([level, colour]) => (
                <div key={level} className="flex items-center gap-1.5 text-xs text-secondary">
                  <span className="w-3 h-3 rounded-full" style={{ background: colour }} />
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 2. Workforce status distribution */}
        <Card>
          <CardHeader
            title="Workforce Status Distribution"
            subtitle="Current status breakdown across all workers"
            icon={<Users size={16} />}
          />
          {isLoading ? <ChartSkeleton /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics?.workforce_distribution || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {(analytics?.workforce_distribution || []).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLOURS[entry.status as WorkerStatus] || COLORS.slate} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(analytics?.workforce_distribution || []).map(entry => (
                  <div key={entry.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLOURS[entry.status as WorkerStatus] || COLORS.slate }}
                      />
                      <span className="text-xs text-gray-700 capitalize">{entry.status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 3. Task exposure by workload */}
        <Card>
          <CardHeader
            title="Task Exposure by Workload"
            subtitle="Number of tasks and average duration per workload level"
            icon={<Activity size={16} />}
          />
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics?.task_exposure || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="workload"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.replace('_', ' ')}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="count" name="Task Count" fill={COLORS.accent} radius={[3,3,0,0]} />
                <Bar yAxisId="right" dataKey="avg_duration_mins" name="Avg Duration (min)" fill={COLORS.primary} radius={[3,3,0,0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 4. Recovery break compliance */}
        <Card>
          <CardHeader
            title="Recovery Break Compliance"
            subtitle="Percentage of scheduled recovery breaks completed"
            icon={<Clock size={16} />}
          />
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics?.recovery_compliance || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`, 'Compliance']}
                />
                {/* Target line at 80% */}
                <Line
                  type="monotone"
                  dataKey="compliance_pct"
                  stroke={COLORS.success}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  name="Compliance %"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {!isLoading && (
            <p className="text-xs text-secondary mt-1">Target: 80% compliance</p>
          )}
        </Card>

        {/* 5. Emergency requests over time */}
        <Card>
          <CardHeader
            title="Emergency Requests Over Time"
            subtitle="Count of assistance requests and SOS alerts per day"
            icon={<AlertTriangle size={16} />}
          />
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics?.emergency_requests || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Emergency Requests" fill={COLORS.critical} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 6. Safety action completion */}
        <Card>
          <CardHeader
            title="Safety Action Completion"
            subtitle="Completed vs total safety actions by type"
            icon={<CheckCircle size={16} />}
          />
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={analytics?.action_completion || []}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="action_type"
                  width={110}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.replace(/_/g, ' ')}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill={COLORS.success} />
                <Bar dataKey="total" name="Total" stackId="b" fill={COLORS.slate} opacity={0.4} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

      </div>
    </div>
  )
}

// ---- Chart skeleton placeholder ----------------------------
function ChartSkeleton() {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
    </div>
  )
}

function PageHeading() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Safety Analytics</h1>
      <p className="text-sm text-secondary mt-0.5">Safety trends, workforce statistics and intervention performance</p>
    </div>
  )
}
