// ============================================================
// SHIFTShield 2.0 — Worker Safety Page (Mobile)
// Sub-Task 6 — Full Implementation
//
// The most critical worker page:
// - Prominent SOS button
// - SOS confirmation dialog with assistance type selection
// - Symptom reporting
// - Report unavailable water/shade
// - Safety instructions
//
// IMPORTANT: Does not imply automatic emergency services contact
// ============================================================

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Phone, AlertTriangle, Droplets, Trees,
  Heart, HelpCircle, CheckCircle, X,
  ChevronRight, Shield, Info
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import type { AlertType } from '@/types'

// ---- SOS assistance types ----------------------------------
const SOS_TYPES: { value: AlertType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'sos',
    label: 'General Assistance',
    description: 'I need help — any type of assistance',
    icon: <Phone size={18} />,
  },
  {
    value: 'heat_stress',
    label: 'Heat Stress Symptoms',
    description: 'Dizziness, nausea, cramps, heavy sweating or confusion',
    icon: <Heart size={18} />,
  },
  {
    value: 'injury',
    label: 'Injury',
    description: 'I have been injured on site',
    icon: <AlertTriangle size={18} />,
  },
]

const REPORT_TYPES: { value: AlertType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'water_unavailable',
    label: 'Drinking Water Unavailable',
    description: 'A water station is empty, broken or inaccessible',
    icon: <Droplets size={18} />,
  },
  {
    value: 'shade_unavailable',
    label: 'Shade Area Unavailable',
    description: 'A shaded recovery area is missing or blocked',
    icon: <Trees size={18} />,
  },
]

// ---- SOS dialog states ------------------------------------
type SosStep = 'idle' | 'confirm' | 'type_select' | 'sending' | 'done'

// ============================================================
// Main Component
// ============================================================

