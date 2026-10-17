export interface ApiEnvelope<T = unknown> {
  success: boolean
  statuscode: number
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface LaravelPagination<T> {
  current_page: number
  data: T[]
  first_page_url?: string
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface Filters {
  search: string
  status: string
  from_date: string
  to_date: string
  order: 'asc' | 'desc'
  page: number
}

export const initialFilters: Filters = {
  search: '', status: '', from_date: '', to_date: '', order: 'desc', page: 1,
}
