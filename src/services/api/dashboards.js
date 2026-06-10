import { get, buildApiCacheKey, fetchWithCache } from './client'
import { fetchJobs } from './jobs'

export async function fetchOwnerDashboard() {
  const cacheKey = buildApiCacheKey('owner:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/owner')
      return res?.data || { properties: [], workflows: [], earnings: null }
    }, { ttlMs: 120_000 })
  } catch { return null }
}

export async function fetchAdminDashboard() {
  const cacheKey = buildApiCacheKey('admin:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/admin')
      return res?.data || { stats: null, financials: null, recent_activity: [] }
    }, { ttlMs: 180_000 })
  } catch { return null }
}

export async function fetchAdminFinancials() {
  const dashboard = await fetchAdminDashboard()
  if (dashboard?.financials) return dashboard.financials
  return {
    escrowedFunds: 0, escrowedTrend: '0%',
    pendingInvoices: 0, pendingInvoiceCount: 0, pendingInvoiceTrend: '0%',
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

export async function fetchSuperAdminDashboard() {
  const cacheKey = buildApiCacheKey('sa:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/super-admin')
      return res?.data || { stats: null, recent_activity: [], quick_actions: [] }
    }, { ttlMs: 120_000 })
  } catch { return null }
}

export async function fetchProviderDashboard() {
  const cacheKey = buildApiCacheKey('provider:dashboard')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const res = await get('/dashboard/provider')
      return res?.data || { jobs: [], stats: null }
    }, { ttlMs: 120_000 })
  } catch { return null }
}

export async function fetchProviderStats() {
  const dashboard = await fetchProviderDashboard()
  if (dashboard?.stats) return dashboard.stats

  const cacheKey = buildApiCacheKey('provider:stats')
  try {
    return await fetchWithCache(cacheKey, async () => {
      const jobs = await fetchJobs()
      const activeJobs = jobs.filter(j => j.status === 'active').length
      const scheduledJobs = jobs.filter(j => j.status === 'scheduled').length
      const completed = jobs.filter(j => j.status === 'completed')
      const completedJobs = completed.length
      const total = completed.reduce((s, j) => s + (j.actualCost || 0), 0)
      return {
        activeJobs, scheduledJobs, completedJobs,
        nextPayoutAmount: total * 0.1,
        nextPayoutDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        weeklyTarget: 75,
        earningsThisWeek: total * 0.3,
        earningsThisMonth: total * 0.6,
        earningsLifetime: total,
        weeklyBreakdown: [
          { day: 'Mon', amount: 0 }, { day: 'Tue', amount: 0 }, { day: 'Wed', amount: 0 },
          { day: 'Thu', amount: 0 }, { day: 'Fri', amount: 0 }, { day: 'Sat', amount: 0 }, { day: 'Sun', amount: 0 },
        ],
      }
    }, { ttlMs: 120_000 })
  } catch {
    return {
      activeJobs: 0, scheduledJobs: 0, completedJobs: 0,
      nextPayoutAmount: 0, weeklyTarget: 0,
      earningsThisWeek: 0, earningsThisMonth: 0, earningsLifetime: 0,
      weeklyBreakdown: [],
    }
  }
}
