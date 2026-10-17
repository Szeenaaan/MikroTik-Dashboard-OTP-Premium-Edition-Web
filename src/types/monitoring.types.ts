export interface HealthCheck {
  success: boolean
  statuscode: number
  message?: string
  messege?: string
  expected?: number
  active?: number
  data?: Record<string, HealthCheck>
}

export interface MonitoringResult {
  success: boolean
  statuscode: number
  message: string
  data: Record<string, HealthCheck>
}
