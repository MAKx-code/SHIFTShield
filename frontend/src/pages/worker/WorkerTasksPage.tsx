// ============================================================
// SHIFTShield 2.0 — Worker Tasks Page (Mobile)
// Sub-Task 6 — Full Implementation
//
// Worker's task list:
// - View assigned tasks
// - Check in to a task
// - Mark task complete
// ============================================================

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, Clock, Play,
  RefreshCw, ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { format, parseISO } from 'date-fns'
import type { Schedule, ScheduleStatus, Workload, Environment } from '@/types'

// ---- Workload display config --------------------------------
const WORKLOAD_CONFIG: Record<Workload, { label: string; colour: string }> = {
  light:      { label: 'Light',      colour: 'text-success-dark' },
  moderate:   { label: 'Moderate',   colour: 'text-warning-dark' },
  heavy:      { label: 'Heavy',      colour: 'text-orange-600'   },
  very_heavy: { label: 'Very Heavy', colour: 'text-critical-dark'},
}

const ENV_LABELS: Record<Environment, string> = {
  outdoor_sun:   'Outdoor — Direct Sun',
  outdoor_shade: 'Outdoor — Shaded',
  indoor:        'Indoor',
}

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; variant: 'default' | 'info' | 'success' | 'outline'; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',   variant: 'default', icon: <Clock size={12} />       },
  active:   { label: 'Active',    variant: 'info',    icon: <Play size={12} />        },
  complete: { label: 'Completed', variant: 'success', icon: <CheckCircle size={12} /> },
  skipped:  { label: 'Skipped',   variant: 'outline', icon: <RefreshCw size={12} />   },
}

// ============================================================
// Main Component
// ============================================================

export default function WorkerTasksPage() {
  const queryClient = useQueryClient()
  const todayStr = new Date().toISOString().split('T')[0]
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // ---- Fetch schedules ---------------------------------------
  const {
    data: schedules = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['schedules', todayStr],
    queryFn: () => api.schedules.list(todayStr),
    refetchInterval: 60000,
  })

  // ---- Update schedule status mutation -----------------------
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScheduleStatus }) =>
      api.schedules.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setExpandedTask(null)
    },
  })

  // ---- Group by status ---------------------------------------
  const pendingTasks  = schedules.filter(s => s.status === 'pending')
  const activeTasks   = schedules.filter(s => s.status === 'active')
  const completeTasks = schedules.filter(s => s.status === 'complete' || s.status === 'skipped')

  return (
    <div className="space-y-4 pb-6 pt-4">
      {/* Header */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Tasks</h2>
          <p className="text-xs text-secondary">{format(new Date(), 'EEEE d MMMM')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={13} />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-2 px-4">
          {[
            { label: 'Pending',  count: pendingTasks.length,  colour: 'bg-gray-100'        },
            { label: 'Active',   count: activeTasks.length,   colour: 'bg-accent-50'       },
            { label: 'Complete', count: completeTasks.length, colour: 'bg-success-light'   },
          ].map(s => (
            <div key={s.label} className={clsx('rounded-xl p-3 text-center', s.colour)}>
              <p className="text-xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="px-4 space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      )}

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <TaskSection
          title="Active"
          tasks={activeTasks}
          expandedTask={expandedTask}
          onToggle={id => setExpandedTask(prev => prev === id ? null : id)}
          onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <TaskSection
          title="Scheduled"
          tasks={pendingTasks}
          expandedTask={expandedTask}
          onToggle={id => setExpandedTask(prev => prev === id ? null : id)}
          onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Completed tasks */}
      {completeTasks.length > 0 && (
        <TaskSection
          title="Completed"
          tasks={completeTasks}
          expandedTask={expandedTask}
          onToggle={id => setExpandedTask(prev => prev === id ? null : id)}
          onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
          isPending={updateMutation.isPending}
          muted
        />
      )}

      {!isLoading && schedules.length === 0 && (
        <div className="mx-4">
          <div className="bg-white rounded-2xl shadow-card p-8">
            <EmptyState
              icon={<CheckCircle size={22} />}
              title="No tasks today"
              description="You have no scheduled tasks for today. Check back tomorrow."
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Task Section
// ============================================================

interface TaskSectionProps {
  title: string
  tasks: Schedule[]
  expandedTask: string | null
  onToggle: (id: string) => void
  onStatusChange: (id: string, status: ScheduleStatus) => void
  isPending: boolean
  muted?: boolean
}

function TaskSection({ title, tasks, expandedTask, onToggle, onStatusChange, isPending, muted }: TaskSectionProps) {
  return (
    <div className="px-4 space-y-2">
      <h3 className={clsx('text-xs font-semibold uppercase tracking-wide', muted ? 'text-secondary' : 'text-gray-900')}>
        {title} ({tasks.length})
      </h3>
      {tasks.map(schedule => (
        <TaskCard
          key={schedule.id}
          schedule={schedule}
          expanded={expandedTask === schedule.id}
          onToggle={() => onToggle(schedule.id)}
          onStatusChange={(status) => onStatusChange(schedule.id, status)}
          isPending={isPending}
          muted={muted}
        />
      ))}
    </div>
  )
}

// ============================================================
// Task Card
// ============================================================

interface TaskCardProps {
  schedule: Schedule
  expanded: boolean
  onToggle: () => void
  onStatusChange: (status: ScheduleStatus) => void
  isPending: boolean
  muted?: boolean
}

function TaskCard({ schedule, expanded, onToggle, onStatusChange, isPending, muted }: TaskCardProps) {
  const task = schedule.task
  const statusCfg = STATUS_CONFIG[schedule.status]
  const workloadCfg = task ? WORKLOAD_CONFIG[task.workload] : null

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-card overflow-hidden',
        muted && 'opacity-75'
      )}
    >
      <div
        className="p-4 flex items-center gap-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Status icon */}
        <div className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          schedule.status === 'active'   ? 'bg-accent-50 text-accent'
          : schedule.status === 'complete' ? 'bg-success-light text-success-dark'
          : 'bg-gray-100 text-secondary'
        )}>
          {statusCfg.icon}
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {task?.title || 'Assigned Task'}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {format(parseISO(schedule.scheduled_start), 'HH:mm')} – {format(parseISO(schedule.scheduled_end), 'HH:mm')}
            {workloadCfg && (
              <span className={clsx('ml-2 font-medium', workloadCfg.colour)}>
                {workloadCfg.label}
              </span>
            )}
          </p>
        </div>

        <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
        <ChevronDown size={15} className={clsx('text-secondary flex-shrink-0 transition-transform', expanded && 'rotate-180')} />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-background/60 border-t border-gray-100 space-y-3">
          {task && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-secondary">Environment</p>
                <p className="text-gray-700 font-medium">{ENV_LABELS[task.environment]}</p>
              </div>
              <div>
                <p className="text-secondary">Duration</p>
                <p className="text-gray-700 font-medium">{task.duration_mins} minutes</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {schedule.status === 'pending' && (
              <Button
                size="sm"
                variant="primary"
                icon={<Play size={13} />}
                onClick={() => onStatusChange('active')}
                loading={isPending}
                className="flex-1"
              >
                Check In
              </Button>
            )}
            {schedule.status === 'active' && (
              <Button
                size="sm"
                variant="primary"
                icon={<CheckCircle size={13} />}
                onClick={() => onStatusChange('complete')}
                loading={isPending}
                className="flex-1 bg-success hover:bg-success/90"
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
