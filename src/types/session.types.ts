export interface HotspotSession {
  id: number
  mac: string
  radius_username: string | null
  ip: string | null
  session_start: string | null
  session_end: string | null
  download_bytes: number | string | null
  upload_bytes: number | string | null
  data_limit: number | string | null
  session_time: number | string | null
  status: string
  is_active: boolean | number
}
