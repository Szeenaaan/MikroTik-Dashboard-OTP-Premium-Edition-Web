import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound } from 'lucide-react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { AppButton } from '../../components/common/AppButton'
import { useToast } from '../../components/feedback/Toast'
import { useAuth } from '../../services/authService'
import { errorMessage } from '../../utils/errorMessage'

export function ActivationPage() {
  const { activated, authenticated, activate } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)

  if (activated) return <Navigate to={authenticated ? '/dashboard' : '/login'} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!key.trim()) {
      notify('Enter your activation key.', 'error')
      return
    }
    setBusy(true)
    try {
      const message = await activate(key.trim())
      notify(message || 'Application activated successfully.', 'success')
      setKey('')
      navigate('/login', { replace: true })
    } catch (error) {
      notify(errorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return <AuthLayout>
    <section className="auth-form-container">
      <div className="auth-icon"><KeyRound size={27} /></div>
      <div className="auth-form-heading"><span className="eyebrow">NETDDASH</span><h1>Activate Application</h1></div>
      <form className="auth-form" onSubmit={event => { void submit(event) }}>
        <div className="form-row">
          <label htmlFor="activation-key">Activation Key</label>
          <input className="text-input" id="activation-key" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} placeholder="Enter activation key" required />
        </div>
        <AppButton className="auth-submit" type="submit" busy={busy}>Activate <ArrowRight size={17} /></AppButton>
      </form>
    </section>
  </AuthLayout>
}
