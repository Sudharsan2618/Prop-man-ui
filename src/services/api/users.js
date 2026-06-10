import { get, post, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

export async function fetchUsers(params = {}) {
  const cacheKey = buildApiCacheKey('users:list', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/users', { params })
    return res?.data || []
  }, { ttlMs: 60_000 })
}

export async function inviteOwner({ name, email }) {
  const res = await post('/users/invite-owner', { body: { name, email } })
  invalidateApiCache(['users:list', 'admin:stats', 'admin:dashboard'])
  return res?.data
}

export async function fetchUserById(id) {
  const res = await get(`/users/${id}`)
  return res.data
}

export async function fetchUserManagedSummary(id) {
  const cacheKey = buildApiCacheKey('users:managed-summary', { id })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/users/${id}/managed-summary`)
    return res?.data || null
  }, { ttlMs: 60_000 })
}

export async function createUserAsSuperAdmin(payload) {
  const res = await post('/users/create', { body: payload })
  invalidateApiCache(['users:list', 'users:managed-summary', 'sa:dashboard'])
  return res?.data
}

export async function fetchUsersByRole(role, search = '') {
  const params = {}
  if (search) params.search = search
  const res = await get(`/users/by-role/${role}`, { params })
  return res?.data || []
}
