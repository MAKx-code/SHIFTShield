// ============================================================
// SHIFTShield 2.0 — Worker Shell
// Mobile-first layout with bottom navigation
// ============================================================

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Home, ClipboardList, AlertOctagon, MapPin, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Shield } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/worker', label: 'Home', icon: Home, end: true },
  { to: '/worker/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/worker/safety', label: 'Safety', icon: AlertOctagon },
  { to: '/worker/map', label: 'Map', icon: MapPin },
  { to: '/worker/profile', label: 'Profile', icon: User },
]

export default function WorkerShell() {
  const { profile, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen bg-background max-w-[430px] mx-auto relative">
      {/* Top bar */}
      <header className="h-14 bg-primary flex items-center justify-between px-4 flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">SHIFTShield</p>
            <p className="text-xs text-white/50 leading-tight">Worker App</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-white leading-tight">{profile?.full_name?.split(' ')[0]}</p>
            <button
              onClick={handleLogout}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-white font-semibold text-sm">
            {profile?.full_name?.[0] || 'W'}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="h-16 bg-white border-t border-gray-200 flex items-center flex-shrink-0 z-20 safe-bottom">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px]',
              'transition-colors duration-150',
              isActive ? 'text-primary' : 'text-secondary hover:text-gray-700',
              // Safety tab gets special treatment
              item.to === '/worker/safety' && isActive && 'text-critical'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={clsx(
                    'flex-shrink-0',
                    item.to === '/worker/safety' && isActive ? 'text-critical' :
                    item.to === '/worker/safety' ? 'text-critical/60' : ''
                  )}
                />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
