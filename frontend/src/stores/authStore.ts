// ============================================================
// SHIFTShield 2.0 — Auth Store (Zustand)
// Manages authentication state and role-based routing
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types'
import { supabase, isDemoMode } from '@/lib/supabase'

// Demo user profiles
const DEMO_SUPERVISOR: Profile & { token: string } = {
  id: 'sup-001',
  full_name: 'Alex Morgan',
  role: 'supervisor',
  workplace_id: 'wp-001',
  created_at: '2026-01-01T00:00:00Z',
  token: 'demo-supervisor-token',
}

const DEMO_WORKER: Profile & { token: string } = {
  id: 'wk-001',
  full_name: 'Marcus Johnson',
  role: 'worker',
  workplace_id: 'wp-001',
  created_at: '2026-01-15T08:00:00Z',
  token: 'demo-worker-token',
}

interface AuthState {
  profile: Profile | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  loginAsDemo: (role: 'supervisor' | 'worker') => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          if (isDemoMode || !supabase) {
            // Demo mode: check against known demo accounts
            const isSuper = email === 'supervisor@shiftshield.demo'
            const isWorker = email === 'worker01@shiftshield.demo'
            const validPassword = password === 'ShiftShield2026!'
            if ((isSuper || isWorker) && validPassword) {
              const profile = isSuper ? DEMO_SUPERVISOR : DEMO_WORKER
              localStorage.setItem('shiftshield_token', profile.token)
              set({ profile, token: profile.token, isLoading: false })
              return
            }
            throw new Error('Invalid email or password. Use the demo login buttons or check your credentials.')
          }

          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw new Error(error.message)
          if (!data.user || !data.session) throw new Error('Login failed — no session returned.')

          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError || !profileData) throw new Error('Could not load user profile.')

          const token = data.session.access_token
          localStorage.setItem('shiftshield_token', token)
          set({ profile: profileData as Profile, token, isLoading: false })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({ isLoading: false, error: message })
          throw err
        }
      },

      loginAsDemo: async (role: 'supervisor' | 'worker') => {
        set({ isLoading: true, error: null })
        await new Promise(resolve => setTimeout(resolve, 600))
        const profile = role === 'supervisor' ? DEMO_SUPERVISOR : DEMO_WORKER
        localStorage.setItem('shiftshield_token', profile.token)
        set({ profile, token: profile.token, isLoading: false })
      },

      logout: async () => {
        localStorage.removeItem('shiftshield_token')
        if (supabase) {
          await supabase.auth.signOut()
        }
        set({ profile: null, token: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'shiftshield-auth',
      partialize: (state) => ({ profile: state.profile, token: state.token }),
    }
  )
)
