import { api } from './axiosClient'
import type { Filters, ApiEnvelope, LaravelPagination } from '../types/api.types'
import type { WifiUser } from '../types/user.types'

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

export const usersApi = {
  async list(filters: Filters): Promise<LaravelPagination<WifiUser>> {
    const { data } = await api.get<unknown>('/users', { params: filters, failurePresentation: 'local' })
    return unwrapPaginator<WifiUser>(data)
  },
  async action(id: number, operation: 'block' | 'unblock' | 'bypass' | 'remove-bypass'): Promise<ApiEnvelope> {
    const response = await api.post<ApiEnvelope>(`/users/${id}/${operation}`, undefined, { failurePresentation: 'local' })
    return response.data
  },
  async export(filters: Filters): Promise<Blob> {
    const response = await api.get<Blob>('/users/export', { params: filters, responseType: 'blob', failurePresentation: 'local' })
    return response.data
  },
}
