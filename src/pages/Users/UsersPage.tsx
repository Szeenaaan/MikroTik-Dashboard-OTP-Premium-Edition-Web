import { useCallback, useEffect, useState } from 'react'
import { Download, Lock, LockOpen, ShieldCheck, ShieldOff, UsersRound } from 'lucide-react'
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
import { usersApi } from '../../api/usersApi'
import { downloadBlob } from '../../services/downloadService'
import { formatBytes } from '../../utils/formatBytes'
import { formatDate } from '../../utils/formatDate'
import { errorMessage, errorStatus } from '../../utils/errorMessage'
import type { Filters, LaravelPagination } from '../../types/api.types'
import { initialFilters } from '../../types/api.types'
import type { WifiUser } from '../../types/user.types'

type Operation = 'block' | 'unblock' | 'bypass' | 'remove-bypass'
interface Pending { user: WifiUser; operation: Operation; label: string }

export function UsersPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<LaravelPagination<WifiUser> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const { notify } = useToast()
  const navigate = useNavigate()
  useEffect(() => { const timer = setTimeout(() => setDebounced(filters.search), 350); return () => clearTimeout(timer) }, [filters.search])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setResult(await usersApi.list({ ...filters, search: debounced })) }
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
  async function perform() {
    if (!pending) return
    setBusy(true)
    try { const response = await usersApi.action(pending.user.id, pending.operation); notify(response.message, 'success'); setPending(null); await load() }
    catch (cause) { if (errorStatus(cause) === 405) { navigate('/error/405'); return }; notify(errorMessage(cause), 'error') }
    finally { setBusy(false) }
  }
  async function exportUsers() {
    setExporting(true)
    try { const blob = await usersApi.export({ ...filters, search: debounced }); downloadBlob(blob, 'users.xlsx'); notify('Users exported successfully.', 'success') }
    catch (cause) { if (errorStatus(cause) === 405) { navigate('/error/405'); return }; notify(errorMessage(cause, 'Unable to export users.'), 'error') }
    finally { setExporting(false) }
  }
  function actions(user: WifiUser) {
    const blocked = user.status?.toLowerCase() === 'blocked'
    const bypassed = Boolean(user.permanent_access)
    if (blocked) return [{ label: 'Unblock User', icon: LockOpen, onClick: () => setPending({user, operation:'unblock', label:'Unblock User'}) }]
    return [
      { label: 'Block User', icon: Lock, danger: true, onClick: () => setPending({user, operation:'block', label:'Block User'}) },
      bypassed ? { label:'Remove Permanent Access', icon: ShieldOff, onClick: () => setPending({user, operation:'remove-bypass', label:'Remove Permanent Access'}) } : { label:'Enable Permanent Access', icon: ShieldCheck, onClick: () => setPending({user, operation:'bypass', label:'Enable Permanent Access'}) },
    ]
  }
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">USER ACCESS</span><h1>Users Management</h1><p>Manage connected users and their Wi-Fi access.</p></div><AppButton onClick={() => { void exportUsers() }} busy={exporting}><Download size={16}/> Export Excel</AppButton></div>
    <AppCard><FilterBar filters={filters} setFilters={setFilters} placeholder="Search MAC, phone or IP address…" statuses={['active', 'blocked', 'bypassed']}/></AppCard>
    <AppCard className="table-card"><div className="card-header"><div><h2><UsersRound size={19}/> Wi-Fi Users</h2><p>10 records per page</p></div></div>
      <div className="table-scroll" role="region" aria-label="Users table" tabIndex={0}><table className="data-table"><thead><tr><th>MAC / IP Address</th><th>Phone</th><th>Download</th><th>Upload</th><th>Sessions</th><th>Last Login</th><th>Status</th><th>Access</th><th className="right">Actions</th></tr></thead><tbody>{loading && !result ? <tr><td colSpan={9}><LoadingState/></td></tr> : error ? <tr><td colSpan={9} className="empty-table"><div className="table-error"><strong>Data is not loaded</strong><AppButton variant="outline" onClick={() => { void load() }}>Retry</AppButton></div></td></tr> : result?.data.length ? result.data.map(user => <tr key={user.id}><td><strong>{user.mac_address}</strong><small>{user.ip_address || '—'}</small></td><td>{user.phone_number || '—'}</td><td>{formatBytes(user.download_bytes)}</td><td>{formatBytes(user.upload_bytes)}</td><td>{user.session_count ?? 0}</td><td>{formatDate(user.last_login_at)}</td><td><StatusBadge status={user.status}/></td><td>{user.permanent_access ? 'Permanent' : 'Standard'}</td><td className="right"><ActionMenu items={actions(user)}/></td></tr>) : <tr><td colSpan={9} className="empty-table">No users found.</td></tr>}</tbody></table></div>{!error && result && <Pagination data={result} onPage={page => setFilters(old => ({...old, page}))}/>}
    </AppCard>
    {pending && <ConfirmDialog title={`${pending.label}?`} description={`Confirm ${pending.label.toLowerCase()} for ${pending.user.mac_address}. This change will affect MikroTik network access.`} confirmLabel={pending.label} danger={pending.operation === 'block'} busy={busy} onClose={() => setPending(null)} onConfirm={() => { void perform() }}/>}</div>
}
