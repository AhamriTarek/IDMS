import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Token helpers ─────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:  () => sessionStorage.getItem('idms_access'),
  getRefresh: () => sessionStorage.getItem('idms_refresh'),
  setTokens:  (access, refresh) => {
    sessionStorage.setItem('idms_access', access)
    if (refresh) sessionStorage.setItem('idms_refresh', refresh)
  },
  clearTokens: () => {
    sessionStorage.removeItem('idms_access')
    sessionStorage.removeItem('idms_refresh')
  },
}

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccess()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let _refreshing = false
let _refreshQueue = []

const processQueue = (error, token = null) => {
  _refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  _refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/token/')
    ) {
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      _refreshing = true
      const refreshToken = tokenStorage.getRefresh()

      if (!refreshToken) {
        _refreshing = false
        tokenStorage.clearTokens()
        window.location.href = '/'
        return Promise.reject(error)
      }

      try {
        // FIX: correct refresh endpoint
        const { data } = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        })
        tokenStorage.setTokens(data.access, data.refresh)
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clearTokens()
        window.location.href = '/'
        return Promise.reject(refreshError)
      } finally {
        _refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
