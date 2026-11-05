// ============================================================
// SHIFTShield 2.0 — Live Risk Monitor (Supervisor)
// Sub-Task 4 — Full Implementation
//
// Interactive occupational heat exposure concern assessment.
// Inputs → POST /api/risk/assess → Explainable risk result
// History → GET /api/risk/history
//
// IMPORTANT: All output is labelled as "Estimated Heat
// Exposure Concern" — NOT a WBGT measurement.
// ============================================================

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Thermometer, Droplets, Sun,
  AlertTriangle, CheckCircle, Clock, Info, RefreshCw,
  ChevronDown, ChevronUp, Activity, Shield
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Badge, RiskBadge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { InfoBanner, Toggle } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'
import type { RiskAssessRequest, RiskAssessResponse, RiskLevel, Workload, Environment, RiskAssessment } from '@/types'
import { isDemoMode } from '@/lib/supabase'

// ---- Design tokens ----------------------------------------

const RISK_STYLES: Record<RiskLevel, { bg: string; border: string; text: string; icon: string; label: string }> = {
  low:      { bg: 'bg-success-light', border: 'border-success', text: 'text-success-dark', icon: '🟢', label: 'Low Risk' },
  moderate: { bg: 'bg-warning-light', border: 'border-warning', text: 'text-warning-dark', icon: '🟡', label: 'Moderate Risk' },
  elevated: { bg: 'bg-orange-50',     border: 'border-orange-400', text: 'text-orange-700', icon: '🟠', label: 'Elevated Risk' },
  high:     { bg: 'bg-critical-light', border: 'border-critical', text: 'text-critical-dark', icon: '🔴', label: 'High Risk' },
}

const WORKLOAD_OPTIONS = [
  { value: 'light',      label: 'Light — desk work, supervision, walking' },
  { value: 'moderate',   label: 'Moderate — steady manual work, equipment operation' },
  { value: 'heavy',      label: 'Heavy — digging, lifting, sustained exertion' },
  { value: 'very_heavy', label: 'Very Heavy — intense sustained labour, emergency response' },
]

const ENVIRONMENT_OPTIONS = [
  { value: 'outdoor_sun',   label: 'Outdoor — Direct sunlight (unshaded)' },
  { value: 'outdoor_shade', label: 'Outdoor — Shaded (covered area)' },
  { value: 'indoor',        label: 'Indoor — enclosed building' },
]

// ---- Default form values ----------------------------------

const DEFAULT_FORM: RiskAssessRequest = {
  temperature: 30,
  humidity: 60,
  workload: 'moderate',
  duration_mins: 60,
  environment: 'outdoor_sun',
  acclimatisation_days: undefined,
  workplace_id: 'wp-001',
}

// ===========================================================
// Main component
// ===========================================================

