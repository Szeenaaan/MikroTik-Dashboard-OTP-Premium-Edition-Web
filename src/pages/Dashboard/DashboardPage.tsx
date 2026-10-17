import { useCallback, useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Database, RefreshCw } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppCard } from '../../components/common/AppCard'
import { AppButton } from '../../components/common/AppButton'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { dashboardApi } from '../../api/dashboardApi'
import { formatBytes } from '../../utils/formatBytes'
import { errorMessage, errorStatus } from '../../utils/errorMessage'
import type { DashboardData, Period } from '../../types/dashboard.types'
import { useNavigate } from 'react-router-dom'

const periods: { value: Period; label: string }[] = [
  { value: 'h', label: '1 Hour' }, { value: 'd', label: '24 Hours' }, { value: '3d', label: '3 Days' },
  { value: 'week', label: '7 Days' }, { value: 'month', label: '1 Month' },
]
const series = [
  { key: 'download', label: 'Download', color: '#1597E5' },
  { key: 'upload', label: 'Upload', color: '#23B779' },
] as const

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('d')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({ download: true, upload: true })
  const navigate = useNavigate()
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await dashboardApi.getDashboard(period)) }
    catch (cause) {
      if (errorStatus(cause) === 405) { navigate('/error/405'); return }
      if (errorStatus(cause) === 500) { navigate('/error/500'); return }
      if (errorStatus(cause) === 403) { navigate('/error/403'); return }
      setError(errorMessage(cause))
    }
    finally { setLoading(false) }
  }, [period, navigate])
  useEffect(() => { void load() }, [load])
  const summary = data?.summary
  const metricCards = [
    { label: 'Download', bytes: summary?.download_data, icon: ArrowDownToLine, className: 'metric-blue' },
    { label: 'Upload', bytes: summary?.upload_data, icon: ArrowUpFromLine, className: 'metric-green' },
    { label: 'Total Data', bytes: summary?.total_data, icon: Database, className: 'metric-purple' },
  ]
  const chart = data?.chart.map(point => ({ ...point, label: point.time.slice(5, 16) })) || []
  return <div className="page-stack">
    <div className="page-heading"><div><span className="eyebrow">NETWORK OVERVIEW</span><h1>Dashboard</h1><p>View network data usage.</p></div><AppButton variant="outline" onClick={() => { void load() }} busy={loading}><RefreshCw size={16}/> Refresh</AppButton></div>
    <div className="metrics-grid">{metricCards.map(({label, bytes, icon: Icon, className}) => <AppCard key={label} className="metric-card"><div className={`metric-icon ${className}`}><Icon size={22}/></div><span className="metric-label">{label}</span><strong>{loading && !data ? '…' : formatBytes(bytes)}</strong><span className="metric-subtitle">Selected period</span></AppCard>)}</div>
    <AppCard className="chart-card"><div className="card-header"><div><h2>Network Traffic</h2><p>Download and upload data usage</p></div><div className="period-control" role="group" aria-label="Choose data period">{periods.map(item => <button key={item.value} className={period === item.value ? 'active' : ''} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div></div>
      <div className="chart-legend">{series.map(item => <button key={item.key} className={!selected[item.key] ? 'muted' : ''} onClick={() => setSelected(old => ({ ...old, [item.key]: !old[item.key] }))}><span style={{background: item.color}}/>{item.label}</button>)}</div>
      {loading && !data ? <LoadingState text="Loading network traffic…"/> : error ? <ErrorState message={error} retry={() => { void load() }}/> : <div className="network-chart" role="img" aria-label="Network traffic usage over time"><ResponsiveContainer width="100%" height={350}><LineChart data={chart} margin={{ top: 12, left: 3, right: 12, bottom: 8 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 5"/><XAxis dataKey="label" tick={{fill:'var(--text-muted)', fontSize:11}} minTickGap={25} tickLine={false} axisLine={false}/><YAxis tick={{fill:'var(--text-muted)', fontSize:11}} width={70} tickLine={false} axisLine={false} tickFormatter={value => formatBytes(value)}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}} formatter={value => formatBytes(Number(value))}/>{series.filter(item => selected[item.key]).map(item => <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2.6} dot={false} activeDot={{r:5}} isAnimationActive={true}/>)}</LineChart></ResponsiveContainer></div>}
    </AppCard>
  </div>
}
