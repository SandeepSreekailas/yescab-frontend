import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [loading, setLoading] = useState(true) // true until localStorage is read

  // ── Bootstrap from localStorage on mount ──
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedAccess = localStorage.getItem('accessToken')
    const storedRefresh = localStorage.getItem('refreshToken')

    if (storedUser && storedAccess && storedRefresh) {
      try {
        setUser(JSON.parse(storedUser))
        setAccessToken(storedAccess)
        setRefreshToken(storedRefresh)
      } catch {
        clearStorage()
      }
    }
    setLoading(false)
  }, [])

  // ── Persist to localStorage whenever state changes ──
  const persistAuth = useCallback((userData, access, refresh) => {
    setUser(userData)
    setAccessToken(access)
    setRefreshToken(refresh)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }, [])

  const clearStorage = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }, [])

  // ── Register ──
  const register = useCallback(async (formData) => {
    const response = await authAPI.register(formData)
    const { user: userData, tokens } = response.data
    persistAuth(userData, tokens.access, tokens.refresh)
    return response.data
  }, [persistAuth])

  // ── Login ──
  const login = useCallback(async (credentials) => {
    const response = await authAPI.login(credentials)
    const { user: userData, tokens } = response.data
    persistAuth(userData, tokens.access, tokens.refresh)
    return response.data
  }, [persistAuth])

  // ── Google OAuth Login ──
  const googleLogin = useCallback(async (credential) => {
    const response = await authAPI.googleLogin(credential)
    const { user: userData, tokens } = response.data
    persistAuth(userData, tokens.access, tokens.refresh)
    return response.data
  }, [persistAuth])

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      const stored = localStorage.getItem('refreshToken')
      if (stored) {
        await authAPI.logout(stored)
      }
    } catch {
      // Even on error, clear local state — token is expired or already blacklisted
    } finally {
      clearStorage()
    }
  }, [clearStorage])

  // ── Sync user profile update ──
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }, [])

  const isAdmin = Boolean(user?.is_admin)
  const isAuthenticated = Boolean(user && accessToken)

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        isAuthenticated,
        isAdmin,
        register,
        login,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
