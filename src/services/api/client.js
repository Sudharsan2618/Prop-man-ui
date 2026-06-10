/**
 * client.js — Low-level HTTP + token + cache primitives.
 *
 * Every domain module (auth.js, properties.js, …) imports get/post/patch
 * from here. Nothing else should call `fetch` directly.
 *
 * Surface:
 *   - getTokens / setTokens / clearTokens
 *   - get / post / patch / request
 *   - buildApiCacheKey / fetchWithCache / invalidateApiCache
 */

export const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

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
  try { return JSON.parse(raw) } catch { return null }
}

function readCacheEntry(cacheKey) {
  const key = scopedCacheKey(cacheKey)
  const memoryHit = apiMemoryCache.get(key)
  if (memoryHit) {
    return { value: memoryHit.value, isFresh: memoryHit.expiresAt > Date.now() }
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
  return { value: normalized.value, isFresh: normalized.expiresAt > Date.now() }
}

function writeCacheEntry(cacheKey, value, ttlMs) {
  const key = scopedCacheKey(cacheKey)
  const entry = { value, cachedAt: Date.now(), expiresAt: Date.now() + ttlMs }
  apiMemoryCache.set(key, entry)
  try { localStorage.setItem(key, JSON.stringify(entry)) } catch { /* ignore quota */ }
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
    lsKeys.forEach((key) => { if (shouldDelete(key)) localStorage.removeItem(key) })
  } catch { /* ignore */ }
}

function clearApiCache() {
  invalidateApiCache()
}

export async function fetchWithCache(cacheKey, fetcher, { ttlMs = 60_000, allowStale = true, revalidateStale = true } = {}) {
  const cached = readCacheEntry(cacheKey)
  if (cached?.isFresh) return cached.value

  const sharedReqKey = scopedCacheKey(`inflight:${cacheKey}`)
  const inFlight = inFlightCacheRequests.get(sharedReqKey)

  if (cached?.value !== undefined && allowStale) {
    if (!inFlight && revalidateStale) {
      const revalidatePromise = fetcher()
        .then((fresh) => { writeCacheEntry(cacheKey, fresh, ttlMs); return fresh })
        .finally(() => inFlightCacheRequests.delete(sharedReqKey))
      inFlightCacheRequests.set(sharedReqKey, revalidatePromise)
    }
    return cached.value
  }

  if (inFlight) return inFlight

  const networkPromise = fetcher()
    .then((fresh) => { writeCacheEntry(cacheKey, fresh, ttlMs); return fresh })
    .finally(() => inFlightCacheRequests.delete(sharedReqKey))

  inFlightCacheRequests.set(sharedReqKey, networkPromise)
  return networkPromise
}

/* ─── Token refresh (used by request retry) ─── */
let _refreshPromise = null
export async function refreshToken() {
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

/* ─── Core fetch wrapper ─── */
export async function request(method, path, { body, params, auth = true, _retry = false, _networkRetried = false } = {}) {
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
    // Dev-only loopback fallback (127.0.0.1 ↔ localhost). Never runs in prod.
    if (import.meta.env.DEV && !_networkRetried) {
      let fallbackPath = null
      if (path.startsWith('http://127.0.0.1:8000')) {
        fallbackPath = path.replace('http://127.0.0.1:8000', 'http://localhost:8000')
      } else if (path.startsWith('http://localhost:8000')) {
        fallbackPath = path.replace('http://localhost:8000', 'http://127.0.0.1:8000')
      } else if (path.startsWith('/api/')) {
        fallbackPath = `http://127.0.0.1:8000${path}`
      }
      if (fallbackPath) {
        return request(method, fallbackPath, { body, params, auth, _retry, _networkRetried: true })
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
    if (resetRequired) throw new Error(detail)
  }

  if (res.status === 401 && auth && !_retry) {
    const refreshed = await refreshToken()
    if (refreshed) return request(method, path, { body, params, auth, _retry: true })
    clearTokens()
    throw new Error('Session expired')
  }

  if (res.status === 401 && auth) {
    clearTokens()
    throw new Error('Session expired')
  }

  const json = await readJson()
  if (!res.ok) {
    const serverMessage = json?.error?.message || json?.detail || json?.message
    throw new Error(serverMessage || `Request failed (${res.status})`)
  }
  return json
}

export const get = (path, opts) => request('GET', `${BASE}${path}`, opts)
export const post = (path, opts) => request('POST', `${BASE}${path}`, opts)
export const patch = (path, opts) => request('PATCH', `${BASE}${path}`, opts)
