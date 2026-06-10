import { get, post, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

// Map service type names → Material Symbols icon names
export const SERVICE_ICON_MAP = {
  plumbing: 'plumbing',
  electrical: 'electrical_services',
  carpentry: 'handyman',
  painting: 'format_paint',
  deep_cleaning: 'cleaning_services',
  pest_control: 'pest_control',
  appliance_repair: 'build',
  ac_hvac: 'ac_unit',
  gardening: 'yard',
  water: 'water_drop',
  milk: 'local_drink',
  car: 'local_car_wash',
}

export function normalizeJob(j) {
  if (!j) return null
  return {
    ...j,
    serviceType: j.service_type,
    propertyId: j.property_id,
    tenantId: j.tenant_id,
    tenantName: j.tenant_name,
    providerId: j.provider_id,
    providerName: j.provider_name,
    scheduledDate: j.scheduled_date,
    scheduledTime: j.scheduled_time,
    estimatedCost: j.estimated_cost || {},
    actualCost: j.actual_cost,
    createdAt: j.created_at,
    completedAt: j.completed_at,
  }
}

export async function fetchJobs(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.property_id) params.property_id = filters.property_id
  const cacheKey = buildApiCacheKey('jobs:list', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/jobs', { params })
    return (res.data || []).map(normalizeJob)
  }, { ttlMs: 120_000 })
}

export async function fetchJobById(id) {
  const cacheKey = buildApiCacheKey('jobs:detail', { id })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/jobs/${id}`)
    return normalizeJob(res.data)
  }, { ttlMs: 120_000 })
}

export async function createJob(data) {
  const res = await post('/jobs', { body: data })
  invalidateApiCache(['jobs:list', 'provider:stats', 'provider:dashboard'])
  return normalizeJob(res.data)
}

const FALLBACK_CATEGORIES = [
  { key: 'plumbing', icon: 'plumbing', label: 'Plumbing', startPrice: 500, emergency: true },
  { key: 'electrician', icon: 'electrical_services', label: 'Electrical', startPrice: 400 },
  { key: 'carpentry', icon: 'handyman', label: 'Carpentry', startPrice: 600 },
  { key: 'painting', icon: 'format_paint', label: 'Painting', startPrice: 1000 },
  { key: 'deep_cleaning', icon: 'cleaning_services', label: 'Deep Cleaning', startPrice: 800 },
  { key: 'pest_control', icon: 'pest_control', label: 'Pest Control', startPrice: 700 },
  { key: 'appliance_repair', icon: 'build', label: 'Appliance Repair', startPrice: 500 },
  { key: 'ac_hvac', icon: 'ac_unit', label: 'AC / HVAC', startPrice: 600 },
]

export async function fetchServiceCategories() {
  try {
    const res = await get('/jobs/categories')
    return (res.data || []).map(c => {
      const key = c.id || c.name.toLowerCase().replace(/ ?\/ ?/g, '_').replace(/ /g, '_')
      return {
        key,
        icon: SERVICE_ICON_MAP[key] || 'build',
        label: c.name,
        startPrice: c.start_price || 500,
        emergency: key === 'plumbing',
      }
    })
  } catch {
    return FALLBACK_CATEGORIES
  }
}
