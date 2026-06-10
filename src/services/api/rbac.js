import { get, post, patch, request, BASE, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

/* ─── Roles ─── */
export async function fetchRoles() {
  const cacheKey = buildApiCacheKey('rbac:roles')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/rbac/roles')
    return res?.data || []
  }, { ttlMs: 60_000 })
}

export async function createRole(payload) {
  const res = await post('/rbac/roles', { body: payload })
  invalidateApiCache(['rbac:roles', 'rbac:matrix'])
  return res?.data
}

export async function updateRole(roleId, payload) {
  const res = await patch(`/rbac/roles/${roleId}`, { body: payload })
  invalidateApiCache(['rbac:roles', 'rbac:matrix'])
  return res?.data
}

export async function deleteRole(roleId) {
  const res = await request('DELETE', `${BASE}/rbac/roles/${roleId}`)
  invalidateApiCache(['rbac:roles', 'rbac:matrix'])
  return res?.data
}

/* ─── Permissions ─── */
export async function fetchPermissions() {
  const cacheKey = buildApiCacheKey('rbac:permissions')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/rbac/permissions')
    return res?.data || []
  }, { ttlMs: 60_000 })
}

export async function createPermission(payload) {
  const res = await post('/rbac/permissions', { body: payload })
  invalidateApiCache(['rbac:permissions', 'rbac:roles', 'rbac:matrix'])
  return res?.data
}

export async function updatePermission(permissionId, payload) {
  const res = await patch(`/rbac/permissions/${permissionId}`, { body: payload })
  invalidateApiCache(['rbac:permissions', 'rbac:matrix'])
  return res?.data
}

export async function deletePermission(permissionId) {
  const res = await request('DELETE', `${BASE}/rbac/permissions/${permissionId}`)
  invalidateApiCache(['rbac:permissions', 'rbac:matrix'])
  return res?.data
}

export async function updateRolePermissions(roleId, permissionIds) {
  const res = await request('PUT', `${BASE}/rbac/roles/${roleId}/permissions`, {
    body: { permission_ids: permissionIds },
  })
  invalidateApiCache(['rbac:roles', 'rbac:matrix'])
  return res?.data
}

/* ─── Matrix & user-roles ─── */
export async function fetchPermissionMatrix() {
  const cacheKey = buildApiCacheKey('rbac:matrix')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/rbac/matrix')
    return res?.data || { roles: [], permissions: [], matrix: [] }
  }, { ttlMs: 60_000 })
}

export async function fetchUserRoles(userId) {
  const cacheKey = buildApiCacheKey('rbac:user-roles', { userId })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/rbac/users/${userId}/roles`)
    return res?.data || { user_id: userId, active_role: null, roles: [] }
  }, { ttlMs: 60_000 })
}

export async function updateUserRoles(userId, roleIds) {
  const res = await request('PUT', `${BASE}/rbac/users/${userId}/roles`, {
    body: { role_ids: roleIds },
  })
  invalidateApiCache(['rbac:user-roles', 'rbac:matrix', 'users:list'])
  return res?.data
}
