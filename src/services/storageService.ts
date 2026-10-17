const TOKEN_KEY = 'wifi_dashboard_access_token'
const ACTIVITY_KEY = 'netddash_last_activity'

export const storageService = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token)
    this.touchActivity()
  },
  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(ACTIVITY_KEY)
  },
  getLastActivity(): number | null {
    const stored = sessionStorage.getItem(ACTIVITY_KEY)
    if (!stored) return null
    const timestamp = Number(stored)
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null
  },
  touchActivity(timestamp = Date.now()): void {
    sessionStorage.setItem(ACTIVITY_KEY, String(timestamp))
  },
}
