export interface ActivationStatus {
  success: boolean
  statuscode: number
  activated: boolean
  message: string
}

export interface LoginResult {
  token: string
  token_type: 'Bearer' | string
}
