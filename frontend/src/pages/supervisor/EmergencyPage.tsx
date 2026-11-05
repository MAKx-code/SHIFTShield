// ============================================================
// SHIFTShield 2.0 — Emergency Centre (Supervisor)
// Sub-Task 5 — Full Implementation
//
// Displays active and historical emergency alerts.
// Actions: Acknowledge → Respond → Resolve
// Full response history log.
// ============================================================

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertOctagon, CheckCircle, Phone, Shield,
  Clock, RefreshCw, User, ChevronDown,
  Activity, AlertTriangle, Droplets, Eye
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, KpiCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertStatusBadge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { EmergencyAlert, AlertType, AlertStatus } from '@/types'

// ---- Alert type display config -----------------------------
const ALERT_TYPE_CONFIG: Record<AlertType, {
  label: string
  icon: React.ReactNode
  urgency: 'critical' | 'warning' | 'info'
}> = {
  sos:               { label: 'SOS — Assistance Required',      icon: <Phone size={16} />,          urgency: 'critical' },
  heat_stress:       { label: 'Heat Stress Concern',            icon: <Activity size={16} />,       urgency: 'critical' },
  injury:            { label: 'Injury Reported',                icon: <AlertOctagon size={16} />,   urgency: 'critical' },
  water_unavailable: { label: 'Drinking Water Unavailable',     icon: <Droplets size={16} />,       urgency: 'warning'  },
  shade_unavailable: { label: 'Shaded Recovery Area Missing',   icon: <AlertTriangle size={16} />,  urgency: 'warning'  },
}

// ---- Status sort order (active first) ----------------------
const STATUS_ORDER: Record<AlertStatus, number> = {
  active: 0, acknowledged: 1, responding: 2, resolved: 3,
}

// ============================================================
// Main Component
// ============================================================

