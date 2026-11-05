// ============================================================
// SHIFTShield 2.0 — Safety Action Audit Log (Supervisor)
// Sub-Task 4 — Full Implementation
//
// Searchable, filterable timeline of all recorded safety events.
// Calls GET /api/audit-log with query params.
// ============================================================

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList, Search, Filter, RefreshCw,
  CheckCircle, AlertTriangle, Shield, Clock,
  Users, Calendar, Activity, FileText
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { SafetyAction, ActionType, ActionStatus } from '@/types'

// ---- Action type display config ----------------------------
const ACTION_CONFIG: Record<ActionType, {
  label: string
  icon: React.ReactNode
  variant: 'success' | 'warning' | 'critical' | 'info' | 'default'
}> = {
  risk_assessed:       { label: 'Risk Assessment',      icon: <Activity size={14} />,    variant: 'info'     },
  alert_created:       { label: 'Alert Created',        icon: <AlertTriangle size={14}/>, variant: 'warning'  },
  alert_acknowledged:  { label: 'Alert Acknowledged',   icon: <CheckCircle size={14} />, variant: 'success'  },
  schedule_changed:    { label: 'Schedule Changed',     icon: <Calendar size={14} />,    variant: 'default'  },
  worker_sos:          { label: 'Worker SOS',           icon: <Shield size={14} />,      variant: 'critical' },
  response_initiated:  { label: 'Response Initiated',   icon: <Users size={14} />,       variant: 'warning'  },
  action_resolved:     { label: 'Action Resolved',      icon: <CheckCircle size={14} />, variant: 'success'  },
  resource_reported:   { label: 'Resource Reported',    icon: <FileText size={14} />,    variant: 'default'  },
}

const STATUS_CONFIG: Record<ActionStatus, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  open:        { label: 'Open',        variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info'    },
  resolved:    { label: 'Resolved',    variant: 'success' },
}

const ACTION_FILTER_OPTIONS: { value: ActionType | 'all'; label: string }[] = [
  { value: 'all',              label: 'All Events'          },
  { value: 'risk_assessed',    label: 'Risk Assessment'     },
  { value: 'worker_sos',       label: 'SOS Alerts'          },
  { value: 'alert_created',    label: 'Alerts Created'      },
  { value: 'alert_acknowledged',label: 'Acknowledged'       },
  { value: 'response_initiated',label: 'Response Initiated' },
  { value: 'action_resolved',  label: 'Resolved'            },
  { value: 'schedule_changed', label: 'Schedule Changes'    },
  { value: 'resource_reported',label: 'Resources'           },
]

const STATUS_FILTER_OPTIONS: { value: ActionStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'All Statuses' },
  { value: 'open',       label: 'Open'         },
  { value: 'in_progress',label: 'In Progress'  },
  { value: 'resolved',   label: 'Resolved'     },
]

// ============================================================
// Main Component
// ============================================================

