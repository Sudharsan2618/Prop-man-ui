/**
 * LuxeLife — Real API client.
 *
 * Replaces the mock api.js with actual HTTP calls to the FastAPI backend.
 * All requests go through the Vite proxy (/api → localhost:8000).
 *
 * Auth tokens are stored in localStorage and attached to every request.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
const CACHE_PREFIX = 'll_api_cache_v1:'
const apiMemoryCache = new Map()
const inFlightCacheRequests = new Map()

/* ─── Token management ─── */
export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem('ll_tokens') || '{}')
  } catch { return {} }
}
export function setTokens(tokens) {
  localStorage.setItem('ll_tokens', JSON.stringify(tokens))
}
export function clearTokens() {
  clearApiCache()
  localStorage.removeItem('ll_tokens')
}

function cacheScopeKey() {
  const { access_token } = getTokens()
  if (!access_token) return 'anon'
  return access_token.slice(-16)
}

function scopedCacheKey(cacheKey) {
  return `${CACHE_PREFIX}${cacheScopeKey()}:${cacheKey}`
}

function safeParseCache(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function readCacheEntry(cacheKey) {
  const key = scopedCacheKey(cacheKey)
  const memoryHit = apiMemoryCache.get(key)
  if (memoryHit) {
    return {
      value: memoryHit.value,
      isFresh: memoryHit.expiresAt > Date.now(),
    }
  }

  const raw = localStorage.getItem(key)
  if (!raw) return null

  const parsed = safeParseCache(raw)
  if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, 'value')) {
    localStorage.removeItem(key)
    return null
  }

  const normalized = {
    value: parsed.value,
    expiresAt: parsed.expiresAt || 0,
    cachedAt: parsed.cachedAt || 0,
  }
  apiMemoryCache.set(key, normalized)

  return {
    value: normalized.value,
    isFresh: normalized.expiresAt > Date.now(),
  }
}

function writeCacheEntry(cacheKey, value, ttlMs) {
  const key = scopedCacheKey(cacheKey)
  const entry = {
    value,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  }
  apiMemoryCache.set(key, entry)
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Ignore storage quota errors and keep memory cache working.
  }
}

function serializeParamsForCache(params = {}) {
  const keys = Object.keys(params).sort()
  if (keys.length === 0) return 'default'
  return keys.map((k) => `${k}:${String(params[k])}`).join('|')
}

export function buildApiCacheKey(resource, params = {}) {
  return `${resource}:${serializeParamsForCache(params)}`
}

export function getCachedApiValue(cacheKey, fallback = null) {
  const cached = readCacheEntry(cacheKey)
  return cached?.value ?? fallback
}

export function invalidateApiCache(matchers = []) {
  const patterns = Array.isArray(matchers) ? matchers : [matchers]
  const shouldDelete = (key) => {
    if (patterns.length === 0) return true
    return patterns.some((p) => key.includes(String(p)))
  }

  for (const key of Array.from(apiMemoryCache.keys())) {
    if (shouldDelete(key)) apiMemoryCache.delete(key)
  }

  try {
    const lsKeys = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) lsKeys.push(key)
    }
    lsKeys.forEach((key) => {
      if (shouldDelete(key)) localStorage.removeItem(key)
    })
  } catch {
    // Ignore localStorage access edge cases.
  }
}

function clearApiCache() {
  invalidateApiCache()
}

