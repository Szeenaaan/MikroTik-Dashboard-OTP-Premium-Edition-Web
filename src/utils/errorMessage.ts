import axios from 'axios'
import type { ApiEnvelope } from '../types/api.types'

export function errorMessage(error: unknown, fallback = 'Unable to complete the request.'): string {
  if (axios.isAxiosError<ApiEnvelope>(error)) {
    if (!error.response) return 'Unable to connect to the server. Check your network connection.'
    return error.response.data?.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}
