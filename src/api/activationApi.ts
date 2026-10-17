import { api } from './axiosClient'
import type { ActivationStatus } from '../types/auth.types'
import type { ApiEnvelope } from '../types/api.types'

export const activationApi = {
  async status(): Promise<ActivationStatus> {
    try {
      const response = await api.get<ActivationStatus>('/application/status')
      return response.data
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status: number; data?: ActivationStatus } }).response
        if (response?.status === 403 && typeof response.data?.activated === 'boolean') return response.data
      }
      throw error
    }
  },
  async activate(application_key: string): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>('/application/activate', { application_key })
    return response.data
  },
}