async function fetchWithCache(cacheKey, fetcher, { ttlMs = 60_000, allowStale = true, revalidateStale = true } = {}) {
  const cached = readCacheEntry(cacheKey)
  if (cached?.isFresh) return cached.value

  const sharedReqKey = scopedCacheKey(`inflight:${cacheKey}`)
  const inFlight = inFlightCacheRequests.get(sharedReqKey)

  if (cached?.value !== undefined && allowStale) {
    if (!inFlight && revalidateStale) {
      const revalidatePromise = fetcher()
        .then((fresh) => {
          writeCacheEntry(cacheKey, fresh, ttlMs)
          return fresh
        })
        .finally(() => inFlightCacheRequests.delete(sharedReqKey))
      inFlightCacheRequests.set(sharedReqKey, revalidatePromise)
    }
    return cached.value
  }

  if (inFlight) return inFlight

  const networkPromise = fetcher()
    .then((fresh) => {
      writeCacheEntry(cacheKey, fresh, ttlMs)
      return fresh
    })
    .finally(() => inFlightCacheRequests.delete(sharedReqKey))

  inFlightCacheRequests.set(sharedReqKey, networkPromise)
  return networkPromise
}

/* ─── Core fetch wrapper ─── */
async function request(method, path, { body, params, auth = true, _retry = false, _networkRetried = false } = {}) {
  const url = new URL(path, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, v) })

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const { access_token } = getTokens()
    if (access_token) headers['Authorization'] = `Bearer ${access_token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  let res
  let parsedJson = null
  const readJson = async () => {
    if (parsedJson !== null) return parsedJson
    parsedJson = await res.json().catch(() => ({}))
    return parsedJson
  }
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    if (!_networkRetried) {
      let fallbackPath = null

      if (path.startsWith('http://127.0.0.1:8000')) {
        fallbackPath = path.replace('http://127.0.0.1:8000', 'http://localhost:8000')
      } else if (path.startsWith('http://localhost:8000')) {
        fallbackPath = path.replace('http://localhost:8000', 'http://127.0.0.1:8000')
      } else if (path.startsWith('/api/')) {
        fallbackPath = `http://127.0.0.1:8000${path}`
      }

      if (fallbackPath) {
        return request(method, fallbackPath, {
          body,
          params,
          auth,
          _retry,
          _networkRetried: true,
        })
      }
    }

    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Check that backend is running and proxy is configured.')
    }
    throw new Error('Cannot reach API server. Check UI proxy and backend URL.')
  } finally {
    clearTimeout(timeoutId)
  }

  if (res.status === 401) {
    const json = await readJson()
    const detail = json?.error?.message || json?.detail || json?.message || ''
    const resetRequired = typeof detail === 'string' && detail.toLowerCase().includes('password reset required')

    if (resetRequired) {
      throw new Error(detail)
    }
  }

  if (res.status === 401 && auth && !_retry) {
    const refreshed = await refreshToken()
    if (refreshed) return request(method, path, { body, params, auth, _retry: true })
    clearTokens()
    throw new Error('Session expired')
  }

  if (res.status === 401) {
    clearTokens()
    throw new Error('Session expired')
  }

  const json = await readJson()
  if (!res.ok) throw new Error(json.detail || json.message || `Request failed (${res.status})`)
  return json
}

const get   = (path, opts) => request('GET',   `${BASE}${path}`, opts)
const post  = (path, opts) => request('POST',  `${BASE}${path}`, opts)
const patch = (path, opts) => request('PATCH', `${BASE}${path}`, opts)

/* ─── Auth ─── */
export async function loginUser(email, password) {
  const res = await post('/auth/login', { body: { email, password }, auth: false })
  if (res.success) setTokens(res.data.tokens)
  return res
}

export async function registerUser({ name, email, phone, password, role }) {
  const res = await post('/auth/register', { body: { name, email, phone, password, role }, auth: false })
  if (res.success) setTokens(res.data.tokens)
  return res
}

export async function logoutUser() {
  try { await post('/auth/logout') } catch { /* ignore */ }
  clearTokens()
}

export async function setFirstLoginPassword(newPassword) {
  const res = await post('/auth/set-password-first-login', { body: { new_password: newPassword } })
  return res
}

let _refreshPromise = null
async function refreshToken() {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    try {
      const { refresh_token } = getTokens()
      if (!refresh_token) return false
      const res = await post('/auth/refresh', { body: { refresh_token }, auth: false })
      if (res.success) { setTokens(res.data.tokens); return true }
    } catch { /* swallow */ }
    return false
  })()
  try { return await _refreshPromise } finally { _refreshPromise = null }
}

