import axios from 'axios'
import { api } from './axiosClient'
import type { MonitoringResult } from '../types/monitoring.types'

export const monitoringApi = {
  async status(): Promise<MonitoringResult> {
    try {
      const response = await api.get<MonitoringResult>('/monitoring/status')
      return response.data
    } catch (error) {
      if (axios.isAxiosError<MonitoringResult>(error) && error.response?.status === 503 && error.response.data?.data) {
        return error.response.data
      }
      throw error
    }
  },
}
