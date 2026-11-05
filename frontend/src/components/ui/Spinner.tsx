// ============================================================
// SHIFTShield 2.0 — Design System: Spinner
// ============================================================

import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: string
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

export function Spinner({ size = 'md', className, color = 'text-primary' }: SpinnerProps) {
  return (
    <svg
      className={clsx('animate-spin', sizes[size], color, className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ---- Empty state component ----------------------------------

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-secondary mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-secondary max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---- Error state component ----------------------------------

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-critical-light flex items-center justify-center text-critical mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-secondary max-w-xs mb-4">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary font-medium hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// ---- Info / Alert banner ------------------------------------

interface InfoBannerProps {
  variant?: 'info' | 'warning' | 'error' | 'success'
  title?: string
  message: string
  icon?: React.ReactNode
  onDismiss?: () => void
  className?: string
}

const bannerVariants = {
  info: 'bg-accent-50 border-accent-200 text-accent-700',
  warning: 'bg-warning-light border-warning text-warning-dark',
  error: 'bg-critical-light border-critical text-critical-dark',
  success: 'bg-success-light border-success text-success-dark',
}

export function InfoBanner({ variant = 'info', title, message, icon, onDismiss, className }: InfoBannerProps) {
  return (
    <div className={clsx('flex items-start gap-3 px-4 py-3 rounded-lg border text-sm', bannerVariants[variant], className)}>
      {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ---- Toggle / Switch ----------------------------------------

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, label, disabled = false, size = 'md' }: ToggleProps) {
  const trackSize = size === 'sm' ? 'w-8 h-4' : 'w-11 h-6'
  const thumbSize = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'
  const thumbTranslate = size === 'sm'
    ? (checked ? 'translate-x-4' : 'translate-x-0.5')
    : (checked ? 'translate-x-5' : 'translate-x-0.5')

  return (
    <label className={clsx('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <div
        role="switch"
        aria-checked={checked}
        className={clsx(
          'relative flex-shrink-0 rounded-full transition-colors duration-200',
          trackSize,
          checked ? 'bg-primary' : 'bg-gray-300',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
        onClick={() => !disabled && onChange(!checked)}
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault()
            onChange(!checked)
          }
        }}
      >
        <span className={clsx(
          'absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200',
          thumbSize,
          thumbTranslate
        )} />
      </div>
      {label && <span className="text-sm text-gray-700 select-none">{label}</span>}
    </label>
  )
}