export async function fetchMe() {
  const res = await get('/users/me')
  return res.data
}

/* ─── Users ─── */
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

/* ─── Properties ─── */
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
    // Normalize backend → frontend shape
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

export async function fetchOwnerDashboard() {
  const cacheKey = buildApiCacheKey('owner:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/owner')
      return res?.data || { properties: [], workflows: [], earnings: null }
    }, { ttlMs: 30_000 })
  } catch {
    return null
  }
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
  invalidateApiCache(['properties:search', 'owner:properties:me', 'owner:dashboard', 'admin:stats', 'admin:dashboard'])
  return normalizeProperty(res.data)
}

function normalizeProperty(p) {
  if (!p) return null
  return {
    ...p,
    image: p.images?.[0] || '',
    chips: [p.bhk, `${p.sqft} sqft`, p.furnishing?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())].filter(Boolean),
    amenityIcons: (p.amenities || []).map(a => {
      const map = {
        parking: 'local_parking',
        pool: 'pool',
        gym: 'fitness_center',
        security: 'security',
        power_backup: 'bolt',
        playground: 'park',
        garden: 'yard',
        elevator: 'elevator',
        water: 'water_drop',
        cctv: 'videocam',
        internet: 'wifi',
        club_house: 'nightlife',
        jogging_track: 'directions_run',
        rainwater_harvesting: 'water',
        fire_safety: 'local_fire_department',
        intercom: 'phone_in_talk',
        maintenance: 'build',
        atm: 'atm',
        school: 'school',
        hospital: 'local_hospital',
        mall: 'storefront',
        metro: 'subway',
        bus_stop: 'directions_bus',
      }
      return map[a] || 'help_outline'
    }),
  }
}

/* ─── Payments ─── */
export async function fetchPayments(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.type) params.type = filters.type
  if (filters.page) params.page = filters.page
  const cacheKey = buildApiCacheKey('payments:list', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/payments', { params })
    return (res.data || []).map(normalizePayment)
  }, { ttlMs: 30_000 })
}

export async function fetchPaymentById(id) {
  const cacheKey = buildApiCacheKey('payments:detail', { id })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/payments/${id}`)
    return normalizePayment(res.data)
  }, { ttlMs: 30_000 })
}

export async function fetchOwnerEarnings() {
  const dashboard = await fetchOwnerDashboard()
  if (dashboard && dashboard.earnings) return dashboard.earnings

  const cacheKey = buildApiCacheKey('owner:earnings')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/payments/earnings')
    return res.data
  }, { ttlMs: 60_000 })
}

export async function fetchAdminDashboard() {
  const cacheKey = buildApiCacheKey('admin:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/admin')
      return res?.data || { stats: null, financials: null, recent_activity: [] }
    }, { ttlMs: 30_000 })
  } catch {
    return null
  }
}

export async function fetchAdminFinancials() {
  const dashboard = await fetchAdminDashboard()
  if (dashboard?.financials) return dashboard.financials
  return {
    escrowedFunds: 0,
    escrowedTrend: '0%',
    pendingInvoices: 0,
    pendingInvoiceCount: 0,
    pendingInvoiceTrend: '0%',
    rentSplits: [],
  }
}

export async function fetchAdminStats() {
  const dashboard = await fetchAdminDashboard()
  if (dashboard?.stats) return dashboard.stats
  return { user_count: 0, property_count: 0, pending_actions_count: 0 }
}

export async function fetchRecentActivity() {
  const dashboard = await fetchAdminDashboard()
  return dashboard?.recent_activity || []
}

function normalizePayment(p) {
  if (!p) return null
  return {
    ...p,
    propertyName: p.property_name || '',
    tenantId: p.tenant_id,
    ownerId: p.owner_id,
    providerId: p.provider_id,
    dueDate: p.due_date,
    paidDate: p.paid_date,
    referenceId: p.reference_id,
  }
}

/* ─── Jobs ─── */
export async function fetchJobs(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.property_id) params.property_id = filters.property_id
  const cacheKey = buildApiCacheKey('jobs:list', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/jobs', { params })
    return (res.data || []).map(normalizeJob)
  }, { ttlMs: 30_000 })
}

export async function fetchJobById(id) {
  const cacheKey = buildApiCacheKey('jobs:detail', { id })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/jobs/${id}`)
    return normalizeJob(res.data)
  }, { ttlMs: 30_000 })
}

