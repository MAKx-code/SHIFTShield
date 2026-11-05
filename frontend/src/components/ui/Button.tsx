// ============================================================
// SHIFTShield 2.0 — Design System: Button
// ============================================================

import { forwardRef } from 'react'
import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-800 active:bg-primary-900 focus-visible:ring-primary-500',
  secondary: 'bg-secondary text-white hover:bg-secondary-700 active:bg-secondary-800 focus-visible:ring-secondary-400',
  ghost: 'bg-transparent text-secondary hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-300',
  danger: 'bg-critical text-white hover:bg-critical-dark active:bg-red-700 focus-visible:ring-red-400',
  success: 'bg-success text-white hover:bg-success-dark active:bg-green-700 focus-visible:ring-green-400',
  outline: 'bg-transparent border border-gray-200 text-secondary hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-300',
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1.5 text-xs rounded-md gap-1',
  sm: 'px-3.5 py-2 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-input gap-2',
  lg: 'px-6 py-3 text-base rounded-input gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  )
})

Button.displayName = 'Button'
