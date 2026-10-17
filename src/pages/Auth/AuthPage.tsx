import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppInput } from '../../components/form/AppInput'
import { PasswordInput } from '../../components/form/PasswordInput'
import { AppButton } from '../../components/common/AppButton'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { useToast } from '../../components/feedback/Toast'
import { useAuth } from '../../services/authService'
import { errorMessage } from '../../utils/errorMessage'

export function AuthPage() {
  const { activated, authenticated, login, signup } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  if (activated === false) return <Navigate to="/activate" replace />
  if (authenticated) return <Navigate to="/dashboard" replace />

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setPassword('')
    setConfirm('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const name = username.trim()
    if (!name || !password) {
      notify('Username and password are required.', 'error')
      return
    }
    if (mode === 'signup') {
      if (password !== confirm) {
        notify('Passwords do not match.', 'error')
        return
      }
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        const message = await signup(name, password)
        switchMode('login')
        notify(message || 'Account created successfully.', 'success')
      } else {
        const message = await login(name, password)
        notify(message || 'Login successful.', 'success')
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      notify(errorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return <AuthLayout>
    <section className="auth-form-container">
      <div className="auth-icon">{mode === 'login' ? <ShieldCheck size={28} /> : <UserRoundPlus size={28} />}</div>
      <div className="auth-form-heading">
        <span className="eyebrow">NETDDASH</span>
        <h1>{mode === 'login' ? 'Login' : 'Sign Up'}</h1>
      </div>
      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
        <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign Up</button>
      </div>
      <form className="auth-form" onSubmit={event => { void submit(event) }}>
        <AppInput label="Username" autoComplete="username" placeholder="Enter your username" value={username} onChange={event => setUsername(event.target.value)} required />
        <PasswordInput label="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required />
        {mode === 'signup' && <PasswordInput label="Confirm Password" autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={event => setConfirm(event.target.value)} required />}
        <AppButton busy={busy} className="auth-submit" type="submit">{mode === 'login' ? 'Login' : 'Create Account'} <ArrowRight size={17} /></AppButton>
      </form>
      <p className="auth-form-switch">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Sign Up' : 'Login'}</button>
      </p>
    </section>
  </AuthLayout>
}
