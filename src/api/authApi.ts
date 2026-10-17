import { api } from './axiosClient'
import type { ApiEnvelope } from '../types/api.types'
import type { LoginResult } from '../types/auth.types'

export const authApi = {
  async login(username: string, password: string): Promise<ApiEnvelope<LoginResult>> {
    const response = await api.post<ApiEnvelope<LoginResult>>('/auth/login', { username, password })
    return response.data
  },
  async signup(username: string, password: string): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>('/auth/signup', { username, password })
    return response.data
  },
  async heartbeat(): Promise<ApiEnvelope> {
    const response = await api.get<ApiEnvelope>('/auth/heartbeat', { headers: { 'X-Silent-Auth-Probe': '1' } })
    return response.data
  },
  async logout(): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>('/auth/logout')
    return response.data
  },
}
