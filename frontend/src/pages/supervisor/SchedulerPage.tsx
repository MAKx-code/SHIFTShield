// ============================================================
// SHIFTShield 2.0 — Smart Scheduler (Supervisor)
// Sub-Task 4 — Full Implementation
//
// Constraint-based task scheduler with:
// - Task creation form
// - POST /api/scheduler/generate → schedule result
// - POST /api/scheduler/apply
// - Conflict display
// - Timeline view of proposed schedule
// ============================================================

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, Plus, Trash2, Clock, Zap, RefreshCw,
  CheckCircle, AlertTriangle, Info, ChevronRight,
  Play, RotateCcw, Shield
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, KpiCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import type { Task, Workload, Environment, ScheduleGenerateResponse, ScheduledSlot, ScheduleConflict } from '@/types'

// ---- Constants -----------------------------------------------
const WORKLOAD_OPTIONS: { value: Workload; label: string; color: string }[] = [
  { value: 'light',      label: 'Light',      color: 'text-success-dark'  },
  { value: 'moderate',   label: 'Moderate',   color: 'text-warning-dark'  },
  { value: 'heavy',      label: 'Heavy',      color: 'text-orange-600'    },
  { value: 'very_heavy', label: 'Very Heavy', color: 'text-critical-dark' },
]

const ENV_OPTIONS: { value: Environment; label: string }[] = [
  { value: 'outdoor_sun',   label: 'Outdoor — Direct Sun'     },
  { value: 'outdoor_shade', label: 'Outdoor — Shaded'         },
  { value: 'indoor',        label: 'Indoor — Enclosed'        },
]

const WORKLOAD_BADGE_VARIANT: Record<Workload, 'success' | 'warning' | 'elevated' | 'critical'> = {
  light:      'success',
  moderate:   'warning',
  heavy:      'elevated',
  very_heavy: 'critical',
}

// Recovery slot colour
const SLOT_COLOURS: Record<string, string> = {
  recovery:      'bg-accent-50 border-accent-200 text-accent-700',
  outdoor_sun:   'bg-orange-50 border-orange-200 text-orange-800',
  outdoor_shade: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  indoor:        'bg-blue-50 border-blue-200 text-blue-800',
}

// ---- Default new task form ----------------------------------
const DEFAULT_TASK = (): Omit<Task, 'id' | 'created_at' | 'created_by'> => ({
  workplace_id:  'wp-001',
  title:         '',
  description:   '',
  workload:      'moderate',
  environment:   'outdoor_sun',
  duration_mins: 60,
  deadline:      undefined,
  assigned_to:   undefined,
})

// ============================================================
// Main Component
// ============================================================

