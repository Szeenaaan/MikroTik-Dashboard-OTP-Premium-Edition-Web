
export function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase()

  const variant = ['active', 'healthy', 'running', 'online'].includes(lower)
    ? 'success'
    : ['blocked', 'unhealthy', 'failed', 'terminated'].includes(lower)
      ? 'danger'
      : 'info'

  return (
    <span className={`status-badge status-${variant}`}>
      <span className="badge-dot" />
      {status || 'Unknown'}
    </span>
  )
}
