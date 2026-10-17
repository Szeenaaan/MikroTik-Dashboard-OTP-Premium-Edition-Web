import { api } from './axiosClient'
import type { ApiEnvelope } from '../types/api.types'
import type { SettingsData } from '../types/settings.types'

// Optional read endpoint is an API path, never a hostname or full URL.
const settingsReadEndpoint = import.meta.env.VITE_SETTINGS_READ_ENDPOINT?.trim() || ''
const validSettingsReadEndpoint = /^\/(?!\/)[a-zA-Z0-9_/-]+$/.test(settingsReadEndpoint)

export const settingsApi = {
  canRead: validSettingsReadEndpoint,
  async getCurrent(): Promise<SettingsData> {
    if (!validSettingsReadEndpoint) throw new Error('Settings read endpoint is not configured.')
    const response = await api.get<ApiEnvelope<SettingsData>>(settingsReadEndpoint)
    if (!response.data.data) throw new Error('Settings read API did not return configuration data.')
    return response.data.data
  },
  async updateDataLimit(data_limit: number): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>('/settings/data-limit', { data_limit })
    if (!response.data.success) throw new Error(response.data.message || 'Unable to save data limit.')
    return response.data
  },
  async updateSessionHours(session_hours: number): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>('/settings/session-hours', { session_hours })
    if (!response.data.success) throw new Error(response.data.message || 'Unable to save session duration.')
    return response.data
  },
}
