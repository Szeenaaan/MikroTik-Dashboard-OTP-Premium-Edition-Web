export type Period = 'h' | 'd' | '3d' | 'week' | 'month'

export interface UsageSummary {
  type: string
  period?: string
  data?: number
  download_data?: number
  upload_data?: number
  total_data?: number
}

export interface ChartPoint {
  time: string
  download: number
  upload: number
  total: number
}

export interface DashboardData {
  summary: UsageSummary
  chart: ChartPoint[]
}
