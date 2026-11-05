import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from '@/stores/authStore'
import PageSkeleton from '@/components/ui/Skeleton'

// ---- Auth pages -----------------------------------------------
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

// ---- Supervisor pages -----------------------------------------
const SupervisorShell = lazy(() => import('@/components/layout/SupervisorShell'))
const OverviewPage = lazy(() => import('@/pages/supervisor/OverviewPage'))
const RiskMonitorPage = lazy(() => import('@/pages/supervisor/RiskMonitorPage'))
const WorkforcePage = lazy(() => import('@/pages/supervisor/WorkforcePage'))
const SchedulerPage = lazy(() => import('@/pages/supervisor/SchedulerPage'))
const ResourceMapPage = lazy(() => import('@/pages/supervisor/ResourceMapPage'))
const EmergencyPage = lazy(() => import('@/pages/supervisor/EmergencyPage'))
const AnalyticsPage = lazy(() => import('@/pages/supervisor/AnalyticsPage'))
const AuditLogPage = lazy(() => import('@/pages/supervisor/AuditLogPage'))
const SettingsPage = lazy(() => import('@/pages/supervisor/SettingsPage'))

// ---- Worker pages ---------------------------------------------
const WorkerShell = lazy(() => import('@/components/layout/WorkerShell'))
const WorkerHomePage = lazy(() => import('@/pages/worker/WorkerHomePage'))
const WorkerTasksPage = lazy(() => import('@/pages/worker/WorkerTasksPage'))
const WorkerSafetyPage = lazy(() => import('@/pages/worker/WorkerSafetyPage'))
const WorkerMapPage = lazy(() => import('@/pages/worker/WorkerMapPage'))
const WorkerProfilePage = lazy(() => import('@/pages/worker/WorkerProfilePage'))

// ---- Protected route wrapper ----------------------------------
function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'supervisor' | 'worker' }) {
  const profile = useAuthStore(s => s.profile)
  if (!profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'supervisor' ? '/supervisor' : '/worker'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const profile = useAuthStore(s => s.profile)

  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={
            profile ? <Navigate to={profile.role === 'supervisor' ? '/supervisor' : '/worker'} replace /> : <LoginPage />
          } />

          {/* Supervisor routes */}
          <Route path="/supervisor" element={
            <RequireAuth role="supervisor"><SupervisorShell /></RequireAuth>
          }>
            <Route index element={<OverviewPage />} />
            <Route path="risk" element={<RiskMonitorPage />} />
            <Route path="workforce" element={<WorkforcePage />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="resources" element={<ResourceMapPage />} />
            <Route path="emergency" element={<EmergencyPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Worker routes */}
          <Route path="/worker" element={
            <RequireAuth role="worker"><WorkerShell /></RequireAuth>
          }>
            <Route index element={<WorkerHomePage />} />
            <Route path="tasks" element={<WorkerTasksPage />} />
            <Route path="safety" element={<WorkerSafetyPage />} />
            <Route path="map" element={<WorkerMapPage />} />
            <Route path="profile" element={<WorkerProfilePage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={
            profile
              ? <Navigate to={profile.role === 'supervisor' ? '/supervisor' : '/worker'} replace />
              : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
