import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Ban, FileQuestion, LockKeyhole, ServerCrash, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../services/authService'
import { AppButton } from '../../components/common/AppButton'

const config: Record<string, { title: string; description: string; icon: LucideIcon }> = {
  '401': { title: 'Authentication required', description: 'Please sign in with a valid session to access this page.', icon: LockKeyhole },
  '403': { title: 'Access denied', description: "You don't have permission to access this page.", icon: ShieldAlert },
  '404': { title: 'Page not found', description: "The page you requested doesn't exist or may have moved.", icon: FileQuestion },
  '405': { title: 'Method not allowed', description: 'The requested operation is not supported.', icon: Ban },
  '500': { title: 'Something went wrong', description: 'The server encountered an unexpected error. Please try again later.', icon: ServerCrash },
}

export function ErrorPage({ status }: { status: '401' | '403' | '404' | '405' | '500' }) {
  const { activated, authenticated, denied, clearSession } = useAuth()
  const navigate = useNavigate()
  const item = config[status]
  const Icon = item.icon
  const destination = !activated ? '/activate' : authenticated && !denied ? '/dashboard' : '/login'

  let action
  if (status === '500') {
    action = <AppButton onClick={() => window.location.reload()}>Try Again <ArrowRight size={17} /></AppButton>
  } else if (status === '403' && denied) {
    action = <AppButton onClick={() => { clearSession(); navigate('/login', { replace: true }) }}>Go to Login <ArrowRight size={17} /></AppButton>
  } else {
    const target = status === '401' && activated ? '/login' : destination
    const label = target === '/activate' ? 'Go to Activation' : target === '/dashboard' ? 'Go to Dashboard' : 'Go to Login'
    action = <Link className="app-button btn-primary" to={target}>{label} <ArrowRight size={17} /></Link>
  }

  return (
    <div className="error-screen">
      <div className="error-icon"><Icon size={38} /></div>
      <span className="error-code">{status}</span>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
      <div className="error-buttons">{action}</div>
    </div>
  )
}