// Map service type names → Material Symbols icon names
const SERVICE_ICON_MAP = {
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
    // Fallback: return hardcoded categories if backend doesn't have them
    return [
      { key: 'plumbing', icon: 'plumbing', label: 'Plumbing', startPrice: 500, emergency: true },
      { key: 'electrician', icon: 'electrical_services', label: 'Electrical', startPrice: 400 },
      { key: 'carpentry', icon: 'handyman', label: 'Carpentry', startPrice: 600 },
      { key: 'painting', icon: 'format_paint', label: 'Painting', startPrice: 1000 },
      { key: 'deep_cleaning', icon: 'cleaning_services', label: 'Deep Cleaning', startPrice: 800 },
      { key: 'pest_control', icon: 'pest_control', label: 'Pest Control', startPrice: 700 },
      { key: 'appliance_repair', icon: 'build', label: 'Appliance Repair', startPrice: 500 },
      { key: 'ac_hvac', icon: 'ac_unit', label: 'AC / HVAC', startPrice: 600 },
    ]
  }
}

export async function fetchProviderStats() {
  const dashboard = await fetchProviderDashboard()
  if (dashboard?.stats) return dashboard.stats

  const cacheKey = buildApiCacheKey('provider:stats')
  // Provider stats - derive from jobs
  try {
    return await fetchWithCache(cacheKey, async () => {
      const jobs = await fetchJobs()
      const activeJobs = jobs.filter(j => j.status === 'active').length
      const scheduledJobs = jobs.filter(j => j.status === 'scheduled').length
      const completed = jobs.filter(j => j.status === 'completed')
      const completedJobs = completed.length
      const total = completed.reduce((s, j) => s + (j.actualCost || 0), 0)
      return {
        activeJobs,
        scheduledJobs,
        completedJobs,
        nextPayoutAmount: total * 0.1,
        nextPayoutDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        weeklyTarget: 75,
        earningsThisWeek: total * 0.3,
        earningsThisMonth: total * 0.6,
        earningsLifetime: total,
        weeklyBreakdown: [
          { day: 'Mon', amount: 0 }, { day: 'Tue', amount: 0 },
          { day: 'Wed', amount: 0 }, { day: 'Thu', amount: 0 },
          { day: 'Fri', amount: 0 }, { day: 'Sat', amount: 0 }, { day: 'Sun', amount: 0 },
        ],
      }
    }, { ttlMs: 30_000 })
  } catch {
    return {
      activeJobs: 0,
      scheduledJobs: 0,
      completedJobs: 0,
      nextPayoutAmount: 0,
      weeklyTarget: 0,
      earningsThisWeek: 0,
      earningsThisMonth: 0,
      earningsLifetime: 0,
      weeklyBreakdown: [],
    }
  }
}

export async function fetchProviderDashboard() {
  const cacheKey = buildApiCacheKey('provider:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/provider')
      return res?.data || { jobs: [], stats: null }
    }, { ttlMs: 30_000 })
  } catch {
    return null
  }
}

export async function createJob(data) {
  const res = await post('/jobs', { body: data })
  invalidateApiCache(['jobs:list', 'provider:stats', 'provider:dashboard'])
  return normalizeJob(res.data)
}

