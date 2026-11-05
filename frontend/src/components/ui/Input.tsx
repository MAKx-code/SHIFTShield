// ============================================================
// SHIFTShield 2.0 — Design System: Input, Select, Textarea
// ============================================================

import { forwardRef } from 'react'
import { clsx } from 'clsx'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconRight,
  fullWidth = true,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-critical ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-input border text-sm text-gray-900 placeholder-gray-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error
              ? 'border-critical bg-critical-light focus:ring-critical-light'
              : 'border-gray-200 bg-white hover:border-gray-300',
            icon ? 'pl-9' : 'pl-3',
            iconRight ? 'pr-9' : 'pr-3',
            'py-2.5',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-critical-dark">{error}</p>}
      {hint && !error && <p className="text-xs text-secondary">{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'

// ---- Select --------------------------------------------------

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  fullWidth = true,
  options,
  placeholder,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-critical ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'block w-full rounded-input border text-sm text-gray-900',
          'transition-all duration-150 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error
            ? 'border-critical bg-critical-light'
            : 'border-gray-200 bg-white hover:border-gray-300',
          'pl-3 pr-8 py-2.5',
          'appearance-none bg-no-repeat',
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23526579' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 10px center',
          backgroundSize: '16px',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-critical-dark">{error}</p>}
      {hint && !error && <p className="text-xs text-secondary">{hint}</p>}
    </div>
  )
})
Select.displayName = 'Select'

// ---- Textarea ------------------------------------------------

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  fullWidth = true,
  className,
  id,
  ...props
}, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-critical ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={clsx(
          'block w-full rounded-input border text-sm text-gray-900 placeholder-gray-400',
          'transition-all duration-150 resize-y min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error
            ? 'border-critical bg-critical-light'
            : 'border-gray-200 bg-white hover:border-gray-300',
          'px-3 py-2.5',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-critical-dark">{error}</p>}
      {hint && !error && <p className="text-xs text-secondary">{hint}</p>}
    </div>
  )
})
Textarea.displayName = 'Textarea'
