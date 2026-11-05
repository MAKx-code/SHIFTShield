// ============================================================
// SHIFTShield 2.0 — Worker Profile Page (Mobile)
// Sub-Task 6 — Full Implementation
//
// Displays the worker's profile, acclimatisation info,
// site risk context, and a logout button.
// ============================================================

import { useQuery } from '@tanstack/react-query'
import {
  User, LogOut, Shield, Activity,
  Sun, CheckCircle
} from 'lucide-react'
import { Badge, RiskBadge, WorkerStatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { WorkerStatus } from '@/types'

export default function WorkerProfilePage() {
  const { profile: user, logout } = useAuthStore()

  // ---- Fetch my worker record --------------------------------
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn:  () => api.workers.list(),
  })

  // Find the current user's worker record (first match in demo mode)
  const workerRecord = workers.find(w => w.id === user?.id) || workers[0]

  // ---- Fetch dashboard for site risk -------------------------
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => api.dashboard.overview(),
  })

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="space-y-4 pb-6 pt-4">
      {/* Profile card */}
      <div className="mx-4">
        <div className="bg-primary rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate">{user?.full_name || 'Worker'}</p>
              <p className="text-sm text-white/70 mt-0.5">{workerRecord?.job_title || 'Site Worker'}</p>
              <p className="text-xs text-white/50 mt-1 font-mono">{user?.id}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {workerRecord && <WorkerStatusBadge status={workerRecord.status} />}
            <Badge variant="outline" className="border-white/30 text-white/80 bg-transparent">
              Worker
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {isLoading ? (
        <div className="mx-4"><Skeleton className="h-20 rounded-2xl" /></div>
      ) : workerRecord && (
        <div className="grid grid-cols-3 gap-2 px-4">
          <div className="bg-white rounded-2xl shadow-card p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{workerRecord.acclimatisation_days}</p>
            <p className="text-xs text-secondary mt-0.5">Acclimatised days</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-3 text-center">
            <p className="text-xl font-bold text-gray-900">
              {workerRecord.status === 'safe' ? '✓' : '!'}
            </p>
            <p className="text-xs text-secondary mt-0.5">Status</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-3 text-center">
            <p className="text-xl font-bold text-gray-900">
              {dashboard?.site_risk_level?.charAt(0).toUpperCase() || '—'}
            </p>
            <p className="text-xs text-secondary mt-0.5">Site risk</p>
          </div>
        </div>
      )}

      {/* Site info */}
      {dashboard && (
        <div className="mx-4">
          <div className="bg-white rounded-2xl shadow-card divide-y divide-gray-50">
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-secondary">Site Risk Level</p>
                <div className="mt-0.5">
                  <RiskBadge level={dashboard.site_risk_level} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
                <Activity size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-secondary">Active Workers</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{dashboard.total_active_workers}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-success-light flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} className="text-success-dark" />
              </div>
              <div>
                <p className="text-xs text-secondary">Safe Workers</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{dashboard.workforce_status.safe}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heat safety reminder */}
      <div className="mx-4">
        <div className="bg-accent-50 border border-accent/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Sun size={16} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-accent-700">Heat Acclimatisation</p>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                After {workerRecord?.acclimatisation_days || 0} days working in this environment, your body is
                {(workerRecord?.acclimatisation_days || 0) >= 7
                  ? ' well-acclimatised. Continue to follow all safety guidelines.'
                  : ' still adapting. Take extra care during hot conditions.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-card text-critical-dark font-medium text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="px-4 text-center">
        <p className="text-xs text-secondary">SHIFTShield 2.0</p>
        <p className="text-xs text-secondary/60">Occupational Heat Safety Platform</p>
      </div>
    </div>
  )
}
