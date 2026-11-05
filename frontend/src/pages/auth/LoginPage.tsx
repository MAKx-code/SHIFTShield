// ============================================================
// SHIFTShield 2.0 — Login Page
// Email + password auth with Demo Login quick buttons
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loginAsDemo, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      const profile = useAuthStore.getState().profile
      if (profile) {
        navigate(profile.role === 'supervisor' ? '/supervisor' : '/worker')
        toast.success(`Welcome back, ${profile.full_name.split(' ')[0]}!`)
      }
    } catch {
      // Error is shown via store.error
    }
  }

  const handleDemoLogin = async (role: 'supervisor' | 'worker') => {
    clearError()
    try {
      await loginAsDemo(role)
      navigate(role === 'supervisor' ? '/supervisor' : '/worker')
      toast.success(`Logged in as demo ${role}`)
    } catch {
      toast.error('Demo login failed')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-card">
            <Shield size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-primary">SHIFTShield 2.0</h1>
          <p className="text-sm text-secondary mt-1">Occupational Heat Safety Platform</p>
        </div>

        {/* Login form */}
        <div className="bg-card rounded-card shadow-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-critical-light border border-critical/20 rounded-lg">
              <p className="text-sm text-critical-dark">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError() }}
              placeholder="you@example.com"
              required
              autoComplete="email"
              icon={<Mail size={16} />}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); clearError() }}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              icon={<Lock size={16} />}
            />
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              iconRight={!isLoading ? <ArrowRight size={16} /> : undefined}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Demo Login section */}
        <div className="mt-4 bg-card rounded-card shadow-card p-5 border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">Demo Access</p>
          </div>
          <p className="text-xs text-secondary mb-4 leading-relaxed">
            Explore SHIFTShield with pre-loaded demonstration data. No credentials required.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => handleDemoLogin('supervisor')}
              loading={isLoading}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              Supervisor Demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => handleDemoLogin('worker')}
              loading={isLoading}
              className="border-accent/30 text-accent-700 hover:bg-accent-50"
            >
              Worker Demo
            </Button>
          </div>
          <div className="bg-background rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">Supervisor:</span>
              <code className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-0.5">supervisor@shiftshield.demo</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">Worker:</span>
              <code className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-0.5">worker01@shiftshield.demo</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">Password:</span>
              <code className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-0.5">ShiftShield2026!</code>
            </div>
          </div>
          {DEMO_MODE && (
            <p className="text-xs text-accent-700 mt-3 text-center font-medium">
              ✓ Running in Demo Mode — no external services required
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-secondary text-center mt-6">
          SHIFTShield 2.0 · Occupational Heat Safety Platform
        </p>
      </div>
    </div>
  )
}
