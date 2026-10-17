import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { activationApi } from '../api/activationApi'
import { authApi } from '../api/authApi'
import { dashboardApi } from '../api/dashboardApi'
import { storageService } from './storageService'
import { errorMessage, errorStatus } from '../utils/errorMessage'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 60 * 1000
let heartbeatAvailable = true

async function verifySession(): Promise<void> {
  if (heartbeatAvailable) {
    try {
      await authApi.heartbeat()
      return
    } catch (error) {
      if (errorStatus(error) !== 404) throw error
      heartbeatAvailable = false
    }
  }
  await dashboardApi.getDashboard('d', true)
}

interface AuthContextType {
  loading: boolean
  activated: boolean | null
  authenticated: boolean
  denied: boolean
  bootServerError: boolean
  bootstrapError: string | null
  refreshActivation: () => Promise<boolean>
  activate: (key: string) => Promise<string>
  login: (username: string, password: string) => Promise<string>
  signup: (username: string, password: string) => Promise<string>
  logout: () => Promise<void>
  clearSession: () => void
  invalidateActivation: () => void
}
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [activated, setActivated] = useState<boolean | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [denied, setDenied] = useState(false)
  const [bootServerError, setBootServerError] = useState(false)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)

  const clearSession = useCallback(() => {
    storageService.clearToken()
    setAuthenticated(false)
    setDenied(false)
  }, [])

  const invalidateActivation = useCallback(() => {
    setActivated(false)
    clearSession()
  }, [clearSession])

  const refreshActivation = useCallback(async () => {
    const response = await activationApi.status()
    setActivated(response.activated)
    if (!response.activated) clearSession()
    return response.activated
  }, [clearSession])

  useEffect(() => {
    let mounted = true
    async function boot() {
      try {
        const status = await activationApi.status()
        if (!mounted) return
        setActivated(status.activated)
        if (!status.activated) {
          storageService.clearToken()
          setAuthenticated(false)
          return
        }
        if (!storageService.getToken()) return

        const lastActivity = storageService.getLastActivity()
        if (lastActivity !== null && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
          storageService.clearToken()
          setAuthenticated(false)
          return
        }
        if (lastActivity === null) storageService.touchActivity()

        try {
          await verifySession()
          if (mounted) setAuthenticated(true)
        } catch (error) {
          if (!mounted) return
          const statusCode = errorStatus(error)
          if (statusCode === 401) {
            clearSession()
          } else if (statusCode === 403) {
            if (errorMessage(error).toLowerCase().includes('activation')) invalidateActivation()
            else setDenied(true)
          } else if (statusCode === 500) {
            setBootServerError(true)
          } else {
            setBootstrapError(errorMessage(error))
          }
        }
      } catch (error) {
        if (mounted) {
          if (errorStatus(error) === 500) setBootServerError(true)
          else setBootstrapError(errorMessage(error, 'Unable to check application activation.'))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void boot()
    return () => { mounted = false }
  }, [clearSession, invalidateActivation])

  useEffect(() => {
    if (!authenticated) return
    let heartbeatPending = false
    let lastHeartbeatAt = Date.now()
    let lastActivityWrite = storageService.getLastActivity() ?? Date.now()

    const expire = () => {
      const lastActivity = storageService.getLastActivity()
      if (lastActivity !== null && Date.now() - lastActivity < IDLE_TIMEOUT_MS) return false
      clearSession()
      window.dispatchEvent(new Event('netddash:session-idle'))
      return true
    }

    const sendHeartbeat = async () => {
      if (heartbeatPending) return
      heartbeatPending = true
      try {
        await verifySession()
      } catch (error) {
        const status = errorStatus(error)
        if (status === 401) {
          clearSession()
          window.dispatchEvent(new Event('netddash:session-idle'))
        } else if (status === 403) {
          if (errorMessage(error).toLowerCase().includes('activation')) {
            invalidateActivation()
            window.dispatchEvent(new CustomEvent('wifi:api-error', { detail: { status: 'activation' } }))
          } else {
            setDenied(true)
            window.dispatchEvent(new CustomEvent('wifi:api-error', { detail: { status: 403 } }))
          }
        }
      } finally {
        heartbeatPending = false
      }
    }

    const onActivity = () => {
      if (document.visibilityState === 'hidden' || expire()) return
      const now = Date.now()
      if (now - lastActivityWrite < 1000) return
      storageService.touchActivity(now)
      lastActivityWrite = now
      if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS && !heartbeatPending) {
        lastHeartbeatAt = now
        void sendHeartbeat()
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') expire()
    }

    const activityEvents = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const
    for (const event of activityEvents) window.addEventListener(event, onActivity, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    const ticker = window.setInterval(expire, 5000)
    return () => {
      window.clearInterval(ticker)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const event of activityEvents) window.removeEventListener(event, onActivity)
    }
  }, [authenticated, clearSession, invalidateActivation])

  const activate = useCallback(async (key: string) => {
    const result = await activationApi.activate(key)
    const valid = await refreshActivation()
    if (!valid) throw new Error('Activation succeeded, but the activation cookie could not be verified. Check the browser cookie settings.')
    return result.message
  }, [refreshActivation])

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    if (!response.data?.token) throw new Error('Login did not return an access token.')
    storageService.setToken(response.data.token)
    setDenied(false)
    setAuthenticated(true)
    return response.message
  }, [])

  const signup = useCallback(async (username: string, password: string) => {
    const response = await authApi.signup(username, password)
    return response.message
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextType>(() => ({
    loading, activated, authenticated, denied, bootServerError, bootstrapError, refreshActivation, activate,
    login, signup, logout, clearSession, invalidateActivation,
  }), [loading, activated, authenticated, denied, bootServerError, bootstrapError, refreshActivation, activate, login, signup, logout, clearSession, invalidateActivation])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