export default function WorkerSafetyPage() {
  const queryClient = useQueryClient()
  const [sosStep, setSosStep]               = useState<SosStep>('idle')
  const [selectedSosType, setSelectedSosType] = useState<AlertType>('sos')
  const [reportStep, setReportStep]         = useState<AlertType | null>(null)
  const [reportDone, setReportDone]         = useState<AlertType | null>(null)
  const [sosAlertId, setSosAlertId]         = useState<string | null>(null)

  // ---- SOS mutation ------------------------------------------
  const sosMutation = useMutation({
    mutationFn: (alertType: AlertType) => api.emergency.create({
      alert_type: alertType,
      notes: `Worker assistance request — ${alertType.replace('_', ' ')}`,
    }),
    onSuccess: (data) => {
      setSosAlertId(data.id)
      setSosStep('done')
      queryClient.invalidateQueries({ queryKey: ['emergency'] })
    },
  })

  // ---- Report mutation ----------------------------------------
  const reportMutation = useMutation({
    mutationFn: (alertType: AlertType) => api.emergency.create({
      alert_type: alertType,
      notes: `Worker report: ${alertType.replace('_', ' ')}`,
    }),
    onSuccess: (_, alertType) => {
      setReportStep(null)
      setReportDone(alertType)
      queryClient.invalidateQueries({ queryKey: ['emergency'] })
    },
  })

  const handleSosConfirm = () => setSosStep('type_select')
  const handleSosSubmit  = () => {
    setSosStep('sending')
    sosMutation.mutate(selectedSosType)
  }
  const handleSosReset   = () => {
    setSosStep('idle')
    setSelectedSosType('sos')
    setSosAlertId(null)
  }

  return (
    <div className="space-y-4 pb-6 pt-4">

      {/* ---- SOS Button ---- */}
      {sosStep === 'idle' && (
        <div className="mx-4">
          <button
            onClick={() => setSosStep('confirm')}
            className={clsx(
              'w-full rounded-2xl p-8 flex flex-col items-center gap-3',
              'bg-critical text-white shadow-lg active:scale-95 transition-transform',
              'focus:outline-none focus:ring-4 focus:ring-critical/30'
            )}
            aria-label="SOS — Request assistance"
          >
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30">
              <Phone size={36} />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black tracking-wide">SOS</p>
              <p className="text-sm opacity-90 mt-1">Tap to request assistance</p>
            </div>
          </button>

          <p className="text-xs text-secondary text-center mt-2">
            Only use in genuine emergencies. This will notify your supervisor immediately.
          </p>
        </div>
      )}

      {/* ---- SOS Step 1: Confirm ---- */}
      {sosStep === 'confirm' && (
        <div className="mx-4">
          <div className="bg-critical-light border border-critical/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-critical flex items-center justify-center text-white flex-shrink-0">
                <Phone size={22} />
              </div>
              <div>
                <p className="text-base font-bold text-critical-dark">Request Assistance?</p>
                <p className="text-sm text-critical-dark/80 mt-0.5">This will alert your supervisor.</p>
              </div>
            </div>

            <InfoBanner
              variant="error"
              icon={<Shield size={14} />}
              message="This system notifies your supervisor. It does not automatically contact emergency services. Call 000 (Australia) directly if life is in immediate danger."
            />

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1 bg-critical hover:bg-critical/90 focus:ring-critical/30"
                onClick={handleSosConfirm}
              >
                Yes, request help
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setSosStep('idle')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- SOS Step 2: Select type ---- */}
      {sosStep === 'type_select' && (
        <div className="mx-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setSosStep('confirm')} className="text-secondary">
              ← Back
            </button>
          </div>
          <p className="text-base font-bold text-gray-900">What type of assistance do you need?</p>
          <p className="text-sm text-secondary">Select the best description. Your supervisor will be notified.</p>

          <div className="space-y-2">
            {SOS_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedSosType(type.value)}
                className={clsx(
                  'w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-colors',
                  selectedSosType === type.value
                    ? 'border-critical bg-critical-light'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  selectedSosType === type.value ? 'bg-critical text-white' : 'bg-gray-100 text-secondary'
                )}>
                  {type.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                  <p className="text-xs text-secondary mt-0.5">{type.description}</p>
                </div>
                {selectedSosType === type.value && (
                  <CheckCircle size={18} className="text-critical ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full bg-critical hover:bg-critical/90 focus:ring-critical/30 mt-2"
            onClick={handleSosSubmit}
            loading={sosMutation.isPending}
          >
            Send Alert
          </Button>
        </div>
      )}

      {/* ---- SOS Done ---- */}
      {sosStep === 'done' && (
        <div className="mx-4">
          <div className="bg-success-light border border-success/20 rounded-2xl p-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-white mx-auto">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Alert Sent</p>
              <p className="text-sm text-secondary mt-1">
                Your supervisor has been notified. Help is on the way.
              </p>
              {sosAlertId && (
                <p className="text-xs text-secondary mt-2 font-mono">
                  Alert ID: {sosAlertId}
                </p>
              )}
            </div>
            <InfoBanner
              variant="info"
              icon={<Info size={14} />}
              message="Stay where you are if it is safe to do so. If life is in immediate danger, call 000 (Australia) immediately."
            />
            <Button variant="outline" size="md" className="w-full" onClick={handleSosReset}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ---- Report section ---- */}
      {sosStep === 'idle' && (
        <div className="mx-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Report a Problem</h3>
            <p className="text-xs text-secondary">Report missing resources or safety concerns.</p>
          </div>

          {reportDone && (
            <div className="bg-success-light border border-success/20 rounded-xl p-3 flex items-center gap-2 text-sm text-success-dark">
              <CheckCircle size={15} />
              Report sent — your supervisor has been notified.
              <button className="ml-auto" onClick={() => setReportDone(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {REPORT_TYPES.map(type => (
            <div key={type.value}>
              {reportStep === type.value ? (
                <div className="bg-white rounded-2xl shadow-card p-4 space-y-3 border-2 border-warning">
                  <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                  <p className="text-xs text-secondary">{type.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 bg-warning hover:bg-warning/90"
                      loading={reportMutation.isPending}
                      onClick={() => reportMutation.mutate(type.value)}
                    >
                      Confirm Report
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setReportStep(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 text-left"
                  onClick={() => setReportStep(type.value)}
                >
                  <div className="w-10 h-10 rounded-xl bg-warning-light text-warning-dark flex items-center justify-center flex-shrink-0">
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                    <p className="text-xs text-secondary truncate">{type.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-secondary flex-shrink-0" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---- Safety instructions ---- */}
      {sosStep === 'idle' && (
        <div className="mx-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Heat Safety Instructions</h3>
          <div className="bg-white rounded-2xl shadow-card divide-y divide-gray-50">
            {[
              { icon: <Droplets size={14} />, text: 'Drink 250ml of water every 20 minutes in the heat.' },
              { icon: <Trees size={14} />, text: 'Take shade breaks at least every 45 minutes of outdoor work.' },
              { icon: <AlertTriangle size={14} />, text: 'Report dizziness, nausea, cramps or confusion immediately.' },
              { icon: <HelpCircle size={14} />, text: 'Never work alone in extreme heat conditions.' },
              { icon: <Shield size={14} />, text: 'If unsure, use the SOS button above.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-accent mt-0.5 flex-shrink-0">{item.icon}</span>
                <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
