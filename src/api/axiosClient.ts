import axios from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    failurePresentation?: 'local'
  }
}
import { storageService } from '../services/storageService'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { Accept: 'application/json' },
  timeout: 25000,
})

api.interceptors.request.use((config) => {
  const token = storageService.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response) {
    const url = error.config?.url || ''
    const silent = error.config?.headers?.['X-Silent-Auth-Probe'] === '1'
    const locallyHandled = error.config?.failurePresentation === 'local'
    const authenticationForm = /\/auth\/(login|signup)$|\/application\/(activate|status)$/.test(url)
    if (!silent && !authenticationForm) {
      const status = error.response.status
      const message = String((error.response.data as {message?:string} | undefined)?.message || '').toLowerCase()
      const activationInvalid = status === 403 && (message.includes('activation required') || message.includes('application activation'))
      if (activationInvalid || [401, 403, 405].includes(status) || (status === 500 && !locallyHandled)) {
        window.dispatchEvent(new CustomEvent('wifi:api-error', { detail: { status: activationInvalid ? 'activation' : status } }))
      }
    }
  }
  return Promise.reject(error)
})
