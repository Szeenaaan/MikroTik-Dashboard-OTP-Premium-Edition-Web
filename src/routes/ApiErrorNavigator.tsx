import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authService'

export function ApiErrorNavigator() {
  const navigate = useNavigate()
  const { clearSession, invalidateActivation } = useAuth()
  useEffect(() => {
    const onApiError = (event: Event) => {
      const status = (event as CustomEvent<{status: number | 'activation'}>).detail.status
      if (status === 'activation') { invalidateActivation(); navigate('/activate', { replace: true }) }
      else if (status === 401) { clearSession(); navigate('/error/401', { replace: true }) }
      else if ([403, 405, 500].includes(status as number)) navigate(`/error/${status}`)
    }
    const onSessionIdle = () => navigate('/login', { replace: true, state: { reason: 'idle' } })
    window.addEventListener('netddash:session-idle', onSessionIdle)
    window.addEventListener('wifi:api-error', onApiError)
    return () => {
      window.removeEventListener('wifi:api-error', onApiError)
      window.removeEventListener('netddash:session-idle', onSessionIdle)
    }
  }, [navigate, clearSession, invalidateActivation])
  return null
}
