export function formatBytes(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const bytes = Number(value)
  if (!Number.isFinite(bytes)) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const index = Math.max(0, Math.min(units.length - 1, Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024))))
  const scaled = bytes / Math.pow(1024, index)
  return `${scaled.toLocaleString(undefined, { maximumFractionDigits: index === 0 ? 0 : 2 })} ${units[index]}`
}