export default function SchedulerPage() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [scheduleDate, setScheduleDate] = useState(today)
  const [pendingTasks, setPendingTasks]   = useState<typeof DEFAULT_TASK[]>([])
  const [showAddForm, setShowAddForm]     = useState(false)
  const [newTask, setNewTask]             = useState(DEFAULT_TASK())
  const [scheduleResult, setScheduleResult] = useState<ScheduleGenerateResponse | null>(null)
  const [applied, setApplied] = useState(false)

  // ---- Fetch existing tasks ----------------------------------
  const {
    data: existingTasks = [],
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  // ---- Fetch workers for assignment -------------------------
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.workers.list(),
  })

  // ---- Create task mutation ----------------------------------
  const createTaskMutation = useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'created_at' | 'created_by'>) =>
      api.tasks.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setPendingTasks(prev => [...prev, () => ({ ...created })])
      setShowAddForm(false)
      setNewTask(DEFAULT_TASK())
    },
  })

  // ---- Generate schedule mutation ---------------------------
  const generateMutation = useMutation({
    mutationFn: () => api.schedules.generate({
      tasks: existingTasks,
      date: scheduleDate,
      workplace_id: 'wp-001',
    }),
    onSuccess: (data) => {
      setScheduleResult(data)
      setApplied(false)
    },
  })

  // ---- Apply schedule mutation ------------------------------
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleResult) return
      await api.schedules.apply({
        tasks: existingTasks,
        date: scheduleDate,
        workplace_id: 'wp-001',
        schedule: scheduleResult.schedule,
      })
    },
    onSuccess: () => {
      setApplied(true)
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })

  // ---- Delete task ------------------------------------------
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // ---- Handle add task form submit -------------------------
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    createTaskMutation.mutate(newTask)
  }

  const taskStats = useMemo(() => ({
    total:     existingTasks.length,
    heavy:     existingTasks.filter(t => t.workload === 'heavy' || t.workload === 'very_heavy').length,
    outdoor:   existingTasks.filter(t => t.environment !== 'indoor').length,
    totalMins: existingTasks.reduce((s, t) => s + t.duration_mins, 0),
  }), [existingTasks])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Smart Scheduler</h1>
          <p className="text-sm text-secondary mt-0.5">
            Constraint-based work scheduling that never overrides mandatory safety requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && <SimulatedDataBadge />}
          <input
            type="date"
            value={scheduleDate}
            onChange={e => { setScheduleDate(e.target.value); setScheduleResult(null); setApplied(false) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Safety notice */}
      <InfoBanner
        variant="info"
        icon={<Shield size={15} />}
        title="Safety-first scheduling"
        message="This scheduler will never override mandatory safety constraints. If no safe feasible schedule exists, it will flag the conflict and recommend supervisor intervention."
      />

      {/* Task summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Tasks" value={taskStats.total} icon={<Calendar size={18} />} variant="default" />
        <KpiCard title="High-Intensity" value={taskStats.heavy} icon={<Zap size={18} />} variant="warning" />
        <KpiCard title="Outdoor Tasks" value={taskStats.outdoor} icon={<RefreshCw size={18} />} variant="accent" />
        <KpiCard
          title="Total Duration"
          value={`${Math.floor(taskStats.totalMins / 60)}h ${taskStats.totalMins % 60}m`}
          icon={<Clock size={18} />}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---- Left: Task list -------------------------------- */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <CardHeader
                title="Task Queue"
                subtitle={`${existingTasks.length} tasks ready to schedule`}
                icon={<Calendar size={16} />}
                className="mb-0"
              />
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() => setShowAddForm(v => !v)}
              >
                Add Task
              </Button>
            </div>

            {/* Add task form */}
            {showAddForm && (
              <form onSubmit={handleAddTask} className="p-4 bg-background border-b border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide">New Task</p>

                <input
                  required
                  placeholder="Task name *"
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-secondary mb-1">Workload</label>
                    <select
                      value={newTask.workload}
                      onChange={e => setNewTask(p => ({ ...p, workload: e.target.value as Workload }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {WORKLOAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-secondary mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      step={15}
                      value={newTask.duration_mins}
                      onChange={e => setNewTask(p => ({ ...p, duration_mins: parseInt(e.target.value) || 60 }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-secondary mb-1">Environment</label>
                  <select
                    value={newTask.environment}
                    onChange={e => setNewTask(p => ({ ...p, environment: e.target.value as Environment }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {ENV_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <input
                  type="datetime-local"
                  value={newTask.deadline?.slice(0, 16) || ''}
                  onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-secondary -mt-2">Deadline (optional)</p>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" variant="primary" loading={createTaskMutation.isPending} className="flex-1">
                    Add Task
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Task list */}
            {tasksLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : existingTasks.length === 0 ? (
              <EmptyState icon={<Calendar size={20} />} title="No tasks yet" description="Add tasks above to start scheduling." />
            ) : (
              <ul className="divide-y divide-gray-50">
                {existingTasks.map(task => (
                  <TaskQueueItem
                    key={task.id}
                    task={task}
                    onDelete={() => deleteTaskMutation.mutate(task.id)}
                    deleting={deleteTaskMutation.isPending}
                  />
                ))}
              </ul>
            )}
          </Card>

          {/* Generate button */}
          <Button
            variant="primary"
            size="lg"
            icon={<Play size={16} />}
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            disabled={existingTasks.length === 0}
            className="w-full"
          >
            {generateMutation.isPending ? 'Optimising Schedule…' : 'Generate Optimised Schedule'}
          </Button>

          {scheduleResult && !applied && (
            <Button
              variant="outline"
              size="lg"
              icon={<CheckCircle size={16} />}
              onClick={() => applyMutation.mutate()}
              loading={applyMutation.isPending}
              className="w-full border-success text-success-dark hover:bg-success-light"
            >
              {applyMutation.isPending ? 'Applying…' : 'Apply This Schedule'}
            </Button>
          )}

          {applied && (
            <div className="flex items-center gap-2 text-sm text-success-dark bg-success-light rounded-lg px-4 py-3 border border-success/20">
              <CheckCircle size={16} />
              Schedule applied successfully
            </div>
          )}

          {scheduleResult && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={() => { setScheduleResult(null); setApplied(false) }}
              className="w-full text-secondary"
            >
              Clear Schedule
            </Button>
          )}
        </div>

        {/* ---- Right: Schedule result ------------------------- */}
        <div className="lg:col-span-3 space-y-4">
          {!scheduleResult && !generateMutation.isPending && (
            <Card>
              <EmptyState
                icon={<Calendar size={24} />}
                title="No schedule generated yet"
                description="Add tasks to the queue on the left, then click 'Generate Optimised Schedule' to see a safety-optimised work plan for the selected date."
              />
            </Card>
          )}

          {generateMutation.isPending && (
            <Card>
              <div className="py-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-50 flex items-center justify-center">
                  <RefreshCw size={22} className="text-accent animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">Optimising schedule…</p>
                  <p className="text-xs text-secondary mt-1">Applying safety constraints and workload balancing</p>
                </div>
              </div>
            </Card>
          )}

          {scheduleResult && (
            <>
              {/* Explanation */}
              <Card>
                <CardHeader title="Scheduling Summary" icon={<Info size={16} />} />
                <p className="text-sm text-gray-700 leading-relaxed">{scheduleResult.explanation}</p>
              </Card>

              {/* Conflicts */}
              {scheduleResult.conflicts.length > 0 && (
                <Card className="border-l-4 border-warning">
                  <CardHeader
                    title={`${scheduleResult.conflicts.length} Conflict${scheduleResult.conflicts.length !== 1 ? 's' : ''} Detected`}
                    icon={<AlertTriangle size={16} className="text-warning" />}
                  />
                  <ul className="space-y-2">
                    {scheduleResult.conflicts.map((c, i) => (
                      <ConflictItem key={i} conflict={c} />
                    ))}
                  </ul>
                </Card>
              )}

              {/* Safety-override warning */}
              {scheduleResult.conflicts.some(c => c.type === 'safety_override_required') && (
                <InfoBanner
                  variant="error"
                  icon={<Shield size={15} />}
                  title="Safety Override Required"
                  message="One or more tasks cannot be safely scheduled within the given constraints. Supervisor intervention is required before proceeding."
                />
              )}

              {/* Timeline */}
              <Card padding="none">
                <div className="p-4 border-b border-gray-100">
                  <CardHeader
                    title="Proposed Timeline"
                    subtitle={`${scheduleResult.schedule.length} slots · ${format(parseISO(scheduleDate), 'EEEE d MMMM yyyy')}`}
                    icon={<Clock size={16} />}
                    className="mb-0"
                  />
                </div>
                <div className="p-4 space-y-2">
                  {scheduleResult.schedule.length === 0 ? (
                    <EmptyState icon={<Calendar size={20} />} title="No slots generated" description="No safe schedule could be created." />
                  ) : (
                    scheduleResult.schedule.map((slot, i) => (
                      <ScheduleSlotCard key={i} slot={slot} workers={workers as any} />
                    ))
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Task Queue Item
// ============================================================

interface TaskQueueItemProps {
  task: Task
  onDelete: () => void
  deleting: boolean
}

function TaskQueueItem({ task, onDelete, deleting }: TaskQueueItemProps) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
          <Badge variant={WORKLOAD_BADGE_VARIANT[task.workload]} size="sm">
            {WORKLOAD_OPTIONS.find(o => o.value === task.workload)?.label}
          </Badge>
        </div>
        <p className="text-xs text-secondary mt-0.5">
          {task.duration_mins} min · {ENV_OPTIONS.find(o => o.value === task.environment)?.label}
          {task.deadline && ` · Due ${format(parseISO(task.deadline), 'MMM d HH:mm')}`}
        </p>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-secondary hover:text-critical rounded"
        title="Remove task"
      >
        <Trash2 size={14} />
      </button>
    </li>
  )
}

// ============================================================
// Schedule Slot Card
// ============================================================

interface ScheduleSlotCardProps {
  slot: ScheduledSlot
  workers: { id: string; full_name: string }[]
}

function ScheduleSlotCard({ slot, workers }: ScheduleSlotCardProps) {
  const env = (slot.task?.environment || 'outdoor_sun') as string
  const colourClass = slot.is_recovery
    ? SLOT_COLOURS.recovery
    : SLOT_COLOURS[env] || SLOT_COLOURS.outdoor_sun

  const startFmt = format(parseISO(slot.scheduled_start), 'HH:mm')
  const endFmt   = format(parseISO(slot.scheduled_end),   'HH:mm')
  const durMins  = differenceInMinutes(parseISO(slot.scheduled_end), parseISO(slot.scheduled_start))
  const workerName = workers.find(w => w.id === slot.worker_id)?.full_name || slot.worker?.full_name || slot.worker_id

  return (
    <div className={clsx('flex items-start gap-3 p-3 rounded-lg border', colourClass)}>
      {/* Time column */}
      <div className="flex-shrink-0 text-center min-w-[3.5rem]">
        <p className="text-xs font-bold">{startFmt}</p>
        <div className="w-px h-4 bg-current/30 mx-auto my-0.5" />
        <p className="text-xs">{endFmt}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {slot.is_recovery ? (
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Clock size={12} />
            Recovery Break — {durMins} min
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold truncate">
              {slot.task?.title || 'Task'}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {workerName} · {durMins} min
            </p>
          </>
        )}
        {slot.explanation && (
          <p className="text-xs opacity-70 mt-1 italic">{slot.explanation}</p>
        )}
      </div>

      <ChevronRight size={14} className="flex-shrink-0 opacity-50" />
    </div>
  )
}

// ============================================================
// Conflict Item
// ============================================================

function ConflictItem({ conflict }: { conflict: ScheduleConflict }) {
  const typeLabels: Record<ScheduleConflict['type'], string> = {
    safety_override_required: '🛑 Safety Override Required',
    deadline_miss:            '⚠ Deadline Cannot Be Met',
    overlap:                  '⚠ Task Overlap',
    insufficient_recovery:    '⚠ Insufficient Recovery Time',
  }

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="font-medium text-warning-dark text-xs mt-0.5">{typeLabels[conflict.type]}</span>
      <span className="text-gray-700 text-xs">{conflict.description}</span>
    </li>
  )
}