function normalizeJob(j) {
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

/* ─── Inspections ─── */
export async function fetchInspections() {
  const res = await get('/inspections')
  return res.data || []
}

export async function fetchInspectionById(id) {
  const res = await get(`/inspections/${id}`)
  return res.data
}

export async function fetchInspectionStats() {
  try {
    const res = await get('/inspections/stats')
    return res.data
  } catch { return { total: 0, completed: 0, avg_score: 0 } }
}

/* ─── Notifications ─── */
export async function fetchNotifications() {
  const cacheKey = buildApiCacheKey('notifications:list')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/notifications')
    return (res.data || []).map(n => ({
      ...n,
      timestamp: n.created_at ? formatTimeAgo(n.created_at) : '',
      iconBg: n.type === 'payment' ? 'rgba(19,200,236,0.15)' : 'rgba(212,168,67,0.15)',
      iconColor: n.type === 'payment' ? '#13C8EC' : '#D4A843',
      actionLabel: n.action_label,
      actionTarget: n.action_target,
    }))
  }, { ttlMs: 30_000 })
}

export async function markNotificationRead(id) {
  await patch(`/notifications/${id}/read`)
  invalidateApiCache(['notifications:list', 'admin:recent-activity', 'admin:dashboard'])
  return true
}

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/* ─── Agreements ─── */

export async function verifyDeposit(agreementId, paymentData) {
  const res = await post(`/agreements/${agreementId}/verify-deposit`, {
    body: paymentData,
  })
  return res.data
}

export async function signAgreement(agreementId, signature) {
  const res = await post(`/agreements/${agreementId}/sign`, {
    body: { signature },
  })
  return res
}

export async function fetchAgreementById(agreementId) {
  const res = await get(`/agreements/${agreementId}`)
  return res.data
}

export async function fetchAgreements(params = {}) {
  const res = await get('/agreements', { params })
  return res.data || []
}

/* ─── File Uploads ─── */
export async function uploadImage(file, folder = 'images') {
  const formData = new FormData()
  formData.append('file', file)

  const { access_token } = getTokens()
  const headers = {}
  if (access_token) headers['Authorization'] = `Bearer ${access_token}`

  const res = await fetch(`${BASE}/uploads/image?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.detail || json.message || `Upload failed (${res.status})`)
  }

  const json = await res.json()
  return json.data?.url || json.url
}

export async function uploadDocument(file, folder = 'documents') {
  const formData = new FormData()
  formData.append('file', file)

  const { access_token } = getTokens()
  const headers = {}
  if (access_token) headers['Authorization'] = `Bearer ${access_token}`

  const res = await fetch(`${BASE}/uploads/document?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.detail || json.message || `Upload failed (${res.status})`)
  }

  const json = await res.json()
  return json.data?.url || json.url
}