export default function RiskMonitorPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<RiskAssessRequest>(DEFAULT_FORM)
  const [acclimatisationEnabled, setAcclimatisationEnabled] = useState(false)
  const [latestResult, setLatestResult] = useState<RiskAssessResponse | null>(null)

  // ---- Fetch current weather to pre-fill inputs -----------
  const { data: weather } = useQuery({
    queryKey: ['weather-current'],
    queryFn: () => api.weather.current(),
    refetchInterval: 300000,
    staleTime: 60000,
  })

  // ---- Auto-fill temperature/humidity from live weather ---
  const handleUseCurrentConditions = useCallback(() => {
    if (weather) {
      setForm(prev => ({
        ...prev,
        temperature: Math.round(weather.temperature_c * 10) / 10,
        humidity: Math.round(weather.humidity_pct),
      }))
    }
  }, [weather])

  // ---- Risk assessment mutation ---------------------------
  const assessMutation = useMutation({
    mutationFn: (req: RiskAssessRequest) => api.risk.assess(req),
    onSuccess: (data: RiskAssessResponse) => {
      setLatestResult(data)
      queryClient.invalidateQueries({ queryKey: ['risk-history'] })
    },
  })

  // ---- Risk history query ---------------------------------
  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['risk-history'],
    queryFn: () => api.risk.history(),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: RiskAssessRequest = {
      ...form,
      acclimatisation_days: acclimatisationEnabled ? (form.acclimatisation_days ?? 0) : undefined,
    }
    assessMutation.mutate(payload)
  }

  const handleReset = () => {
    setForm(DEFAULT_FORM)
    setLatestResult(null)
    setAcclimatisationEnabled(false)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Risk Monitor</h1>
          <p className="text-sm text-secondary mt-0.5">
            Generate an explainable heat exposure concern assessment based on current site conditions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDemoMode && <SimulatedDataBadge />}
          <Badge variant="outline" size="sm" className="text-secondary">
            <Shield size={10} className="mr-1" />
            Not a WBGT measurement
          </Badge>
        </div>
      </div>

      {/* Important notice banner */}
      <InfoBanner
        variant="info"
        icon={<Info size={16} />}
        title="Assessment Methodology"
        message="This tool generates an Estimated Heat Exposure Concern using a deterministic scoring model. It is not a medically validated measurement (such as WBGT). Use it as a decision-support tool alongside your site heat management policy and qualified occupational health guidance."
      />

      {/* Main layout: inputs + result */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ---- INPUT PANEL ---- */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Assessment Inputs"
              subtitle="Enter current conditions and workload"
              icon={<Thermometer size={16} />}
              action={
                weather && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<RefreshCw size={12} />}
                    onClick={handleUseCurrentConditions}
                    title="Fill from live weather data"
                  >
                    Use live data
                  </Button>
                )
              }
            />

            {/* Current weather chip */}
            {weather && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-background rounded-lg text-xs text-secondary">
                <Thermometer size={12} className="text-critical flex-shrink-0" />
                <span>
                  Live: <strong className="text-gray-900">{weather.temperature_c}°C</strong>,{' '}
                  <strong className="text-gray-900">{weather.humidity_pct}%</strong> humidity
                </span>
                <span className={clsx(
                  'ml-auto px-1.5 py-0.5 rounded text-xs',
                  weather.source === 'open_meteo' ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
                )}>
                  {weather.source === 'open_meteo' ? 'Live' : weather.source === 'cached' ? 'Cached' : 'Demo'}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Temperature slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Thermometer size={14} className="text-critical" />
                    Air Temperature
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form.temperature}
                      onChange={e => setForm(p => ({ ...p, temperature: parseFloat(e.target.value) || 0 }))}
                      className="w-16 text-right text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
                      min={-10} max={60} step={0.5}
                    />
                    <span className="text-sm text-secondary">°C</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={-10} max={50} step={0.5}
                    value={form.temperature}
                    onChange={e => setForm(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #12B8A6 0%, #F2A93B ${((form.temperature + 10) / 60) * 100}%, #e5e7eb ${((form.temperature + 10) / 60) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-secondary mt-1">
                    <span>-10°C</span>
                    <span className={clsx(
                      'font-medium',
                      form.temperature >= 38 ? 'text-critical' :
                      form.temperature >= 35 ? 'text-orange-600' :
                      form.temperature >= 32 ? 'text-warning-dark' : 'text-success-dark'
                    )}>
                      {form.temperature >= 38 ? 'Very Hot' : form.temperature >= 35 ? 'Hot' : form.temperature >= 32 ? 'Warm' : form.temperature >= 28 ? 'Mild' : 'Cool'}
                    </span>
                    <span>50°C</span>
                  </div>
                </div>
              </div>

              {/* Humidity slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Droplets size={14} className="text-accent" />
                    Relative Humidity
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form.humidity}
                      onChange={e => setForm(p => ({ ...p, humidity: parseFloat(e.target.value) || 0 }))}
                      className="w-16 text-right text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
                      min={0} max={100} step={1}
                    />
                    <span className="text-sm text-secondary">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0} max={100} step={1}
                  value={form.humidity}
                  onChange={e => setForm(p => ({ ...p, humidity: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #12B8A6 0%, #526579 ${form.humidity}%, #e5e7eb ${form.humidity}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-secondary">
                  <span>0%</span>
                  <span className={clsx(
                    'font-medium',
                    form.humidity >= 75 ? 'text-critical' :
                    form.humidity >= 65 ? 'text-warning-dark' : 'text-success-dark'
                  )}>
                    {form.humidity >= 75 ? 'Very High' : form.humidity >= 65 ? 'Elevated' : form.humidity >= 50 ? 'Moderate' : 'Low'}
                  </span>
                  <span>100%</span>
                </div>
              </div>

              {/* Workload */}
              <Select
                label="Physical Workload"
                options={WORKLOAD_OPTIONS}
                value={form.workload}
                onChange={e => setForm(p => ({ ...p, workload: e.target.value as Workload }))}
                hint="Select the predominant physical demand of the work"
              />

              {/* Environment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Sun size={14} className="text-warning" />
                  Work Environment
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ENVIRONMENT_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-input border cursor-pointer transition-all',
                        form.environment === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300 text-secondary hover:text-gray-700'
                      )}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value={opt.value}
                        checked={form.environment === opt.value}
                        onChange={() => setForm(p => ({ ...p, environment: opt.value as Environment }))}
                        className="sr-only"
                      />
                      <span className={clsx(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                        form.environment === opt.value ? 'border-primary' : 'border-gray-300'
                      )}>
                        {form.environment === opt.value && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Clock size={14} className="text-secondary" />
                    Planned Exposure Duration
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={form.duration_mins}
                      onChange={e => setForm(p => ({ ...p, duration_mins: parseInt(e.target.value) || 1 }))}
                      className="w-16 text-right text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
                      min={1} max={480} step={15}
                    />
                    <span className="text-sm text-secondary">min</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={15} max={480} step={15}
                  value={form.duration_mins}
                  onChange={e => setForm(p => ({ ...p, duration_mins: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #12B8A6 0%, #526579 ${(form.duration_mins / 480) * 100}%, #e5e7eb ${(form.duration_mins / 480) * 100}%)`,
                  }}
                />
                <p className="text-xs text-secondary">
                  {form.duration_mins < 60 ? `${form.duration_mins} min` :
                   form.duration_mins < 120 ? `${(form.duration_mins / 60).toFixed(1)} hr` :
                   `${(form.duration_mins / 60).toFixed(1)} hrs`}
                  {form.duration_mins > 120 ? ' — extended exposure' :
                   form.duration_mins > 90 ? ' — prolonged' : ''}
                </p>
              </div>

              {/* Acclimatisation toggle */}
              <div className="space-y-3">
                <Toggle
                  checked={acclimatisationEnabled}
                  onChange={setAcclimatisationEnabled}
                  label="Worker acclimatisation known"
                />
                {acclimatisationEnabled && (
                  <div className="pl-10 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Days acclimatised to heat</label>
                      <span className="text-sm font-semibold text-gray-900">
                        {form.acclimatisation_days ?? 0} days
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0} max={28} step={1}
                      value={form.acclimatisation_days ?? 0}
                      onChange={e => setForm(p => ({ ...p, acclimatisation_days: parseInt(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #DC4545 0%, #16A36A ${((form.acclimatisation_days ?? 0) / 28) * 100}%, #e5e7eb ${((form.acclimatisation_days ?? 0) / 28) * 100}%)`,
                      }}
                    />
                    <p className="text-xs text-secondary">
                      {(form.acclimatisation_days ?? 0) < 5
                        ? 'Limited acclimatisation — adds to risk score'
                        : 'Sufficient acclimatisation — no additional risk added'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  fullWidth
                  loading={assessMutation.isPending}
                  icon={<Activity size={15} />}
                >
                  Assess Risk
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={assessMutation.isPending}
                >
                  Reset
                </Button>
              </div>

              {assessMutation.isError && (
                <InfoBanner
                  variant="error"
                  message="Assessment failed. Check backend connection and try again."
                />
              )}
            </form>
          </Card>
        </div>

        {/* ---- RESULT PANEL ---- */}
        <div className="xl:col-span-3 space-y-4">

          {/* No result yet */}
          {!latestResult && !assessMutation.isPending && (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Ready to Assess</h3>
              <p className="text-sm text-secondary max-w-xs">
                Configure the inputs on the left and click <strong>Assess Risk</strong> to generate
                an explainable heat exposure concern rating.
              </p>
              {weather && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  icon={<RefreshCw size={14} />}
                  onClick={() => { handleUseCurrentConditions(); }}
                >
                  Load live site conditions
                </Button>
              )}
            </Card>
          )}

          {/* Loading */}
          {assessMutation.isPending && (
            <Card className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="text" className="h-4" style={{ width: `${70 + i * 10}%` }} />
                ))}
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="text" className="h-4 w-full" />
                ))}
              </div>
            </Card>
          )}

          {/* Risk result card */}
          {latestResult && !assessMutation.isPending && (
            <RiskResultCard result={latestResult} />
          )}

          {/* Risk history */}
          <RiskHistoryPanel history={history} isLoading={histLoading} />
        </div>
      </div>
    </div>
  )
}

