export interface SettingsData {
  session_data_limit: number | string | null
  session_hours: number | string | null
}
export interface ChangePasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}