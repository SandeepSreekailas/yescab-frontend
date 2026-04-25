import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Wraps a route that requires the user to be an admin (is_admin=True).
 * - Shows spinner while auth loads.
 * - Redirects to /dashboard if authenticated but not admin.
 * - Redirects to /login if not authenticated at all.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
