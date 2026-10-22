import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../services/authService'
import { LoadingState } from '../components/feedback/LoadingState'
import { NetworkBackground } from '../background/NetworkBackground'
import { AuthPage } from '../pages/Auth/AuthPage'
import { ActivationPage } from '../pages/Activation/ActivationPage'
import { lazy, Suspense } from 'react'

const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })))
import { UsersPage } from '../pages/Users/UsersPage'
import { SessionsPage } from '../pages/Sessions/SessionsPage'
import { MonitoringPage } from '../pages/Monitoring/MonitoringPage'
import { SettingsPage } from '../pages/Settings/SettingsPage'
import { AboutPage } from '../pages/About/AboutPage'
import { ErrorPage } from '../pages/Error/ErrorPage'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AppButton } from '../components/common/AppButton'
import type { ReactNode } from 'react'

function RootRedirect() {
  const { activated, authenticated, denied } = useAuth()
  return <Navigate to={!activated ? '/activate' : denied ? '/error/403' : authenticated ? '/dashboard' : '/login'} replace/>
}
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { activated, authenticated, denied } = useAuth()
  const location = useLocation()
  if (!activated) return <Navigate to="/activate" replace/>
  if (denied) return <Navigate to="/error/403" replace/>
  if (!authenticated) return <Navigate to="/error/401" state={{ from: location.pathname }} replace/>
  return <>{children}</>
}
function BootstrapFailure({ message }: { message: string }) {
  return <div className="bootstrap-failure"><h1>Unable to connect</h1><p>{message}</p><AppButton onClick={() => window.location.reload()}>Try Again</AppButton></div>
}
export function AppRouter() {
  const { loading, bootstrapError, bootServerError } = useAuth()
  if (loading) return <div className="startup-loading"><NetworkBackground/><LoadingState text="Checking activation and authentication…"/></div>
  if (bootServerError) return <div className="app-root"><NetworkBackground/><ErrorPage status="500"/></div>
  if (bootstrapError) return <div className="app-root"><NetworkBackground/><BootstrapFailure message={bootstrapError}/></div>
  return <div className="app-root"><NetworkBackground/><div className="app-foreground"><Routes>
    <Route path="/" element={<RootRedirect/>}/>
    <Route path="/activate" element={<ActivationPage/>}/>
    <Route path="/login" element={<AuthPage/>}/>
    <Route element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>
      <Route path="/dashboard" element={<Suspense fallback={<LoadingState text="Loading dashboard…"/>}><DashboardPage/></Suspense>}/>
      <Route path="/users" element={<UsersPage/>}/>
      <Route path="/sessions" element={<SessionsPage/>}/>
      <Route path="/monitoring" element={<MonitoringPage/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="/about" element={<AboutPage/>}/>
    </Route>
    <Route path="/error/401" element={<ErrorPage status="401"/>}/>
    <Route path="/error/403" element={<ErrorPage status="403"/>}/>
    <Route path="/error/404" element={<ErrorPage status="404"/>}/>
    <Route path="/error/405" element={<ErrorPage status="405"/>}/>
    <Route path="/error/500" element={<ErrorPage status="500"/>}/>
    <Route path="*" element={<ErrorPage status="404"/>}/>
  </Routes></div></div>
}
