import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, Wifi } from 'lucide-react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { AppButton } from '../../components/common/AppButton'
import { InlineMessage } from '../../components/feedback/InlineMessage'
import { useAuth } from '../../services/authService'
import { errorMessage } from '../../utils/errorMessage'

export function ActivationPage() {
  const { activated, authenticated, activate } = useAuth()
  const navigate = useNavigate()
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  if (activated) return <Navigate to={authenticated ? '/dashboard' : '/login'} replace/>
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!key.trim()) { setMessage('Please enter your application key.'); setSuccess(false); return }
    setBusy(true); setMessage('')
    try { const result = await activate(key.trim()); setSuccess(true); setMessage(result); setKey(''); navigate('/login', { replace: true }) }
    catch (error) { setSuccess(false); setMessage(errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <AuthLayout><section className="auth-form-container"><div className="auth-icon"><KeyRound size={27}/></div><div className="auth-form-heading"><span className="eyebrow">NETDDASH</span><h1>Activate your application</h1><p>Enter the application key to activate this browser.</p></div><form className="auth-form" onSubmit={event => { void submit(event) }}><div className="form-row"><label htmlFor="activation-key">Activation Key</label><input className="text-input" id="activation-key" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} placeholder="Enter activation key" required /></div><InlineMessage message={message} success={success}/><AppButton className="auth-submit" type="submit" busy={busy}>Activate Application <ArrowRight size={17}/></AppButton></form><div className="auth-form-bottom"><Wifi size={15}/> Activation is required only once while the cookie remains valid.</div></section></AuthLayout>
}
