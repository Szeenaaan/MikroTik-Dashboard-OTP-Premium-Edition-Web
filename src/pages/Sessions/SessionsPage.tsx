import { useCallback, useEffect, useState } from 'react'
import { Database, Download, Radio, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppButton } from '../../components/common/AppButton'
import { AppCard } from '../../components/common/AppCard'
import { ActionMenu } from '../../components/common/ActionMenu'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Pagination } from '../../components/common/Pagination'
import { StatusBadge } from '../../components/common/StatusBadge'
import { FilterBar } from '../../components/form/FilterBar'
import { LoadingState } from '../../components/feedback/LoadingState'
import { useToast } from '../../components/feedback/Toast'
import { sessionsApi } from '../../api/sessionsApi'
import { downloadBlob } from '../../services/downloadService'
import { formatBytes } from '../../utils/formatBytes'
import { formatDate } from '../../utils/formatDate'
import { errorMessage, errorStatus } from '../../utils/errorMessage'
import type { Filters, LaravelPagination } from '../../types/api.types'
import { initialFilters } from '../../types/api.types'
import type { HotspotSession } from '../../types/session.types'

export function SessionsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<LaravelPagination<HotspotSession> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [terminate, setTerminate] = useState<HotspotSession | null>(null)
  const [update, setUpdate] = useState<HotspotSession | null>(null)
  const [gb, setGb] = useState('')
  const { notify } = useToast()
  const navigate = useNavigate()
  useEffect(() => { const timer = setTimeout(() => setDebounced(filters.search), 350); return () => clearTimeout(timer) }, [filters.search])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setResult(await sessionsApi.list({ ...filters, search: debounced })) }
    catch (cause) {
      const status = errorStatus(cause)
      if (status === 405) { navigate('/error/405'); return }
      if (status === 401 || status === 403) return
      const message = errorMessage(cause)
      setResult(null)
      setError(message)
      notify(message, 'error')
    } finally { setLoading(false) }
  }, [filters.status, filters.from_date, filters.to_date, filters.order, filters.page, debounced, navigate, notify])
  useEffect(() => { void load() }, [load])
  async function performTerminate() {
    if (!terminate) return
    setBusy(true)
    try { const response = await sessionsApi.terminate(terminate.id); notify(response.message, 'success'); setTerminate(null); await load() }
    catch (cause) { if (errorStatus(cause) === 405) { navigate('/error/405'); return }; notify(errorMessage(cause), 'error') }
    finally { setBusy(false) }
  }
  async function saveLimit() {
    if (!update) return
    const amount = Number(gb)
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1024) { notify('Enter a positive whole-number limit between 1 and 1024 GB.', 'error'); return }
    setBusy(true)
    try { const response = await sessionsApi.updateLimit(update.id, amount); notify(response.message, 'success'); setUpdate(null); await load() }
    catch (cause) { if (errorStatus(cause) === 405) { navigate('/error/405'); return }; notify(errorMessage(cause), 'error') }
    finally { setBusy(false) }
  }
  async function exportSessions() {
    setExporting(true)
    try { const blob = await sessionsApi.export({ ...filters, search: debounced }); downloadBlob(blob, 'sessions.xlsx'); notify('Sessions exported successfully.', 'success') }
    catch (cause) { if (errorStatus(cause) === 405) { navigate('/error/405'); return }; notify(errorMessage(cause), 'error') }
    finally { setExporting(false) }
  }
  const actions = (session: HotspotSession) => session.status?.toLowerCase() === 'active' && Boolean(session.is_active) ? [
    { label: 'Update Data Limit', icon: Database, onClick: () => { setUpdate(session); setGb('') } },
    { label: 'Terminate Session', icon: XCircle, danger: true, onClick: () => setTerminate(session) },
  ] : []
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">NETWORK ACTIVITY</span><h1>Sessions Management</h1><p>Monitor activity, usage and individual limits.</p></div><AppButton onClick={() => { void exportSessions() }} busy={exporting}><Download size={16}/> Export Excel</AppButton></div>
    <AppCard><FilterBar filters={filters} setFilters={setFilters} placeholder="Search MAC, username or IP address…" statuses={['active', 'terminated', 'expired']}/></AppCard>
    <AppCard className="table-card"><div className="card-header"><div><h2><Radio size={19}/> Wi-Fi Sessions</h2><p>10 records per page</p></div></div>
      <div className="table-scroll" role="region" aria-label="Sessions table" tabIndex={0}><table className="data-table"><thead><tr><th>MAC / IP</th><th>Username</th><th>Start</th><th>End</th><th>Download</th><th>Upload</th><th>Data Limit</th><th>Session Time</th><th>Status</th><th className="right">Actions</th></tr></thead><tbody>{loading && !result ? <tr><td colSpan={10}><LoadingState/></td></tr> : error ? <tr><td colSpan={10} className="empty-table"><div className="table-error"><strong>Data is not loaded</strong><AppButton variant="outline" onClick={() => { void load() }}>Retry</AppButton></div></td></tr> : result?.data.length ? result.data.map(session => <tr key={session.id}><td><strong>{session.mac}</strong><small>{session.ip || '—'}</small></td><td>{session.radius_username || '—'}</td><td>{formatDate(session.session_start)}</td><td>{formatDate(session.session_end)}</td><td>{formatBytes(session.download_bytes)}</td><td>{formatBytes(session.upload_bytes)}</td><td>{formatBytes(session.data_limit)}</td><td>{session.session_time ?? '—'}</td><td><StatusBadge status={session.status}/></td><td className="right"><ActionMenu items={actions(session)}/></td></tr>) : <tr><td colSpan={10} className="empty-table">No sessions found.</td></tr>}</tbody></table></div>{!error && result && <Pagination data={result} onPage={page => setFilters(old => ({...old, page}))}/>}
    </AppCard>
    {terminate && <ConfirmDialog title="Terminate Session?" description={`Disconnect the session for ${terminate.mac}? This operation updates MikroTik and cannot be undone here.`} confirmLabel="Terminate" danger busy={busy} onClose={() => setTerminate(null)} onConfirm={() => { void performTerminate() }}/> }
    {update && <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setUpdate(null) }}><form className="modal-card" onSubmit={event => { event.preventDefault(); void saveLimit() }}><div className="modal-icon"><Database size={23}/></div><h2>Update Session Data Limit</h2><p>Set a new data allowance for {update.mac} in GB.</p><label className="stacked-field">Data Limit (GB)<div className="unit-field"><input className="text-input" type="number" min="1" max="1024" step="1" placeholder="e.g. 5" required value={gb} onChange={event => setGb(event.target.value)}/><span>GB</span></div></label><div className="modal-actions"><AppButton variant="outline" type="button" disabled={busy} onClick={() => setUpdate(null)}>Cancel</AppButton><AppButton busy={busy} type="submit">Save Limit</AppButton></div></form></div>}
  </div>
}
