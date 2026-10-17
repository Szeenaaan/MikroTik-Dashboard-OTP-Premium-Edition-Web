import { api } from './axiosClient'
import type { DashboardData, Period } from '../types/dashboard.types'
import type { ApiEnvelope } from '../types/api.types'

export const dashboardApi = {
  async getDashboard(period: Period = 'd', silentAuthProbe = false): Promise<DashboardData> {
    const response = await api.get<ApiEnvelope<DashboardData>>('/dashboard', { params: { type: 'total', period }, headers: silentAuthProbe ? { 'X-Silent-Auth-Probe': '1' } : undefined })
    if (!response.data.success || !response.data.data) throw new Error(response.data.message || 'Unable to load dashboard.')
    const result = response.data.data
    if (!Array.isArray(result.chart) || !result.summary || result.summary.download_data === undefined) {
      throw new Error('Unexpected dashboard response from Laravel.')
    }
    return result
  },
}
