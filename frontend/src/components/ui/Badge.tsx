// ============================================================
// SHIFTShield 2.0 — Design System: Badge
// ============================================================

import { clsx } from 'clsx'
import type { RiskLevel, WorkerStatus, AlertStatus, ResourceStatus } from '@/types'

type BadgeVariant = 'default' | 'success' | 'warning' | 'critical' | 'elevated' | 'info' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  critical: 'bg-critical-light text-critical-dark',
  elevated: 'bg-orange-100 text-orange-700',
  info: 'bg-accent-50 text-accent-700',
  outline: 'bg-transparent border border-gray-200 text-secondary',
}

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical',
  elevated: 'bg-orange-500',
  info: 'bg-accent',
  outline: 'bg-gray-400',
}

export function Badge({ variant = 'default', size = 'md', dot = false, children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 font-medium rounded-badge whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      variantClasses[variant],
      className
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClasses[variant])} />}
      {children}
    </span>
  )
}

// ---- Semantic badge helpers ----------------------------------

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { variant: BadgeVariant; label: string }> = {
    low: { variant: 'success', label: 'Low Risk' },
    moderate: { variant: 'warning', label: 'Moderate Risk' },
    elevated: { variant: 'elevated', label: 'Elevated Risk' },
    high: { variant: 'critical', label: 'High Risk' },
  }
  const { variant, label } = map[level]
  return <Badge variant={variant} dot>{label}</Badge>
}

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  const map: Record<WorkerStatus, { variant: BadgeVariant; label: string }> = {
    safe: { variant: 'success', label: 'Safe' },
    attention: { variant: 'warning', label: 'Needs Attention' },
    recovery: { variant: 'info', label: 'Recovery Break' },
    sos: { variant: 'critical', label: 'SOS — Assistance' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'critical', label: 'Active' },
    acknowledged: { variant: 'warning', label: 'Acknowledged' },
    responding: { variant: 'info', label: 'Responding' },
    resolved: { variant: 'success', label: 'Resolved' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

export function ResourceStatusBadge({ status }: { status: ResourceStatus }) {
  const map: Record<ResourceStatus, { variant: BadgeVariant; label: string }> = {
    available: { variant: 'success', label: 'Available' },
    unavailable: { variant: 'critical', label: 'Unavailable' },
    unverified: { variant: 'outline', label: 'Unverified' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function SimulatedDataBadge() {
  return (
    <Badge variant="outline" className="text-xs text-secondary border-dashed">
      ⚠ Simulated Data
    </Badge>
  )
}
