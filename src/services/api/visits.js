/**
 * Visit-request API client (v2.2 negotiation flow).
 *
 * Endpoints:
 *   POST /visit-requests                       create (tenant)
 *   POST /visit-requests/:id/propose           counter-propose (any party)
 *   POST /visit-requests/:id/accept            accept current proposal
 *   POST /visit-requests/:id/reject            reject + close
 *   POST /visit-requests/:id/reschedule        re-open a CONFIRMED visit
 *   POST /visit-requests/:id/cancel            cancel an in-flight visit
 *   POST /visit-requests/:id/complete          manager marks done + approve/reject
 *   GET  /visit-requests/:id                   one + proposal history
 *   GET  /visit-requests                       list (scoped by role)
 */
import { get, post, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

const VISIT_CACHE_KEYS = [
  'visit-requests:list',
  'visit-requests:mine',
  'visit-requests:one',
  'onboarding:workflows',
  'owner:dashboard',
]

/* ── Tenant ──────────────────────────────────────────────────────────────── */

/**
 * Create a visit request with the tenant's first proposed slot.
 * @param {{ property_id: string, requested_date: string, start_time: string, end_time: string, message?: string }} payload
 */
export async function createVisitRequest(payload) {
  const res = await post('/visit-requests', { body: payload })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/** List visits for the current user (scoped by role on the server). */
export async function fetchMyVisits(params = {}) {
  const cacheKey = buildApiCacheKey('visit-requests:mine', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/visit-requests', { params })
    return res?.data || res?.items || []
  }, { ttlMs: 30_000 })
}

/** Fetch one visit request with its full proposal history. */
export async function fetchVisitRequest(id) {
  const res = await get(`/visit-requests/${id}`)
  return res?.data || res
}

/* ── Negotiation actions (any party with permission) ────────────────────── */

/** Counter-propose a different date/time. */
export async function proposeVisitTime(id, { proposed_date, start_time, end_time, message } = {}) {
  const res = await post(`/visit-requests/${id}/propose`, {
    body: { proposed_date, start_time, end_time, message: message || null },
  })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/** Accept the current open proposal — visit becomes CONFIRMED. */
export async function acceptVisitProposal(id) {
  const res = await post(`/visit-requests/${id}/accept`, { body: {} })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/** Reject the current open proposal (closes the request). */
export async function rejectVisitProposal(id, { reason }) {
  if (!reason) throw new Error('reason is required to reject a proposal')
  const res = await post(`/visit-requests/${id}/reject`, { body: { reason } })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/** Reschedule a CONFIRMED visit — re-opens negotiation. */
export async function rescheduleVisit(id, { proposed_date, start_time, end_time, message } = {}) {
  const res = await post(`/visit-requests/${id}/reschedule`, {
    body: { proposed_date, start_time, end_time, message: message || null },
  })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/* ── Manager / Super-Admin lifecycle ────────────────────────────────────── */

/** List visit requests visible to the current user (scoped by role on the server). */
export async function fetchVisitRequests(params = {}) {
  const cacheKey = buildApiCacheKey('visit-requests:list', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/visit-requests', { params })
    return res?.data || res?.items || []
  }, { ttlMs: 30_000 })
}

/** Manager approves the tenant after the visit happened. */
export async function approveVisit(id, { notes } = {}) {
  const res = await post(`/visit-requests/${id}/complete`, {
    body: { approve: true, notes: notes || null },
  })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/** Manager rejects the tenant after the visit happened. */
export async function rejectVisit(id, { rejection_reason, notes } = {}) {
  if (!rejection_reason) throw new Error('rejection_reason is required to reject a visit.')
  const res = await post(`/visit-requests/${id}/complete`, {
    body: { approve: false, rejection_reason, notes: notes || null },
  })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/* ── Shared ──────────────────────────────────────────────────────────────── */

/** Cancel an in-flight visit (tenant, manager, or SA per scope). */
export async function cancelVisit(id, { reason } = {}) {
  const res = await post(`/visit-requests/${id}/cancel`, {
    body: { reason: reason || null },
  })
  invalidateApiCache(VISIT_CACHE_KEYS)
  return res?.data || res
}

/* ── Legacy aliases (kept to avoid breaking existing imports) ───────────── */

/** @deprecated — slot publishing is gone in v2.2 */
export const fetchCalendarSlots = (params = {}) => fetchVisitRequests(params)

/** @deprecated — use {@link createVisitRequest} */
export const bookVisitSlot = (_slotId, propertyId) =>
  createVisitRequest({ property_id: propertyId })

/** @deprecated — use {@link cancelVisit} */
export const cancelVisitBooking = (id) => cancelVisit(id)

/** @deprecated split into approveVisit / rejectVisit */
export const completeVisit = (id, { approve, notes, rejection_reason } = {}) =>
  approve
    ? approveVisit(id, { notes })
    : rejectVisit(id, { rejection_reason, notes })

/** @deprecated — manager schedule path superseded by accept/reschedule */
export async function scheduleVisit(id, payload) {
  // For backward compatibility: treat the old "schedule" as an SA/manager
  // proposing the given slot (a counter-proposal/reschedule).
  return proposeVisitTime(id, {
    proposed_date: payload.scheduled_date,
    start_time: payload.start_time,
    end_time: payload.end_time,
  })
}
