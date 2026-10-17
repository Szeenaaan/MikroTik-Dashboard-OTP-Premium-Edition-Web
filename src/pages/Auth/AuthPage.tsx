import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppInput } from '../../components/form/AppInput'
import { PasswordInput } from '../../components/form/PasswordInput'
import { AppButton } from '../../components/common/AppButton'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { InlineMessage } from '../../components/feedback/InlineMessage'
import { useAuth } from '../../services/authService'
import { errorMessage } from '../../utils/errorMessage'

const signupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === 'true'

export function AuthPage() {
  const { activated, authenticated, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(location.state?.reason === 'idle' ? 'Session expired after 15 minutes of inactivity. Please log in again.' : '')
  const [success, setSuccess] = useState(false)
  if (activated === false) return <Navigate to="/activate" replace/>
  if (authenticated) return <Navigate to="/dashboard" replace/>
  const switchMode = (next: 'login' | 'signup') => { setMode(next); setMessage(''); setSuccess(false); setPassword(''); setConfirm('') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!username.trim() || !password) { setSuccess(false); setMessage('Username and password are required.'); return }
    if (mode === 'signup' && password !== confirm) { setSuccess(false); setMessage('Passwords do not match.'); return }
    if (mode === 'signup' && !signupEnabled) { setSuccess(false); setMessage('Registration is unavailable until the administrator secures account creation on the Laravel backend.'); return }
    setBusy(true); setMessage(''); setSuccess(false)
    try {
      if (mode === 'signup') { const response = await signup(username.trim(), password); switchMode('login'); setSuccess(true); setMessage(`${response} Please sign in.`) }
      else { await login(username.trim(), password); navigate('/dashboard', { replace: true }) }
    } catch (error) { setMessage(errorMessage(error)); setSuccess(false) }
    finally { setBusy(false) }
  }
  return <AuthLayout><section className="auth-form-container"><div className="auth-icon">{mode === 'login' ? <ShieldCheck size={28}/> : <UserRoundPlus size={28}/>}</div><div className="auth-form-heading"><span className="eyebrow">NETDDASH</span><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'login' ? 'Log in to continue to your dashboard.' : 'Register a dashboard account.'}</p></div><div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Login</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign Up</button></div><form className="auth-form" onSubmit={event => { void submit(event) }}><AppInput label="Username" autoComplete="username" placeholder="Enter your username" value={username} onChange={event => setUsername(event.target.value)} required/><PasswordInput label="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? 'Enter your password' : 'Create password'} value={password} onChange={event => setPassword(event.target.value)} required/>{mode === 'signup' && <PasswordInput label="Confirm" autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={event => setConfirm(event.target.value)} required/>}<InlineMessage message={message} success={success}/><AppButton busy={busy} className="auth-submit" type="submit">{mode === 'login' ? 'Login' : 'Create Account'} <ArrowRight size={17}/></AppButton></form><p className="auth-form-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Sign Up' : 'Login'}</button></p></section></AuthLayout>
}
