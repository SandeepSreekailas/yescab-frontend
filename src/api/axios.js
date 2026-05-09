import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor: attach access token to every request ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: handle 401 by refreshing access token ──
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh for 401 errors that haven't been retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login/' &&
      originalRequest.url !== '/auth/token/refresh/'
    ) {
      if (isRefreshing) {
        // Queue up requests while a refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        isRefreshing = false
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access, refresh } = response.data
        localStorage.setItem('accessToken', access)
        if (refresh) localStorage.setItem('refreshToken', refresh)

        api.defaults.headers.common.Authorization = `Bearer ${access}`
        originalRequest.headers.Authorization = `Bearer ${access}`

        processQueue(null, access)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

function clearAuthAndRedirect() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

// ── Auth API ──
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  googleLogin: (credential) => api.post('/auth/google/', { credential }),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  verifyEmail: (data) => api.post('/auth/verify-email/', data),
  resendVerification: () => api.post('/auth/resend-verification/'),
  deleteAccount: (data) => api.post('/auth/delete-account/', data),
}

// ── Bookings API ──
export const bookingsAPI = {
  create: (data) => api.post('/bookings/', data),
  list: () => api.get('/bookings/'),
  detail: (id) => api.get(`/bookings/${id}/`),
}

// ── Admin API ──
export const adminAPI = {
  // Bookings
  listAllBookings: (params) => api.get('/bookings/admin/all/', { params }),
  updateBookingStatus: (id, data) => api.patch(`/bookings/admin/${id}/status/`, data),

  // Users
  listUsers: (params) => api.get('/auth/admin/users/', { params }),
  getUser: (id) => api.get(`/auth/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/admin/users/${id}/`),
}

export default api