/* ─── Re-exports ─── */
export function formatRent(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L/mo`
  return `₹${amount?.toLocaleString('en-IN')}/mo`
}

/* ─── Admin Calendar ─── */
export async function createCalendarSlots(slots) {
  const res = await post('/calendar/slots', { body: { slots } })
  invalidateApiCache(['calendar:slots', 'calendar:my-visits', 'owner:dashboard'])
  return res
}

export async function fetchCalendarSlots(params = {}) {
  const cacheKey = buildApiCacheKey('calendar:slots', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/calendar/slots', { params })
    return res?.data || []
  }, { ttlMs: 30_000 })
}

export async function createCalendarBlock(payload) {
  const res = await post('/calendar/blocks', { body: payload })
  invalidateApiCache(['calendar:blocks'])
  return res
}

export async function fetchCalendarBlocks(params = {}) {
  const cacheKey = buildApiCacheKey('calendar:blocks', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/calendar/blocks', { params })
    return res?.data || []
  }, { ttlMs: 30_000 })
}

export async function deleteCalendarBlock(blockId) {
  const res = await request('DELETE', `${BASE}/calendar/blocks/${blockId}`)
  invalidateApiCache(['calendar:blocks'])
  return res
}

export async function bookVisitSlot(slotId, propertyId) {
  const res = await post(`/calendar/slots/${slotId}/book`, { body: { property_id: propertyId } })
  invalidateApiCache(['calendar:slots', 'calendar:my-visits', 'onboarding:workflows', 'owner:dashboard'])
  return res
}

export async function cancelVisitBooking(slotId) {
  const res = await post(`/calendar/slots/${slotId}/cancel`)
  invalidateApiCache(['calendar:slots', 'calendar:my-visits', 'onboarding:workflows', 'owner:dashboard'])
  return res
}

export async function completeVisit(slotId, { approve, notes, rejection_reason }) {
  const res = await post(`/calendar/slots/${slotId}/complete`, {
    body: { approve, notes, rejection_reason },
  })
  invalidateApiCache(['calendar:slots', 'calendar:my-visits', 'onboarding:workflows', 'owner:dashboard'])
  return res
}

export async function deleteCalendarSlot(slotId) {
  const res = await request('DELETE', `${BASE}/calendar/slots/${slotId}`)
  invalidateApiCache(['calendar:slots', 'calendar:my-visits'])
  return res
}

export async function fetchMyVisits() {
  const cacheKey = buildApiCacheKey('calendar:my-visits')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/calendar/my-visits')
    return res?.data || []
  }, { ttlMs: 30_000 })
}

/* ─── Onboarding Workflows ─── */
export async function fetchOnboardingWorkflows(params = {}) {
  const cacheKey = buildApiCacheKey('onboarding:workflows', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/onboarding-workflows', { params })
    return res?.data || []
  }, { ttlMs: 30_000 })
}

export async function submitPoliceVerification(workflowId, documentUrl) {
  const res = await post(`/onboarding-workflows/${workflowId}/police-verification/submit`, {
    body: { document_url: documentUrl },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function reviewPoliceVerification(workflowId, { approve, rejection_reason }) {
  const res = await post(`/onboarding-workflows/${workflowId}/police-verification/review`, {
    body: { approve, rejection_reason },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function submitOriginalAgreement(workflowId, documentUrl) {
  const res = await post(`/onboarding-workflows/${workflowId}/original-agreement/submit`, {
    body: { document_url: documentUrl },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function reviewOriginalAgreement(workflowId, { approve, rejection_reason }) {
  const res = await post(`/onboarding-workflows/${workflowId}/original-agreement/review`, {
    body: { approve, rejection_reason },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

/* ─── Payments (Admin Offline) ─── */
export async function uploadPaymentReceipt(paymentId, screenshotUrl) {
  const res = await post(`/payments/${paymentId}/upload-receipt`, {
    body: { screenshot_url: screenshotUrl },
  })
  invalidateApiCache(['payments:list', 'payments:detail', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}

export async function verifyPayment(paymentId, { approve, notes, rejection_reason }) {
  const res = await post(`/payments/${paymentId}/verify`, {
    body: { approve, notes, rejection_reason },
  })
  invalidateApiCache(['payments:list', 'payments:detail', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}

export async function markPaymentPaid(paymentId, notes) {
  const res = await post(`/payments/${paymentId}/mark-paid`, {
    body: { notes },
  })
  invalidateApiCache(['payments:list', 'payments:detail', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}

export async function fetchPendingVerifications(params = {}) {
  const cacheKey = buildApiCacheKey('payments:pending-verifications', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/payments/pending-verifications', { params })
    return res?.data || []
  }, { ttlMs: 30_000 })
}

/* ─── Agreements (Admin Driven) ─── */
export async function adminConfirmAdvance(agreementId, notes) {
  const res = await post(`/agreements/${agreementId}/confirm-advance`, {
    body: { notes },
  })
  invalidateApiCache(['onboarding:workflows', 'properties:search', 'owner:properties:me', 'tenant:properties:me', 'owner:dashboard'])
  return res
}

export async function generateMonthlyRent() {
  const res = await post('/payments/generate-rent')
  invalidateApiCache(['payments:list', 'payments:pending-verifications', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}
