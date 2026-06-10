import { get, post, patch, request, BASE, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

const AMENITY_ICON_MAP = {
  parking: 'local_parking', pool: 'pool', gym: 'fitness_center', security: 'security',
  power_backup: 'bolt', playground: 'park', garden: 'yard', elevator: 'elevator',
  water: 'water_drop', cctv: 'videocam', internet: 'wifi', club_house: 'nightlife',
  jogging_track: 'directions_run', rainwater_harvesting: 'water',
  fire_safety: 'local_fire_department', intercom: 'phone_in_talk', maintenance: 'build',
  atm: 'atm', school: 'school', hospital: 'local_hospital', mall: 'storefront',
  metro: 'subway', bus_stop: 'directions_bus',
}

export function normalizeProperty(p) {
  if (!p) return null
  return {
    ...p,
    image: p.images?.[0] || '',
    chips: [p.bhk, `${p.sqft} sqft`, p.furnishing?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())].filter(Boolean),
    amenityIcons: (p.amenities || []).map(a => AMENITY_ICON_MAP[a] || 'help_outline'),
  }
}

export async function fetchProperties(filters = {}) {
  const params = {}
  if (filters.search) params.search = filters.search
  if (filters.city) params.city = filters.city
  if (filters.type) params.type = filters.type
  if (filters.furnishing) params.furnishing = filters.furnishing
  if (filters.occupancy) params.occupancy = filters.occupancy
  if (filters.minRent) params.min_rent = filters.minRent
  if (filters.maxRent) params.max_rent = filters.maxRent
  if (filters.bhk) params.bhk = filters.bhk
  if (filters.premium !== undefined) params.premium = filters.premium

  const cacheKey = buildApiCacheKey('properties:search', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/properties', { params })
    return (res.data || []).map(normalizeProperty)
  }, { ttlMs: 60_000 })
}

export async function fetchPropertyById(id) {
  const cacheKey = buildApiCacheKey('properties:detail', { id })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/properties/${id}`)
    return normalizeProperty(res.data)
  }, { ttlMs: 60_000 })
}

export async function fetchPropertiesByOwner() {
  // Hot-path: pull from owner dashboard if already loaded.
  const { fetchOwnerDashboard } = await import('./dashboards')
  const dashboard = await fetchOwnerDashboard()
  if (dashboard && Array.isArray(dashboard.properties)) {
    return (dashboard.properties || []).map(normalizeProperty)
  }

  const cacheKey = buildApiCacheKey('owner:properties:me')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/properties/owner/me')
    return (res.data || []).map(normalizeProperty)
  }, { ttlMs: 60_000 })
}

export async function fetchPropertiesByTenant() {
  const cacheKey = buildApiCacheKey('tenant:properties:me')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/properties/tenant/me')
    return (res.data || []).map(normalizeProperty)
  }, { ttlMs: 60_000 })
}

export async function createProperty(data) {
  const res = await post('/properties', { body: data })
  invalidateApiCache(['properties:search', 'owner:properties:me', 'owner:dashboard', 'admin:stats', 'admin:dashboard', 'sa:dashboard'])
  return normalizeProperty(res.data)
}

export async function fetchPropertyDetails(id) {
  const res = await get(`/properties/${id}/details`)
  return res.data
}

/**
 * Patch a property. Used by the wizard's edit-draft flow and to publish/archive.
 * Pass { status: 'active' } to publish a draft (backend validates completeness).
 */
export async function updateProperty(id, data) {
  const res = await patch(`/properties/${id}`, { body: data })
  invalidateApiCache([
    'properties:search', 'properties:detail', 'owner:properties:me',
    'owner:dashboard', 'admin:dashboard', 'sa:dashboard',
  ])
  return normalizeProperty(res.data)
}

/** Publish a draft listing (status → active). */
export async function publishProperty(id) {
  return updateProperty(id, { status: 'active' })
}

/** Archive a listing (status → archived). */
export async function archiveProperty(id) {
  return updateProperty(id, { status: 'archived' })
}

export async function assignPropertyManagers(propertyId, managerIds, role = 'PRIMARY') {
  const res = await post(`/properties/${propertyId}/managers`, { body: { manager_ids: managerIds, role } })
  invalidateApiCache(['properties:search', 'properties:detail'])
  return res?.data
}

export async function removePropertyManager(propertyId, managerId) {
  const res = await request('DELETE', `${BASE}/properties/${propertyId}/managers/${managerId}`)
  invalidateApiCache(['properties:search', 'properties:detail'])
  return res?.data
}

export async function assignTenant(propertyId, payload) {
  const res = await post(`/properties/${propertyId}/assign-tenant`, { body: payload })
  invalidateApiCache(['properties:search', 'properties:detail', 'sa:dashboard'])
  return res?.data
}

export async function removeTenant(propertyId, notes = '') {
  const res = await post(`/properties/${propertyId}/remove-tenant`, { body: { notes } })
  invalidateApiCache(['properties:search', 'properties:detail', 'sa:dashboard'])
  return res?.data
}

export async function fetchOccupancyHistory(propertyId) {
  const res = await get(`/properties/${propertyId}/occupancy-history`)
  return res?.data || []
}

export function formatRent(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L/mo`
  return `₹${amount?.toLocaleString('en-IN')}/mo`
}
