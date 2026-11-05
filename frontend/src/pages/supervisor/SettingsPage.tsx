// ============================================================
// SHIFTShield 2.0 — Settings (Supervisor)
// Sub-Task 7 — Full Implementation
//
// - Demo scenario switcher (A/B/C/D)
// - Reset Demo button
// - Demo mode info
// - Account info
// ============================================================

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RotateCcw, Play, CheckCircle,
  Sun, Thermometer, Zap, Phone,
  Info, LogOut, User, Shield
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, SimulatedDataBadge } from '@/components/ui/Badge'
import { InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { DemoScenario } from '@/types'

// ---- Scenario descriptions --------------------------------
const SCENARIOS: {
  id: DemoScenario
  title: string
  description: string
  details: string[]
  icon: React.ReactNode
  colour: string
  riskColour: string
}[] = [
  {
    id: 'A',
    title: 'Normal Conditions',
    description: 'Moderate temperature, all workers safe',
    details: ['Temperature: ~28°C', 'Humidity: ~55%', 'All workers safe', '0 active alerts'],
    icon: <Sun size={18} />,
    colour: 'border-success',
    riskColour: 'bg-success text-white',
  },
  {
    id: 'B',
    title: 'Elevated Heat Exposure',
    description: 'High temperature with moderate workload',
    details: ['Temperature: ~35°C', 'Humidity: ~72%', 'Several workers on recovery', '1 heat concern alert'],
    icon: <Thermometer size={18} />,
    colour: 'border-warning',
    riskColour: 'bg-warning text-white',
  },
  {
    id: 'C',
    title: 'High Workload in Heat',
    description: 'Very heavy outdoor tasks during hot conditions',
    details: ['Temperature: ~38°C', 'Humidity: ~78%', 'Multiple workers needing attention', '2 active alerts'],
    icon: <Zap size={18} />,
    colour: 'border-orange-400',
    riskColour: 'bg-orange-500 text-white',
  },
  {
    id: 'D',
    title: 'Worker Emergency (SOS)',
    description: 'Worker requests emergency assistance',
    details: ['Temperature: ~40°C', 'Humidity: ~82%', '1 active SOS alert', 'Emergency response required'],
    icon: <Phone size={18} />,
    colour: 'border-critical',
    riskColour: 'bg-critical text-white',
  },
]

// ============================================================
// Main Component
// ============================================================

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { profile, logout } = useAuthStore()
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(
    // Read from API's tracked state
    () => api.demo.getCurrentScenario()
  )
  const [resetDone, setResetDone] = useState(false)

  // ---- Set scenario mutation ---------------------------------
  const setScenarioMutation = useMutation({
    mutationFn: (scenario: DemoScenario) => api.demo.setScenario(scenario),
    onSuccess: (_, scenario) => {
      setActiveScenario(scenario)
      setResetDone(false)
      // Invalidate all queries so dashboard/workers/alerts refresh
      queryClient.invalidateQueries()
    },
  })

  // ---- Reset demo mutation -----------------------------------
  const resetMutation = useMutation({
    mutationFn: () => api.demo.reset(),
    onSuccess: () => {
      setActiveScenario(null)
      setResetDone(true)
      queryClient.invalidateQueries()
    },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-secondary mt-0.5">
          Manage your account and demonstration environment
        </p>
      </div>

      {/* Demo mode banner */}
      {isDemoMode && (
        <InfoBanner
          variant="info"
          icon={<Info size={14} />}
          title="Demo Mode Active"
          message="The application is running in demonstration mode with simulated data. All data is labelled as simulated and does not represent real safety outcomes."
        />
      )}

      {/* Account info */}
      <Card>
        <CardHeader
          title="Account"
          icon={<User size={16} />}
          subtitle="Your current session"
        />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-secondary">Name</span>
            <span className="font-medium text-gray-900">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary">Role</span>
            <Badge variant="info" size="sm" className="capitalize">{profile?.role || '—'}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary">Workplace ID</span>
            <span className="font-mono text-xs text-gray-700">{profile?.workplace_id || '—'}</span>
          </div>
          {isDemoMode && (
            <div className="flex justify-between items-center">
              <span className="text-secondary">Mode</span>
              <SimulatedDataBadge />
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={() => logout()}
            className="text-critical-dark border-critical/20 hover:bg-critical-light"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Demo scenario switcher */}
      {isDemoMode && (
        <Card>
          <CardHeader
            title="Demo Scenario Switcher"
            subtitle="Switch between pre-configured demonstration scenarios"
            icon={<Play size={16} />}
            action={
              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw size={13} />}
                onClick={() => resetMutation.mutate()}
                loading={resetMutation.isPending}
              >
                Reset Demo
              </Button>
            }
          />

          {resetDone && (
            <div className="mb-4 flex items-center gap-2 text-sm text-success-dark bg-success-light rounded-lg px-3 py-2">
              <CheckCircle size={14} />
              Demo data reset to default state
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCENARIOS.map(scenario => {
              const isActive = activeScenario === scenario.id
              const isLoading = setScenarioMutation.isPending && setScenarioMutation.variables === scenario.id

              return (
                <button
                  key={scenario.id}
                  onClick={() => setScenarioMutation.mutate(scenario.id)}
                  disabled={setScenarioMutation.isPending}
                  className={clsx(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    isActive
                      ? `${scenario.colour} bg-gray-50`
                      : 'border-gray-200 bg-white hover:border-gray-300',
                    setScenarioMutation.isPending && !isLoading && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Scenario letter */}
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm',
                      isActive ? scenario.riskColour : 'bg-gray-100 text-secondary'
                    )}>
                      {isLoading ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : scenario.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{scenario.title}</p>
                        {isActive && <CheckCircle size={13} className="text-success flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-secondary mt-0.5">{scenario.description}</p>
                      <ul className="mt-2 space-y-0.5">
                        {scenario.details.map((d, i) => (
                          <li key={i} className="text-xs text-secondary flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-secondary/40 flex-shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="text-xs text-secondary mt-3">
            Switching scenarios updates the dashboard, risk level, worker statuses and emergency alerts throughout the application.
            All data is clearly labelled as simulated.
          </p>
        </Card>
      )}

      {/* Demo accounts info */}
      <Card>
        <CardHeader
          title="Demo Accounts"
          icon={<Shield size={16} />}
          subtitle="Use these credentials for demonstration"
        />
        <div className="space-y-3 text-sm">
          {[
            { role: 'Supervisor', email: 'supervisor@shiftshield.demo', password: 'ShiftShield2026!' },
            { role: 'Worker',     email: 'worker01@shiftshield.demo',   password: 'ShiftShield2026!' },
          ].map(account => (
            <div key={account.role} className="bg-background rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={account.role === 'Supervisor' ? 'info' : 'default'} size="sm">
                  {account.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary text-xs">Email</span>
                <span className="font-mono text-xs text-gray-700">{account.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary text-xs">Password</span>
                <span className="font-mono text-xs text-gray-700">{account.password}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* App version */}
      <div className="text-center">
        <p className="text-xs text-secondary">SHIFTShield 2.0 · AI-Powered Occupational Safety Platform</p>
        <p className="text-xs text-secondary/60 mt-0.5">Hackathon demonstration build · All demo data is simulated</p>
      </div>
    </div>
  )
}
