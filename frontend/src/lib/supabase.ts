// ============================================================
// SHIFTShield 2.0 — Supabase Client
// Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Gracefully no-ops in demo mode (keys absent)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// Provide placeholder values in demo mode so createClient doesn't throw
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = isDemoMode
  ? null
  : createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

export { isDemoMode }