export default function EmergencyPage() {
  const queryClient = useQueryClient()
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [responderInput, setResponderInput] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')

  // ---- Fetch alerts ------------------------------------------
  const {
    data: alerts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['emergency'],
    queryFn: () => api.emergency.list(),
    refetchInterval: 15000, // poll every 15s
  })

  // ---- Sorted and split -------------------------------------
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }, [alerts])

  const activeAlerts   = sortedAlerts.filter(a => a.status !== 'resolved')
  const resolvedAlerts = sortedAlerts.filter(a => a.status === 'resolved')
  const displayAlerts  = activeTab === 'active' ? activeAlerts : sortedAlerts

  // ---- Counts -----------------------------------------------
  const counts = useMemo(() => ({
    active:   alerts.filter(a => a.status === 'active').length,
    ack:      alerts.filter(a => a.status === 'acknowledged').length,
    respond:  alerts.filter(a => a.status === 'responding').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    sos:      alerts.filter(a => a.alert_type === 'sos' && a.status !== 'resolved').length,
  }), [alerts])

  // ---- Mutations --------------------------------------------
  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => api.emergency.acknowledge(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency'] }),
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, responder }: { id: string; responder: string }) =>
      api.emergency.respond(id, responder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency'] })
      setResponderInput('')
    },
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.emergency.resolve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency'] }),
  })

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <Card><ErrorState title="Failed to load emergency alerts" onRetry={refetch} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Emergency Centre</h1>
          <p className="text-sm text-secondary mt-0.5">
            Manage active assistance requests and worker emergency alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && <SimulatedDataBadge />}
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Active SOS banner */}
      {counts.sos > 0 && (
        <InfoBanner
          variant="error"
          icon={<Phone size={16} />}
          title={`${counts.sos} active SOS alert${counts.sos !== 1 ? 's' : ''} require immediate attention`}
          message="Review the alerts below and initiate a response as soon as possible. Do not rely solely on this system — follow your site's emergency response protocol."
        />
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Active Alerts"
          value={isLoading ? '—' : counts.active}
          icon={<AlertOctagon size={18} />}
          variant={counts.active > 0 ? 'critical' : 'default'}
        />
        <KpiCard
          title="Acknowledged"
          value={isLoading ? '—' : counts.ack}
          icon={<Eye size={18} />}
          variant="warning"
        />
        <KpiCard
          title="Responding"
          value={isLoading ? '—' : counts.respond}
          icon={<Shield size={18} />}
          variant="accent"
        />
        <KpiCard
          title="Resolved Today"
          value={isLoading ? '—' : counts.resolved}
          icon={<CheckCircle size={18} />}
          variant="success"
        />
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['active', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-gray-700'
            )}
          >
            {tab === 'active' ? `Active (${activeAlerts.length})` : `All Alerts (${alerts.length})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-card" />)}
        </div>
      ) : displayAlerts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle size={24} />}
            title={activeTab === 'active' ? 'No active alerts' : 'No alerts recorded'}
            description={activeTab === 'active'
              ? 'All workers are safe. Active alerts will appear here automatically.'
              : 'No emergency alerts have been recorded yet.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              expanded={expandedAlert === alert.id}
              onToggleExpand={() => setExpandedAlert(prev => prev === alert.id ? null : alert.id)}
              responderInput={responderInput}
              onResponderChange={setResponderInput}
              onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
              onRespond={() => respondMutation.mutate({ id: alert.id, responder: responderInput })}
              onResolve={() => resolveMutation.mutate(alert.id)}
              isAcknowledging={acknowledgeMutation.isPending}
              isResponding={respondMutation.isPending}
              isResolving={resolveMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <InfoBanner
        variant="info"
        icon={<AlertTriangle size={14} />}
        message="This system records and coordinates responses to worker assistance requests. It does not automatically contact emergency services. Always follow your site's emergency response protocol and contact emergency services directly when required."
      />
    </div>
  )
}

// ============================================================
// Alert Card
// ============================================================

interface AlertCardProps {
  alert: EmergencyAlert
  expanded: boolean
  onToggleExpand: () => void
  responderInput: string
  onResponderChange: (v: string) => void
  onAcknowledge: () => void
  onRespond: () => void
  onResolve: () => void
  isAcknowledging: boolean
  isResponding: boolean
  isResolving: boolean
}

function AlertCard({
  alert, expanded, onToggleExpand,
  responderInput, onResponderChange,
  onAcknowledge, onRespond, onResolve,
  isAcknowledging, isResponding, isResolving,
}: AlertCardProps) {
  const config = ALERT_TYPE_CONFIG[alert.alert_type] || {
    label: alert.alert_type,
    icon: <AlertOctagon size={16} />,
    urgency: 'warning' as const,
  }

  const urgencyBorder: Record<typeof config.urgency, string> = {
    critical: 'border-l-4 border-critical',
    warning:  'border-l-4 border-warning',
    info:     'border-l-4 border-accent',
  }

  const urgencyBg: Record<typeof config.urgency, string> = {
    critical: alert.status === 'resolved' ? '' : 'bg-critical-light/10',
    warning:  alert.status === 'resolved' ? '' : 'bg-warning-light/10',
    info:     '',
  }

  const timeAgo   = formatDistanceToNow(parseISO(alert.created_at), { addSuffix: true })
  const timeExact = format(parseISO(alert.created_at), 'dd MMM yyyy HH:mm')
  const workerName = alert.worker?.full_name || alert.worker_id

  return (
    <Card
      className={clsx(
        urgencyBorder[config.urgency],
        urgencyBg[config.urgency],
        'transition-all'
      )}
      padding="none"
    >
      {/* Main row */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Icon */}
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          config.urgency === 'critical' ? 'bg-critical-light text-critical'
          : config.urgency === 'warning' ? 'bg-warning-light text-warning-dark'
          : 'bg-accent-50 text-accent'
        )}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">{config.label}</p>
                <AlertStatusBadge status={alert.status} />
              </div>
              <p className="text-sm text-secondary mt-0.5">
                <User size={12} className="inline mr-1" />
                {workerName}
                {alert.notes && ` — ${alert.notes}`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-secondary" title={timeExact}>
                <Clock size={11} className="inline mr-1" />
                {timeAgo}
              </p>
              <p className="text-xs font-mono text-secondary">{alert.id.slice(0, 10)}…</p>
            </div>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={clsx('text-secondary flex-shrink-0 transition-transform mt-1', expanded && 'rotate-180')}
        />
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-background/50 space-y-3">
          {/* Full details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div><span className="text-secondary">Alert ID</span><span className="ml-2 font-mono text-gray-700">{alert.id}</span></div>
            <div><span className="text-secondary">Type</span><span className="ml-2 text-gray-700">{alert.alert_type}</span></div>
            <div><span className="text-secondary">Received</span><span className="ml-2 text-gray-700">{timeExact}</span></div>
            {alert.acknowledged_at && (
              <div><span className="text-secondary">Acknowledged</span><span className="ml-2 text-gray-700">{format(parseISO(alert.acknowledged_at), 'HH:mm')}</span></div>
            )}
            {alert.resolved_at && (
              <div><span className="text-secondary">Resolved</span><span className="ml-2 text-gray-700">{format(parseISO(alert.resolved_at), 'HH:mm')}</span></div>
            )}
          </div>

          {/* Action buttons */}
          {alert.status !== 'resolved' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {alert.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Eye size={14} />}
                  onClick={(e) => { e.stopPropagation(); onAcknowledge() }}
                  loading={isAcknowledging}
                >
                  Acknowledge
                </Button>
              )}

              {(alert.status === 'acknowledged') && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Responder name (optional)"
                    value={responderInput}
                    onChange={e => onResponderChange(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Shield size={14} />}
                    onClick={(e) => { e.stopPropagation(); onRespond() }}
                    loading={isResponding}
                    className="border-accent text-accent-700 hover:bg-accent-50"
                  >
                    Initiate Response
                  </Button>
                </div>
              )}

              {(alert.status === 'responding' || alert.status === 'acknowledged') && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<CheckCircle size={14} />}
                  onClick={(e) => { e.stopPropagation(); onResolve() }}
                  loading={isResolving}
                  className="border-success text-success-dark hover:bg-success-light"
                >
                  Mark Resolved
                </Button>
              )}
            </div>
          )}

          {alert.status === 'resolved' && (
            <div className="flex items-center gap-2 text-xs text-success-dark bg-success-light rounded-lg px-3 py-2">
              <CheckCircle size={13} />
              Resolved {alert.resolved_at ? format(parseISO(alert.resolved_at), 'dd MMM HH:mm') : ''}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function PageHeading() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Emergency Centre</h1>
      <p className="text-sm text-secondary mt-0.5">Manage active assistance requests and worker emergency alerts</p>
    </div>
  )
}
