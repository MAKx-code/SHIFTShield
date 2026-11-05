// ============================================================
// SHIFTShield 2.0 — Design System: Skeleton loaders
// ============================================================

import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
  style?: React.CSSProperties
}

export function Skeleton({ className, variant = 'rect', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={clsx(
        'animate-pulse bg-gray-100',
        variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-lg',
        className
      )}
    />
  )
}

// ---- Page-level skeleton ------------------------------------

export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
        <div className="h-2.5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ---- KPI card skeleton --------------------------------------

export function KpiCardSkeleton() {
  return (
    <div className="bg-card rounded-card shadow-card p-5 border-l-4 border-gray-100">
      <Skeleton variant="text" className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton variant="text" className="h-3 w-32" />
    </div>
  )
}

// ---- Table row skeleton -------------------------------------

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" className={clsx('h-4', i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-24')} />
        </td>
      ))}
    </tr>
  )
}

// ---- Chart skeleton -----------------------------------------

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 justify-center px-4" style={{ height }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  )
}
