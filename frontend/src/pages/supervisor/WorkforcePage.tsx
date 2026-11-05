// ============================================================
// SHIFTShield 2.0 — Workforce Management (Supervisor)
// Sub-Task 4 — Full Implementation
//
// Displays all workers with status, search/filter, and the
// ability to update a worker's status directly.
// ============================================================

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Search, Filter, RefreshCw,
  UserCheck, UserX, AlertCircle, Phone,
  Clock, Briefcase, ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, KpiCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { WorkerStatusBadge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import type { Worker, WorkerStatus } from '@/types'

// ---- Status filter options ----------------------------------
const STATUS_FILTERS: { value: WorkerStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all',       label: 'All Workers',       icon: <Users size={14} /> },
  { value: 'safe',      label: 'Safe',              icon: <UserCheck size={14} /> },
  { value: 'attention', label: 'Needs Attention',   icon: <AlertCircle size={14} /> },
  { value: 'recovery',  label: 'Recovery Break',    icon: <Clock size={14} /> },
  { value: 'sos',       label: 'SOS — Assistance',  icon: <Phone size={14} /> },
]

// ---- Workload display labels --------------------------------
const JOB_ICON_MAP: Record<string, string> = {
  'Concreter':        '🏗',
  'Carpenter':        '🔨',
  'Electrician':      '⚡',
  'Plumber':          '🔧',
  'Roofer':           '🏠',
  'Landscaper':       '🌿',
  'Labour Assistant': '👷',
  'Site Supervisor':  '📋',
}

// ---- Worker status action menu options ----------------------
const STATUS_ACTIONS: { status: WorkerStatus; label: string; variant: 'default' | 'success' | 'warning' | 'critical' }[] = [
  { status: 'safe',      label: 'Mark as Safe',           variant: 'success'  },
  { status: 'attention', label: 'Flag for Attention',     variant: 'warning'  },
  { status: 'recovery',  label: 'Send to Recovery Break', variant: 'default'  },
]

// ============================================================
// Main Component
// ============================================================

export default function WorkforcePage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery]       = useState('')
  const [statusFilter, setStatusFilter]     = useState<WorkerStatus | 'all'>('all')
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null)
  const [actioningId, setActioningId]       = useState<string | null>(null)

  // ---- Fetch workers -----------------------------------------
  const {
    data: workers = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.workers.list(),
    refetchInterval: 30000,
  })

  // ---- Update status mutation --------------------------------
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkerStatus }) =>
      api.workers.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setActioningId(null)
      setExpandedWorker(null)
    },
  })

  // ---- Filtered and searched workers -------------------------
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q
        || w.full_name.toLowerCase().includes(q)
        || w.job_title.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [workers, statusFilter, searchQuery])

  // ---- KPI counts --------------------------------------------
  const counts = useMemo(() => ({
    total:     workers.length,
    safe:      workers.filter(w => w.status === 'safe').length,
    attention: workers.filter(w => w.status === 'attention').length,
    recovery:  workers.filter(w => w.status === 'recovery').length,
    sos:       workers.filter(w => w.status === 'sos').length,
  }), [workers])

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card><ErrorState title="Failed to load workforce" description="Check your connection and try again." onRetry={refetch} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Workforce Management</h1>
          <p className="text-sm text-secondary mt-0.5">
            Monitor and manage worker safety status across the site
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

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Workers"
          value={isLoading ? '—' : counts.total}
          icon={<Users size={18} />}
          variant="default"
        />
        <KpiCard
          title="Safe"
          value={isLoading ? '—' : counts.safe}
          icon={<UserCheck size={18} />}
          variant="success"
          subtitle={`${counts.total > 0 ? Math.round((counts.safe / counts.total) * 100) : 0}% of workforce`}
        />
        <KpiCard
          title="Needs Attention"
          value={isLoading ? '—' : counts.attention + counts.recovery}
          icon={<AlertCircle size={18} />}
          variant="warning"
        />
        <KpiCard
          title="SOS Active"
          value={isLoading ? '—' : counts.sos}
          icon={<Phone size={18} />}
          variant={counts.sos > 0 ? 'critical' : 'default'}
        />
      </div>

      {/* Filter + search row */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="search"
              placeholder="Search by name or job title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <Filter size={14} className="text-secondary flex-shrink-0 mr-1" />
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  statusFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-secondary hover:bg-gray-200'
                )}
              >
                {f.icon}
                {f.label}
                {f.value !== 'all' && (
                  <span className={clsx(
                    'ml-0.5 px-1.5 py-0.5 rounded-full text-xs',
                    statusFilter === f.value ? 'bg-white/20' : 'bg-white'
                  )}>
                    {f.value === 'safe' ? counts.safe
                    : f.value === 'attention' ? counts.attention
                    : f.value === 'recovery' ? counts.recovery
                    : counts.sos}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Worker list */}
      <Card padding="none">
        <div className="p-5 border-b border-gray-100">
          <CardHeader
            title={`${filteredWorkers.length} worker${filteredWorkers.length !== 1 ? 's' : ''} shown`}
            subtitle={statusFilter !== 'all' ? `Filtered by: ${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}` : 'All status types'}
            icon={<Briefcase size={16} />}
          />
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No workers found"
            description={searchQuery ? 'Try a different search term.' : 'No workers match this filter.'}
          />
        ) : (
          <ul className="divide-y divide-gray-50">
            {filteredWorkers.map(worker => (
              <WorkerRow
                key={worker.id}
                worker={worker}
                expanded={expandedWorker === worker.id}
                onToggleExpand={() => setExpandedWorker(prev => prev === worker.id ? null : worker.id)}
                onStatusChange={(status) => {
                  setActioningId(worker.id)
                  updateStatusMutation.mutate({ id: worker.id, status })
                }}
                actioning={actioningId === worker.id && updateStatusMutation.isPending}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// Worker Row Sub-Component
// ============================================================

interface WorkerRowProps {
  worker: Worker
  expanded: boolean
  onToggleExpand: () => void
  onStatusChange: (status: WorkerStatus) => void
  actioning: boolean
}

function WorkerRow({ worker, expanded, onToggleExpand, onStatusChange, actioning }: WorkerRowProps) {
  const jobIcon = JOB_ICON_MAP[worker.job_title] ?? '👷'
  const lastSeen = formatDistanceToNow(new Date(worker.last_seen), { addSuffix: true })

  const rowBg: Record<WorkerStatus, string> = {
    safe:      'hover:bg-gray-50',
    attention: 'bg-warning-light/30 hover:bg-warning-light/50',
    recovery:  'bg-accent-50/40 hover:bg-accent-50/60',
    sos:       'bg-critical-light hover:bg-critical-light',
  }

  return (
    <li className={clsx('transition-colors', rowBg[worker.status])}>
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0 select-none">
          {jobIcon}
        </div>

        {/* Name + title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{worker.full_name}</p>
          <p className="text-xs text-secondary truncate">{worker.job_title} · Last seen {lastSeen}</p>
        </div>

        {/* Acclimatisation */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-xs text-secondary">Acclimatised</span>
          <span className="text-xs font-medium text-gray-700">{worker.acclimatisation_days} days</span>
        </div>

        {/* Status badge */}
        <WorkerStatusBadge status={worker.status} />

        {/* Expand icon */}
        <ChevronDown
          size={16}
          className={clsx('text-secondary transition-transform flex-shrink-0', expanded && 'rotate-180')}
        />
      </div>

      {/* Expanded action panel */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 bg-background/60 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-secondary mr-2">Update status:</span>
            {STATUS_ACTIONS.map(action => (
              <Button
                key={action.status}
                variant={action.variant === 'success' ? 'primary' : action.variant === 'warning' ? 'outline' : 'outline'}
                size="sm"
                onClick={(e) => { e.stopPropagation(); onStatusChange(action.status) }}
                loading={actioning}
                disabled={worker.status === action.status || actioning}
                className={clsx(
                  worker.status === action.status && 'opacity-40 cursor-not-allowed'
                )}
              >
                {action.label}
              </Button>
            ))}
            <div className="ml-auto text-xs text-secondary">
              Worker ID: <span className="font-mono">{worker.id}</span>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

// Tiny helper used in error boundary fallback
function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Workforce Management</h1>
      <p className="text-sm text-secondary mt-0.5">Monitor and manage worker safety status across the site</p>
    </div>
  )
}
