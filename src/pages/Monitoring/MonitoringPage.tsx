import { useCallback, useEffect, useState } from 'react'
import { Activity, CheckCircle2, Clock3, Code2, Database, Layers3, RefreshCw, Server, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { monitoringApi } from '../../api/monitoringApi'
import { AppButton } from '../../components/common/AppButton'
import { AppCard } from '../../components/common/AppCard'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { errorMessage, errorStatus } from '../../utils/errorMessage'
import type { MonitoringResult, HealthCheck } from '../../types/monitoring.types'

const services: { key: string; label: string; sub: string; icon: LucideIcon }[] = [
  { key: 'nginx', label: 'Nginx', sub: 'Web server', icon: Server },
  { key: 'php_fpm', label: 'PHP-FPM', sub: 'PHP runtime', icon: Code2 },
  { key: 'redis', label: 'Redis', sub: 'Cache and messaging', icon: Database },
  { key: 'radius', label: 'FreeRADIUS', sub: 'Authentication service', icon: ShieldCheck },
  { key: 'scheduler', label: 'Scheduler', sub: 'Scheduled tasks', icon: Clock3 },
  { key: 'workers', label: 'Queue Workers', sub: 'Background processing', icon: Layers3 },
]

export function MonitoringPage() {
  const [data, setData] = useState<MonitoringResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const navigate = useNavigate()
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await monitoringApi.status()); setCheckedAt(new Date()) }
    catch (cause) {
      if (errorStatus(cause) === 405) { navigate('/error/405'); return }
      if (errorStatus(cause) === 500) { navigate('/error/500'); return }
      if (errorStatus(cause) === 403) { navigate('/error/403'); return }
      setError(errorMessage(cause))
    }
    finally { setLoading(false) }
  }, [navigate])
  useEffect(() => { void load() }, [load])
  const workers = data?.data?.workers?.data
  const workerGroups: { key: string; label: string; item?: HealthCheck }[] = [
    { key: 'default', label: 'Default Queue', item: workers?.default },
    { key: 'sms', label: 'SMS Queue', item: workers?.sms },
  ]
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">SYSTEM HEALTH</span><h1>System Monitoring</h1><p>Infrastructure and background service diagnostics.</p></div><AppButton variant="outline" onClick={() => { void load() }} busy={loading}><RefreshCw size={16}/> Refresh</AppButton></div>
    {loading && !data ? <LoadingState text="Checking system services…"/> : error ? <ErrorState message={error} retry={() => { void load() }}/> : data && <>
      <AppCard className={`health-hero ${data.success ? 'healthy' : 'unhealthy'}`}><div className="health-hero-icon">{data.success ? <CheckCircle2 size={28}/> : <TriangleAlert size={28}/>}</div><div className="health-hero-text"><h2>{data.success ? 'All Systems Operational' : 'Attention Required'}</h2><p>{data.message}</p></div><div className="health-hero-meta"><span className={`status-badge ${data.success ? 'status-success' : 'status-danger'}`}>{data.success ? 'Healthy' : 'Unhealthy'}</span><small>{checkedAt ? `Checked ${checkedAt.toLocaleTimeString()}` : 'Not checked'}</small></div></AppCard>
      <div className="health-grid">{services.map(({key,label,sub,icon: Icon}) => { const check = data.data?.[key]; return <AppCard className="health-card" key={key}><div className="health-card-header"><span className="health-icon"><Icon size={21}/></span><span className={`status-badge ${check?.success ? 'status-success' : 'status-danger'}`}>{check?.success ? 'Healthy' : 'Unhealthy'}</span></div><h3>{label}</h3><p className="health-subtitle">{sub}</p><p className="health-detail">{check?.message || check?.messege || 'No diagnostic details available.'}</p></AppCard> })}</div>
      <AppCard><div className="card-header"><div><h2><Activity size={19}/> Queue Worker Details</h2><p>Actual versus expected processes</p></div></div><div className="workers-grid">{workerGroups.map(({key,label,item}) => { const expected = item?.expected ?? 0; const active = item?.active ?? 0; const ratio = expected > 0 ? Math.min(100, Math.round(active / expected * 100)) : 0; return <div className="worker-panel" key={key}><div className="worker-row"><strong>{label}</strong><span className={`status-badge ${item?.success ? 'status-success' : 'status-danger'}`}>{active} / {expected} Active</span></div><div className="worker-track"><div className={`worker-fill ${item?.success ? '' : 'worker-warning'}`} style={{width:`${ratio}%`}}/></div><p>{item?.message || 'Worker status unavailable.'}</p></div> })}</div></AppCard>
    </>}
  </div>
}