// ===========================================================
// Risk Result Card
// ===========================================================

function RiskResultCard({ result }: { result: RiskAssessResponse }) {
  const [showAllRecs, setShowAllRecs] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const style = RISK_STYLES[result.risk_level]
  const visibleRecs = showAllRecs ? result.recommendations : result.recommendations.slice(0, 3)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Risk level header */}
      <Card className={clsx('border-2', style.border)}>
        <div className={clsx('flex items-start gap-4 p-5 rounded-t-card -mt-5 -mx-5 mb-5', style.bg)}>
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0')}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={clsx('text-lg font-bold', style.text)}>
                {style.label}
              </h2>
              <Badge
                variant={
                  result.risk_level === 'high' ? 'critical' :
                  result.risk_level === 'elevated' ? 'elevated' :
                  result.risk_level === 'moderate' ? 'warning' : 'success'
                }
              >
                Estimated Heat Exposure Concern
              </Badge>
            </div>
            <p className="text-sm text-secondary mt-1 leading-relaxed">
              {result.explanation}
            </p>
          </div>
        </div>

        {/* Data source + timestamp */}
        <div className="flex items-center justify-between text-xs text-secondary mb-4 pb-4 border-b border-gray-100">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Assessed {format(new Date(result.assessed_at), 'HH:mm, d MMM yyyy')}
          </span>
          <span className="truncate ml-4 max-w-xs text-right">{result.data_source}</span>
        </div>

        {/* Contributing factors */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Contributing Factors ({result.contributing_factors.length})
          </h3>
          <div className="space-y-2">
            {result.contributing_factors.map((factor, i) => {
              const [name, detail] = factor.split(' — ')
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className={clsx(
                    'w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5',
                    result.risk_level === 'high' ? 'bg-critical-light text-critical-dark' :
                    result.risk_level === 'elevated' ? 'bg-orange-100 text-orange-700' :
                    result.risk_level === 'moderate' ? 'bg-warning-light text-warning-dark' :
                    'bg-success-light text-success-dark'
                  )}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    {detail && <p className="text-xs text-secondary mt-0.5 leading-relaxed">{detail}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Recommended Actions
          </h3>
          <ol className="space-y-2">
            {visibleRecs.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle
                  size={16}
                  className={clsx(
                    'flex-shrink-0 mt-0.5',
                    result.risk_level === 'high' ? 'text-critical' :
                    result.risk_level === 'elevated' ? 'text-orange-500' :
                    result.risk_level === 'moderate' ? 'text-warning' : 'text-success'
                  )}
                />
                <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ol>
          {result.recommendations.length > 3 && (
            <button
              onClick={() => setShowAllRecs(v => !v)}
              className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              {showAllRecs ? (
                <><ChevronUp size={12} /> Show fewer</>
              ) : (
                <><ChevronDown size={12} /> Show all {result.recommendations.length} recommendations</>
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="border border-gray-200 rounded-card overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setShowDisclaimer(v => !v)}
        >
          <div className="flex items-center gap-2 text-secondary">
            <Info size={14} />
            <span className="text-xs font-medium">Assessment Limitations & Disclaimer</span>
          </div>
          {showDisclaimer ? <ChevronUp size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
        </button>
        {showDisclaimer && (
          <div className="px-4 pb-4 bg-gray-50 animate-fade-in">
            <p className="text-xs text-secondary leading-relaxed">{result.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================================
// Risk History Panel
// ===========================================================

function RiskHistoryPanel({
  history,
  isLoading,
}: {
  history: RiskAssessment[] | undefined
  isLoading: boolean
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Assessments</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" variant="circle" />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="h-3 w-32" />
                <Skeleton variant="text" className="h-3 w-24" />
              </div>
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!history?.length) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-secondary">No previous assessments. Run your first assessment above.</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Recent Assessments
        <span className="text-xs text-secondary font-normal ml-2">({history.length} records)</span>
      </h3>
      <div className="space-y-2">
        {history.map((item) => {
          const style = RISK_STYLES[item.risk_level]
          const isOpen = expanded === item.id
          return (
            <div key={item.id} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <span className={clsx('text-base flex-shrink-0', style.icon)}>{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 capitalize">{item.risk_level} risk</p>
                  <p className="text-xs text-secondary">
                    {item.workload.replace('_', ' ')} workload · {item.exposure_mins} min
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-xs text-secondary hidden sm:block">
                    {formatDistanceToNow(new Date(item.assessed_at), { addSuffix: true })}
                  </p>
                  {isOpen ? <ChevronUp size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 bg-gray-50 animate-fade-in">
                  <p className="text-xs text-secondary leading-relaxed mb-2">{item.explanation}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.contributing_factors.slice(0, 4).map((f, i) => (
                      <span key={i} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-700">
                        {f.split(' — ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
