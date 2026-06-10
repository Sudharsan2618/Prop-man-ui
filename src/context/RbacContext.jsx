/**
 * RbacContext — Role + permission code resolution for the current user.
 *
 * On login, calls `GET /auth/me/permissions` once to retrieve the flat list
 * of permission codes the user holds. That list drives every
 * `<PermissionGate>` and `<RequirePermission>` decision in the app.
 *
 * Permission codes follow `{entity}.{action}` exactly as defined in the DB
 * (Docs/08_database_schema.md §3, Docs/09_permission_matrix.md).
 *
 * Consumers:
 *   useRbac()         → { role, setRole, permissions: Set, hasPermission(code), ... }
 *   usePermissions()  → thin wrapper exposing only the permission helpers
 *   <PermissionGate code="…">      → declarative gating in JSX
 *   <RequirePermission code="…">   → route-level guard
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMyPermissions } from '../services/api'
import { useAuth } from './AuthContext'
import { reportError } from '../utils/errors'

const RbacContext = createContext(null)

// Role IDs match DB v2 role_enum (08_database_schema.md §4) lowercased,
// with 'provider' as the wire alias for SERVICE_PROVIDER.
export const ROLE_ORDER = ['tenant', 'owner', 'provider', 'manager', 'super_admin']

/** Normalize backend role string (any case) into canonical UI value. */
export function normalizeRole(raw) {
  if (!raw) return null
  const r = String(raw).toLowerCase()
  if (r === 'service_provider') return 'provider'
  if (r === 'admin') return 'manager'
  return r
}

export function RbacProvider({ children, defaultRole = 'tenant' }) {
  const { user, isAuthenticated } = useAuth()
  const [role, setRoleState] = useState(defaultRole)
  const [permissions, setPermissions] = useState(() => new Set())
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  // Sync role from user.active_role whenever the user changes.
  useEffect(() => {
    const r = normalizeRole(user?.active_role || user?.role)
    if (r) setRoleState(r)
  }, [user])

  // Resolve permission codes whenever the authenticated user changes.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setPermissions(new Set())
      setPermissionsLoaded(false)
      return
    }
    let cancelled = false
    setPermissionsLoading(true)
    fetchMyPermissions()
      .then((payload) => {
        if (cancelled) return
        const codes = Array.isArray(payload?.codes) ? payload.codes : []
        setPermissions(new Set(codes))
      })
      .catch((err) => {
        if (cancelled) return
        reportError(err, { context: 'RbacContext.fetchMyPermissions' })
        setPermissions(new Set())
      })
      .finally(() => {
        if (cancelled) return
        setPermissionsLoading(false)
        setPermissionsLoaded(true)
      })
    return () => { cancelled = true }
  }, [isAuthenticated, user?.id, user?.active_role])

  // True from the moment auth resolves as authenticated until the first
  // permission fetch settles. Guards must wait on this — relying on
  // `permissionsLoading` alone misses the render between "isAuthenticated
  // flipped true" and "the effect started".
  const effectiveLoading = permissionsLoading || (isAuthenticated && !permissionsLoaded)

  const setRole = useCallback((next) => {
    const normalized = normalizeRole(next) || defaultRole
    setRoleState(normalized)
  }, [defaultRole])

  const hasPermission = useCallback((code) => {
    if (!code) return true
    return permissions.has(code)
  }, [permissions])

  const hasAnyPermission = useCallback((codes) => {
    if (!codes || codes.length === 0) return true
    return codes.some((c) => permissions.has(c))
  }, [permissions])

  const hasAllPermissions = useCallback((codes) => {
    if (!codes || codes.length === 0) return true
    return codes.every((c) => permissions.has(c))
  }, [permissions])

  const value = useMemo(() => ({
    role,
    setRole,
    roles: ROLE_ORDER,
    permissions,
    permissionsLoading: effectiveLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }), [role, setRole, permissions, effectiveLoading, hasPermission, hasAnyPermission, hasAllPermissions])

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>
}

export function useRbac() {
  const ctx = useContext(RbacContext)
  if (!ctx) throw new Error('useRbac must be used within an RbacProvider')
  return ctx
}

/** Convenience hook that exposes only the permission helpers. */
export function usePermissions() {
  const { permissions, permissionsLoading, hasPermission, hasAnyPermission, hasAllPermissions } = useRbac()
  return { permissions, loading: permissionsLoading, has: hasPermission, hasAny: hasAnyPermission, hasAll: hasAllPermissions }
}
