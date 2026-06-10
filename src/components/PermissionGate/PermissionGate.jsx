import { usePermissions } from '../../context/RbacContext'

/**
 * PermissionGate — Declarative permission gating for JSX.
 *
 * Renders children only if the current user holds the required permission(s).
 * Otherwise renders the `fallback` prop (defaults to nothing).
 *
 * Usage:
 *   <PermissionGate code="payment.update">
 *     <PrimaryButton>Approve & Release</PrimaryButton>
 *   </PermissionGate>
 *
 *   <PermissionGate anyOf={["payment.update", "payment.create"]}>…</PermissionGate>
 *   <PermissionGate allOf={["job.update", "payment.update"]}>…</PermissionGate>
 *
 * Permission codes follow `{entity}.{action}` exactly as defined in the DB
 * (see Docs/09_permission_matrix.md).
 *
 * @param {object} props
 * @param {string}   [props.code]      Single required permission code
 * @param {string[]} [props.anyOf]     User must have at least one of these codes
 * @param {string[]} [props.allOf]     User must have all of these codes
 * @param {React.ReactNode} [props.fallback]  Rendered when access is denied
 * @param {React.ReactNode}  props.children   Rendered when access is granted
 */
export default function PermissionGate({ code, anyOf, allOf, fallback = null, children }) {
  const { has, hasAny, hasAll } = usePermissions()

  let allowed = true
  if (code) allowed = allowed && has(code)
  if (anyOf && anyOf.length > 0) allowed = allowed && hasAny(anyOf)
  if (allOf && allOf.length > 0) allowed = allowed && hasAll(allOf)

  return allowed ? <>{children}</> : <>{fallback}</>
}
