/**
 * RoleContext — DEPRECATED back-compat shim.
 *
 * The real implementation lives in:
 *   - AuthContext.jsx → auth state (user, login/logout/signup/passwordReset)
 *   - RbacContext.jsx → role + permission codes (hasPermission, etc.)
 *
 * `useRole()` is kept so existing pages keep working without a sweep.
 * `RoleProvider` mounts both providers in the correct order.
 *
 * New code should call `useAuth()` and/or `useRbac()` / `usePermissions()`
 * directly.
 */
import { useMemo } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { RbacProvider, useRbac, normalizeRole } from './RbacContext'

export { normalizeRole }

export function RoleProvider({ children, defaultRole = 'tenant' }) {
  return (
    <AuthProvider>
      <RbacProvider defaultRole={defaultRole}>
        {children}
      </RbacProvider>
    </AuthProvider>
  )
}

/**
 * Composite hook returning the same shape the old RoleContext exposed.
 * Prefer useAuth() / useRbac() / usePermissions() in new code.
 */
export function useRole() {
  const auth = useAuth()
  const rbac = useRbac()
  return useMemo(() => ({
    // Auth
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.loading,
    requiresPasswordReset: auth.requiresPasswordReset,
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout,
    completeFirstLoginPasswordReset: auth.completeFirstLoginPasswordReset,
    // Rbac
    role: rbac.role,
    setRole: rbac.setRole,
    roles: rbac.roles,
    hasPermission: rbac.hasPermission,
    hasAnyPermission: rbac.hasAnyPermission,
    hasAllPermissions: rbac.hasAllPermissions,
    permissions: rbac.permissions,
    // Legacy no-op (was used pre-real-auth to swap user fixtures).
    switchToUser: () => {},
  }), [auth, rbac])
}
