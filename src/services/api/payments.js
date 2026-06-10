import { get, post, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

export function normalizePayment(p) {
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

export async function fetchPayments(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.type) params.type = filters.type
  if (filters.page) params.page = filters.page
  const cacheKey = buildApiCacheKey('payments:list', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/payments', { params })
    return (res.data || []).map(normalizePayment)
  }, { ttlMs: 60_000 })
}

export async function fetchPaymentById(id) {
  const cacheKey = buildApiCacheKey('payments:detail', { id })
  return fetchWithCache(cacheKey, async () => {
    const res = await get(`/payments/${id}`)
    return normalizePayment(res.data)
  }, { ttlMs: 60_000 })
}

export async function fetchOwnerEarnings() {
  const { fetchOwnerDashboard } = await import('./dashboards')
  const dashboard = await fetchOwnerDashboard()
  if (dashboard && dashboard.earnings) return dashboard.earnings

  const cacheKey = buildApiCacheKey('owner:earnings')
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/payments/earnings')
    return res.data
  }, { ttlMs: 60_000 })
}

export async function uploadPaymentReceipt(paymentId, screenshotUrl) {
  const res = await post(`/payments/${paymentId}/upload-receipt`, { body: { screenshot_url: screenshotUrl } })
  invalidateApiCache(['payments:list', 'payments:detail', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}

export async function verifyPayment(paymentId, { approve, notes, rejection_reason }) {
  const res = await post(`/payments/${paymentId}/verify`, { body: { approve, notes, rejection_reason } })
  invalidateApiCache(['payments:list', 'payments:detail', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}

export async function markPaymentPaid(paymentId, notes) {
  const res = await post(`/payments/${paymentId}/mark-paid`, { body: { notes } })
  invalidateApiCache(['payments:list', 'payments:detail', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}

export async function fetchPendingVerifications(params = {}) {
  const cacheKey = buildApiCacheKey('payments:pending-verifications', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/payments/pending-verifications', { params })
    return res?.data || []
  }, { ttlMs: 120_000 })
}

export async function generateMonthlyRent() {
  const res = await post('/payments/generate-rent')
  invalidateApiCache(['payments:list', 'payments:pending-verifications', 'admin:recent-activity', 'admin:dashboard', 'owner:dashboard'])
  return res
}
