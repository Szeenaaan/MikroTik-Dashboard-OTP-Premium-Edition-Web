export interface WifiUser {
  id: number
  mac_address: string
  phone_number: string | null
  ip_address: string | null
  last_login_at: string | null
  download_bytes: number | string | null
  upload_bytes: number | string | null
  is_active: boolean | number
  status: string
  permanent_access: boolean | number
  session_count: number
}
