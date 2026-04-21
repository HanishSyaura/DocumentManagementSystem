import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL })

let refreshing = null

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    const original = error?.config

    if (!original || status !== 401) {
      return Promise.reject(error)
    }

    const url = String(original.url || '')
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/verify-2fa') ||
      url.includes('/auth/resend-2fa')

    if (isAuthEndpoint || original._retry) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return Promise.reject(error)
    }

    original._retry = true

    try {
      if (!refreshing) {
        refreshing = axios
          .post(
            `${baseURL}/auth/refresh-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )
          .then((r) => {
            const data = r?.data?.data || r?.data || {}
            const nextAccess =
              data.accessToken || data.token || data?.tokens?.accessToken || data?.tokens?.token
            const nextRefresh =
              data.refreshToken || data?.tokens?.refreshToken

            if (nextAccess) localStorage.setItem('token', nextAccess)
            if (nextRefresh) localStorage.setItem('refreshToken', nextRefresh)

            return nextAccess
          })
          .finally(() => {
            refreshing = null
          })
      }

      const nextAccess = await refreshing
      if (nextAccess) {
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${nextAccess}`
      }

      return api.request(original)
    } catch (refreshErr) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      return Promise.reject(refreshErr)
    }
  }
)

export default api
