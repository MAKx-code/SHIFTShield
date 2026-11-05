// ============================================================
// SHIFTShield 2.0 — Supervisor Shell
// Fixed left sidebar + top bar + main content area
// ============================================================

import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Activity, Users, Calendar, MapPin, AlertTriangle,
  BarChart2, FileText, Settings, Bell, LogOut, ChevronLeft, ChevronRight,
  Shield, Menu, X
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { format } from 'date-fns'

const NAV_ITEMS = [
  { to: '/supervisor', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/supervisor/risk', label: 'Live Risk Monitor', icon: Activity },
  { to: '/supervisor/workforce', label: 'Workforce', icon: Users },
  { to: '/supervisor/scheduler', label: 'Smart Scheduler', icon: Calendar },
  { to: '/supervisor/resources', label: 'Cooling Resources', icon: MapPin },
  { to: '/supervisor/emergency', label: 'Emergency Centre', icon: AlertTriangle },
  { to: '/supervisor/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/supervisor/audit-log', label: 'Safety Action Log', icon: FileText },
  { to: '/supervisor/settings', label: 'Settings', icon: Settings },
]

export default function SupervisorShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const { profile, logout } = useAuthStore()
  const navigate = useNavigate()

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 30000,
  })

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-primary text-white sidebar-transition',
        'lg:relative lg:z-auto',
        collapsed ? 'w-16' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'transition-transform lg:transition-none duration-300'
      )}>
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 flex-shrink-0 border-b border-white/10',
          collapsed ? 'justify-center px-0' : 'px-5 gap-3'
        )}>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">SHIFTShield</p>
              <p className="text-xs text-white/50 leading-tight">Safety Platform</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-150 group',
                    isActive
                      ? 'bg-accent/20 text-accent border border-accent/20'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {/* Emergency dot indicator */}
                  {item.to === '/supervisor/emergency' && unreadCount > 0 && !collapsed && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-critical text-white text-xs flex items-center justify-center flex-shrink-0">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {/* Profile */}
          <div className={clsx(
            'flex items-center gap-3 px-2 py-2',
            collapsed && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
              {profile?.full_name?.[0] || 'S'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-white/50">Supervisor</p>
              </div>
            )}
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
              'text-white/60 hover:text-white hover:bg-white/10 transition-colors',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary border-2 border-white/20 items-center justify-center text-white hover:bg-secondary transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-30">
          {/* Left: mobile menu + location */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-secondary"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <p className="text-xs text-secondary leading-tight">Riverside Construction Site</p>
              <p className="text-xs font-medium text-gray-900">{format(now, 'EEEE d MMMM yyyy')} · {format(now, 'HH:mm')}</p>
            </div>
          </div>

          {/* Right: notifications + profile */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <NotificationBell count={unreadCount} />
            {/* Profile chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {profile?.full_name?.[0] || 'S'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-gray-900 leading-tight">{profile?.full_name}</p>
                <p className="text-xs text-secondary">Supervisor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// ---- Notification Bell dropdown ----------------------------

function NotificationBell({ count }: { count: number }) {
  const [open, setOpen] = useState(false)
  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 30000,
  })

  const handleMarkRead = async (id: string) => {
    await api.notifications.markRead(id)
    refetch()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-secondary transition-colors"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-critical text-white text-xs flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-card shadow-modal border border-gray-200 animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {count > 0 && <Badge variant="critical" size="sm">{count} unread</Badge>}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {!notifications?.length ? (
                <p className="text-sm text-secondary text-center py-6">No notifications</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={clsx(
                      'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                      !n.read && 'bg-accent-50/30'
                    )}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