export default function AuditLogPage() {
  const [searchQuery,    setSearchQuery]    = useState('')
  const [actionFilter,   setActionFilter]   = useState<ActionType | 'all'>('all')
  const [statusFilter,   setStatusFilter]   = useState<ActionStatus | 'all'>('all')
  const [expandedEntry,  setExpandedEntry]  = useState<string | null>(null)

  // ---- Fetch audit log ---------------------------------------
  const {
    data: actions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['audit-log', actionFilter, statusFilter],
    queryFn: () => api.safety.auditLog({
      action_type: actionFilter !== 'all' ? actionFilter : undefined,
      status:      statusFilter !== 'all' ? statusFilter : undefined,
    }),
    staleTime: 30000,
  })

  // ---- Client-side search (audit log can be large) ----------
  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return actions
    const q = searchQuery.toLowerCase()
    return actions.filter(a =>
      a.description.toLowerCase().includes(q)
      || (a.actor_name || '').toLowerCase().includes(q)
      || (a.worker_name || '').toLowerCase().includes(q)
      || a.id.toLowerCase().includes(q)
    )
  }, [actions, searchQuery])

  // ---- Summary counts ----------------------------------------
  const counts = useMemo(() => ({
    total:      actions.length,
    open:       actions.filter(a => a.status === 'open').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    resolved:   actions.filter(a => a.status === 'resolved').length,
    sos:        actions.filter(a => a.action_type === 'worker_sos').length,
  }), [actions])

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <Card><ErrorState title="Failed to load audit log" description="Check your connection and try again." onRetry={refetch} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Safety Action Log</h1>
          <p className="text-sm text-secondary mt-0.5">
            Complete audit trail of all safety events, alerts and supervisor interventions
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

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card rounded-card shadow-card p-4 border-l-4 border-primary">
          <p className="text-xs text-secondary uppercase tracking-wide">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : counts.total}</p>
        </div>
        <div className="bg-card rounded-card shadow-card p-4 border-l-4 border-warning">
          <p className="text-xs text-secondary uppercase tracking-wide">Open</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : counts.open}</p>
        </div>
        <div className="bg-card rounded-card shadow-card p-4 border-l-4 border-accent">
          <p className="text-xs text-secondary uppercase tracking-wide">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : counts.inProgress}</p>
        </div>
        <div className="bg-card rounded-card shadow-card p-4 border-l-4 border-success">
          <p className="text-xs text-secondary uppercase tracking-wide">Resolved</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : counts.resolved}</p>
        </div>
        <div className={clsx(
          'bg-card rounded-card shadow-card p-4 border-l-4',
          counts.sos > 0 ? 'border-critical' : 'border-gray-200'
        )}>
          <p className="text-xs text-secondary uppercase tracking-wide">SOS Events</p>
          <p className={clsx('text-2xl font-bold mt-1', counts.sos > 0 ? 'text-critical' : 'text-gray-900')}>
            {isLoading ? '—' : counts.sos}
          </p>
        </div>
      </div>

      {/* Filters + search */}
      <Card padding="sm">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="search"
              placeholder="Search by description, actor, worker or event ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Action type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-secondary flex-shrink-0" />
            <span className="text-xs text-secondary">Type:</span>
            {ACTION_FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setActionFilter(f.value)}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  actionFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-secondary hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-secondary ml-5">Status:</span>
            {STATUS_FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  statusFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-secondary hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <CardHeader
            title={`${filteredActions.length} event${filteredActions.length !== 1 ? 's' : ''} shown`}
            subtitle={searchQuery || actionFilter !== 'all' || statusFilter !== 'all' ? 'Filtered view' : 'Full audit trail'}
            icon={<ClipboardList size={16} />}
            className="mb-0"
          />
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActions.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No events found"
            description={searchQuery ? 'Try a different search term or clear filters.' : 'No safety events have been recorded yet.'}
          />
        ) : (
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute left-[2.75rem] top-0 bottom-0 w-px bg-gray-100" />

            <ul className="divide-y divide-gray-50 relative">
              {filteredActions.map((action, idx) => (
                <AuditLogEntry
                  key={action.id}
                  action={action}
                  isFirst={idx === 0}
                  expanded={expandedEntry === action.id}
                  onToggle={() => setExpandedEntry(prev => prev === action.id ? null : action.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// Audit Log Entry
// ============================================================

interface AuditLogEntryProps {
  action: SafetyAction
  isFirst: boolean
  expanded: boolean
  onToggle: () => void
}

function AuditLogEntry({ action, isFirst, expanded, onToggle }: AuditLogEntryProps) {
  const config = ACTION_CONFIG[action.action_type] || {
    label: action.action_type,
    icon: <Activity size={14} />,
    variant: 'default' as const,
  }

  const statusCfg = STATUS_CONFIG[action.status]

  const iconBgClasses: Record<typeof config.variant, string> = {
    success:  'bg-success-light text-success-dark ring-white',
    warning:  'bg-warning-light text-warning-dark ring-white',
    critical: 'bg-critical-light text-critical-dark ring-white',
    info:     'bg-accent-50 text-accent-700 ring-white',
    default:  'bg-gray-100 text-secondary ring-white',
  }

  const timeAgo = formatDistanceToNow(parseISO(action.created_at), { addSuffix: true })
  const timeExact = format(parseISO(action.created_at), 'dd MMM yyyy HH:mm:ss')

  return (
    <li
      className={clsx(
        'flex gap-4 pl-4 pr-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer',
        action.action_type === 'worker_sos' && 'bg-critical-light/20'
      )}
      onClick={onToggle}
    >
      {/* Icon bubble */}
      <div className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ring-2 z-10 self-start mt-0.5',
        iconBgClasses[config.variant]
      )}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={config.variant} size="sm">{config.label}</Badge>
            <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
          </div>
          <span
            className="text-xs text-secondary flex-shrink-0 mt-0.5"
            title={timeExact}
          >
            <Clock size={11} className="inline mr-1" />
            {timeAgo}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-800 mt-1 leading-snug">{action.description}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {action.actor_name && (
            <span className="text-xs text-secondary">
              By: <span className="text-gray-700 font-medium">{action.actor_name}</span>
            </span>
          )}
          {action.worker_name && (
            <span className="text-xs text-secondary">
              Worker: <span className="text-gray-700 font-medium">{action.worker_name}</span>
            </span>
          )}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 p-3 bg-background rounded-lg border border-gray-100 text-xs space-y-1.5">
            <div className="flex gap-2">
              <span className="text-secondary w-20 flex-shrink-0">Event ID</span>
              <span className="font-mono text-gray-700 break-all">{action.id}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-secondary w-20 flex-shrink-0">Timestamp</span>
              <span className="text-gray-700">{timeExact}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-secondary w-20 flex-shrink-0">Action</span>
              <span className="text-gray-700">{action.action_type}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-secondary w-20 flex-shrink-0">Status</span>
              <span className="text-gray-700">{action.status}</span>
            </div>
            {action.actor_id && (
              <div className="flex gap-2">
                <span className="text-secondary w-20 flex-shrink-0">Actor ID</span>
                <span className="font-mono text-gray-700">{action.actor_id}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

function PageHeading() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Safety Action Log</h1>
      <p className="text-sm text-secondary mt-0.5">Complete audit trail of all safety events</p>
    </div>
  )
}
