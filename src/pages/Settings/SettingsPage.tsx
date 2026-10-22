import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import type { ApiEnvelope } from '../../types/api.types'
import type { ChangePasswordRequest } from '../../types/settings.types'
import { PasswordInput } from '../../components/form/PasswordInput'
import { Clock3, Database, Info, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { settingsApi } from '../../api/settingsApi'
import { AppCard } from '../../components/common/AppCard'
import { AppButton } from '../../components/common/AppButton'
import { useToast } from '../../components/feedback/Toast'
import { errorMessage, errorStatus } from '../../utils/errorMessage'
import { formatBytes } from '../../utils/formatBytes'

export function SettingsPage() {
  const [bytes, setBytes] = useState<number | string | null>(null)
  const [hours, setHours] = useState<number | string | null>(null)
  const [readError, setReadError] = useState(false)
  const [dataLimit, setDataLimit] = useState('')
  const [sessionHours, setSessionHours] = useState('')
  const [busy, setBusy] = useState<'data' | 'hours' | null>(null)
  const [passwords, setPasswords] = useState<ChangePasswordRequest>({ current_password: '', password: '', password_confirmation: '' })
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const { notify } = useToast()
  const navigate = useNavigate()
  useEffect(() => {
    if (!settingsApi.canRead) return
    let active = true; void settingsApi.getCurrent().then(value => { if (!active) return; setBytes(value.session_data_limit); setHours(value.session_hours) }).catch(() => { if (active) setReadError(true) }); return () => { active = false } }, [])
  async function save(kind: 'data' | 'hours') {
    const value = Number(kind === 'data' ? dataLimit : sessionHours)
    if (!Number.isSafeInteger(value) || value < 1 || value > (kind === 'data' ? 100 : 24)) { notify(kind === 'data' ? 'Enter a whole-number limit between 1 and 100 GB.' : 'Enter a whole-number duration between 1 and 24 hours.', 'error'); return }
    setBusy(kind)
    try {
      if (kind === 'data') { const response = await settingsApi.updateDataLimit(value); setBytes(value * 1024 ** 3); setDataLimit(''); notify(response.message, 'success') }
      else { const response = await settingsApi.updateSessionHours(value); setHours(value); setSessionHours(''); notify(response.message, 'success') }
    } catch (cause) {
      if (errorStatus(cause) === 405) { navigate('/error/405'); return }
      if (errorStatus(cause) === 500) { navigate('/error/500'); return }
      notify(errorMessage(cause), 'error')
    } finally { setBusy(null) }
  }
  function updatePassword(field: keyof ChangePasswordRequest, value: string) {
    setPasswords(previous => ({ ...previous, [field]: value }))
    setPasswordError('')
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (passwordBusy) return
    if (!passwords.current_password || !passwords.password || !passwords.password_confirmation) {
      setPasswordError('Complete all password fields.')
      return
    }
    if (passwords.password !== passwords.password_confirmation) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setPasswordError('')
    setPasswordBusy(true)
    try {
      const response = await settingsApi.changePassword(passwords)
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      notify(response.message || 'Password changed successfully.', 'success')
    } catch (cause) {
      if (errorStatus(cause) === 405) { navigate('/error/405'); return }
      if (errorStatus(cause) === 500) { navigate('/error/500'); return }
      const validation = axios.isAxiosError<ApiEnvelope>(cause)
        ? Object.values(cause.response?.data?.errors ?? {}).flat().filter(Boolean).join(' ')
        : ''
      setPasswordError(validation || errorMessage(cause, 'Unable to change password.'))
    } finally {
      setPasswordBusy(false)
    }
  }

  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">APPLICATION CONFIGURATION</span><h1>Settings</h1><p>Manage session defaults and your account password.</p></div><span className="heading-icon"><SlidersHorizontal size={22}/></span></div>
    {readError && <div className="soft-notice"><Info size={17}/> Unable to load current settings.</div>}
    <div className="settings-stack"><AppCard className="setting-card"><div className="setting-head"><span className="setting-icon"><Database size={23}/></span><div><h2>Default Data Limit</h2><p>Amount of data allowed for newly created Wi-Fi sessions.</p></div></div><div className="setting-divider"/><div className="setting-body">{bytes !== null && <div className="current-setting"><small>Current Data Limit</small><strong>{formatBytes(bytes)}</strong></div>}<form onSubmit={event => { event.preventDefault(); void save('data') }}><label htmlFor="default-data-limit">New Data Limit (GB)</label><div className="unit-field"><input id="default-data-limit" type="number" min="1" max="100" step="1" className="text-input" placeholder="e.g. 5" value={dataLimit} onChange={event => setDataLimit(event.target.value)} required/><span>GB</span></div><small>Applies to new sessions. Existing session limits remain unchanged.</small><AppButton busy={busy === 'data'} type="submit"><Save size={16}/> Save Data Limit</AppButton></form></div></AppCard>
      <AppCard className="setting-card"><div className="setting-head"><span className="setting-icon"><Clock3 size={23}/></span><div><h2>Default Session Duration</h2><p>How long new Wi-Fi sessions are allowed to remain active.</p></div></div><div className="setting-divider"/><div className="setting-body">{hours !== null && <div className="current-setting"><small>Current Session Duration</small><strong>{hours} Hours</strong></div>}<form onSubmit={event => { event.preventDefault(); void save('hours') }}><label htmlFor="default-session-hours">New Session Duration (Hours)</label><div className="unit-field"><input id="default-session-hours" type="number" min="1" max="24" step="1" className="text-input" placeholder="e.g. 24" value={sessionHours} onChange={event => setSessionHours(event.target.value)} required/><span>Hours</span></div><small>Applies to new sessions. Existing session durations remain unchanged.</small><AppButton busy={busy === 'hours'} type="submit"><Save size={16}/> Save Duration</AppButton></form></div></AppCard></div>
    <AppCard className="setting-card password-setting">
      <div className="setting-head"><span className="setting-icon"><ShieldCheck size={23}/></span><div><h2>Change Password</h2><p>Update the password you use to sign in to Netddash.</p></div></div>
      <div className="setting-divider"/>
      <form onSubmit={event => { void changePassword(event) }} aria-busy={passwordBusy} aria-describedby={passwordError ? 'password-change-error' : undefined}>
        <fieldset className="password-fields" disabled={passwordBusy}>
          <legend className="password-legend">Account password</legend>
          <PasswordInput id="settings-current-password" label="Current Password" autoComplete="current-password" value={passwords.current_password} onChange={event => updatePassword('current_password', event.target.value)} required/>
          <PasswordInput id="settings-new-password" label="New Password" autoComplete="new-password" value={passwords.password} onChange={event => updatePassword('password', event.target.value)} required/>
          <PasswordInput id="settings-confirm-password" label="Confirm New Password" autoComplete="new-password" value={passwords.password_confirmation} onChange={event => updatePassword('password_confirmation', event.target.value)} required/>
        </fieldset>
        {passwordError && <p id="password-change-error" className="inline-message inline-error" role="alert">{passwordError}</p>}
        <AppButton busy={passwordBusy} type="submit"><Save size={16}/> Change Password</AppButton>
      </form>
    </AppCard>
    <div className="settings-note"><Info size={17}/> Settings are saved independently. Changing one will not change the other.</div>
  </div>
}
