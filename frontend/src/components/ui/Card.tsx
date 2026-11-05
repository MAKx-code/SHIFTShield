// ============================================================
// SHIFTShield 2.0 — Design System: Card
// ============================================================

import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, onClick, hoverable = false, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      className={clsx(
        'bg-card rounded-card shadow-card',
        paddingClasses[padding],
        hoverable && 'card-hover cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, icon, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-background flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; label: string }
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'accent'
  onClick?: () => void
  loading?: boolean
}

const kpiVariantClasses = {
  default: 'border-l-4 border-primary',
  success: 'border-l-4 border-success',
  warning: 'border-l-4 border-warning',
  critical: 'border-l-4 border-critical',
  accent: 'border-l-4 border-accent',
}

const kpiIconClasses = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  critical: 'bg-critical-light text-critical-dark',
  accent: 'bg-accent-50 text-accent-700',
}

export function KpiCard({ title, value, subtitle, icon, trend, variant = 'default', onClick, loading = false }: KpiCardProps) {
  return (
    <Card
      className={clsx(kpiVariantClasses[variant], 'transition-all')}
      hoverable={!!onClick}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-secondary uppercase tracking-wide truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-secondary mt-1">{subtitle}</p>
          )}
          {trend && !loading && (
            <p className={clsx(
              'text-xs mt-1 font-medium',
              trend.value >= 0 ? 'text-success-dark' : 'text-critical-dark'
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3', kpiIconClasses[variant])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// Section divider used inside cards
export function CardDivider() {
  return <hr className="border-gray-100 my-4" />
}
