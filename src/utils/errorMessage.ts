import axios from 'axios'
import type { ApiEnvelope } from '../types/api.types'

export function errorMessage(error: unknown, fallback = 'Unable to complete the request.'): string {
  if (axios.isAxiosError<ApiEnvelope>(error)) {
    if (!error.response) return 'Unable to connect to the server. Check your network connection.'
    const body = error.response.data
    if (typeof body?.message === 'string' && body.message.trim()) return body.message.trim()
    const validation = body?.errors && Object.values(body.errors).flat().find(item => typeof item === 'string' && item.trim())
    if (validation) return validation
    if (error.response.status === 503) return 'Service is temporarily unavailable. Please try again later.'
    if (error.response.status === 429) return 'Too many requests. Please try again later.'
    return fallback
  }
  return error instanceof Error ? error.message : fallback
}

export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}
