import { api } from './axiosClient'
import type { Filters, ApiEnvelope, LaravelPagination } from '../types/api.types'
import type { HotspotSession } from '../types/session.types'

function isPaginator<T>(value: unknown): value is LaravelPagination<T> {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Partial<LaravelPagination<T>>
  return Array.isArray(item.data) && typeof item.total === 'number' && typeof item.current_page === 'number'
}

function unwrapPaginator<T>(value: unknown): LaravelPagination<T> {
  if (isPaginator<T>(value)) return value
  if (typeof value === 'object' && value !== null && 'data' in value && isPaginator<T>(value.data)) return value.data
  throw new Error('Laravel returned an unexpected pagination response. Check the API controller.')
}

export const sessionsApi = {
  async list(filters: Filters): Promise<LaravelPagination<HotspotSession>> {
    const { data } = await api.get<unknown>('/sessions', { params: filters, failurePresentation: 'local' })
    return unwrapPaginator<HotspotSession>(data)
  },
  async terminate(id: number): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>(`/sessions/${id}/terminate`, undefined, { failurePresentation: 'local' })
    return response.data
  },
  async updateLimit(id: number, data_limit: number): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>(`/sessions/${id}/data-limit`, { data_limit }, { failurePresentation: 'local' })
    return response.data
  },
  async export(filters: Filters): Promise<Blob> {
    const response = await api.get<Blob>('/sessions/export', { params: filters, responseType: 'blob', failurePresentation: 'local' })
    return response.data
  },
}
