import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute — RBAC route guard
 *
 * Props:
 *   children      — component to render when access is granted
 *   requireAuth   — if true, redirect unauthenticated users to /login (default: true)
 *   requireRole   — one or more roles required: 'super_admin' | 'market_manager' | 'shop_owner' | 'user'
 *                   pass a string or array. If omitted, any authenticated user is allowed.
 *   redirectTo    — where to send unauthorised users (default: '/')
 *
 * Examples:
 *   <ProtectedRoute requireRole={['super_admin','market_manager']}>
 *   <ProtectedRoute requireRole="shop_owner">
 *   <ProtectedRoute requireAuth>          (any logged-in user)
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = '/',
}) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  /* Still loading auth state — show spinner */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  /* Not authenticated */
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  /* Check role */
  if (requireRole && user) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole]
    if (!allowed.includes(role)) {
      // Send to role-appropriate home
      const roleHome = getHomeForRole(role)
      return <Navigate to={roleHome} replace />
    }
  }

  return children
}

/**
 * Returns the "home" URL for a given role.
 * Used when a user tries to access a page they don't have permission for.
 */
export function getHomeForRole(role) {
  switch (role) {
    case 'super_admin':
    case 'market_manager':
      return '/admin'
    case 'shop_owner':
      return '/dashboard'
    default:
      return '/account'
  }
}
