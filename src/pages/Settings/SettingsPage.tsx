import { useEffect, useState } from 'react'
import { Clock3, Database, Info, Save, SlidersHorizontal } from 'lucide-react'
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
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">APPLICATION CONFIGURATION</span><h1>Settings</h1><p>Manage default data and duration settings for new sessions.</p></div><span className="heading-icon"><SlidersHorizontal size={22}/></span></div>
    {readError && <div className="soft-notice"><Info size={17}/> Unable to load current settings.</div>}
    <div className="settings-stack"><AppCard className="setting-card"><div className="setting-head"><span className="setting-icon"><Database size={23}/></span><div><h2>Default Data Limit</h2><p>Amount of data allowed for newly created Wi-Fi sessions.</p></div></div><div className="setting-divider"/><div className="setting-body">{bytes !== null && <div className="current-setting"><small>Current Data Limit</small><strong>{formatBytes(bytes)}</strong></div>}<form onSubmit={event => { event.preventDefault(); void save('data') }}><label htmlFor="default-data-limit">New Data Limit (GB)</label><div className="unit-field"><input id="default-data-limit" type="number" min="1" max="100" step="1" className="text-input" placeholder="e.g. 5" value={dataLimit} onChange={event => setDataLimit(event.target.value)} required/><span>GB</span></div><small>Applies to new sessions. Existing session limits remain unchanged.</small><AppButton busy={busy === 'data'} type="submit"><Save size={16}/> Save Data Limit</AppButton></form></div></AppCard>
      <AppCard className="setting-card"><div className="setting-head"><span className="setting-icon"><Clock3 size={23}/></span><div><h2>Default Session Duration</h2><p>How long new Wi-Fi sessions are allowed to remain active.</p></div></div><div className="setting-divider"/><div className="setting-body">{hours !== null && <div className="current-setting"><small>Current Session Duration</small><strong>{hours} Hours</strong></div>}<form onSubmit={event => { event.preventDefault(); void save('hours') }}><label htmlFor="default-session-hours">New Session Duration (Hours)</label><div className="unit-field"><input id="default-session-hours" type="number" min="1" max="24" step="1" className="text-input" placeholder="e.g. 24" value={sessionHours} onChange={event => setSessionHours(event.target.value)} required/><span>Hours</span></div><small>Applies to new sessions. Existing session durations remain unchanged.</small><AppButton busy={busy === 'hours'} type="submit"><Save size={16}/> Save Duration</AppButton></form></div></AppCard></div>
    <div className="settings-note"><Info size={17}/> Settings are saved independently. Changing one will not change the other.</div>
  </div>
}
