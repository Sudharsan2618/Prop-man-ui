import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePermissions } from '../../context/RbacContext'

/**
 * RequirePermission — Route-level permission guard.
 *
 * Renders its children (or <Outlet/> when used as a layout route) only if
 * the current user holds the required permission(s). Otherwise navigates
 * to /forbidden with the original location in state so a "back" link works.
 *
 * Usage in AppRouter:
 *   <Route element={<RequirePermission code="property.create" />}>
 *     <Route path="/list-property" element={<ListNewProperty />} />
 *   </Route>
 *
 *   <Route element={<RequirePermission anyOf={["payment.read", "payment.update"]} />}>
 *     <Route path="/manager-finance" element={<ManagerFinancial />} />
 *   </Route>
 *
 * Permission codes follow `{entity}.{action}` exactly as defined in the DB
 * (see Docs/09_permission_matrix.md).
 *
 * @param {object} props
 * @param {string}   [props.code]      Single required permission code
 * @param {string[]} [props.anyOf]     User must hold at least one of these codes
 * @param {string[]} [props.allOf]     User must hold all of these codes
 * @param {string}   [props.redirectTo] Path to redirect on deny (default /forbidden)
 * @param {React.ReactNode} [props.children] Optional inline children; if
 *   omitted the component renders <Outlet/> (layout-route usage)
 */
export default function RequirePermission({ code, anyOf, allOf, redirectTo = '/forbidden', children }) {
  const { has, hasAny, hasAll, loading } = usePermissions()
  const location = useLocation()

  // Wait for the permission set to resolve before deciding.
  if (loading) return null

  let allowed = true
  if (code) allowed = allowed && has(code)
  if (anyOf && anyOf.length > 0) allowed = allowed && hasAny(anyOf)
  if (allOf && allOf.length > 0) allowed = allowed && hasAll(allOf)

  if (!allowed) {
    return <Navigate to={redirectTo} state={{ from: location, required: { code, anyOf, allOf } }} replace />
  }
  return children ? <>{children}</> : <Outlet />
}
