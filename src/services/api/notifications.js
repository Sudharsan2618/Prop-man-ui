import { get, patch, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

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
  }, { ttlMs: 120_000 })
}

export async function markNotificationRead(id) {
  await patch(`/notifications/${id}/read`)
  invalidateApiCache(['notifications:list', 'admin:recent-activity', 'admin:dashboard'])
  return true
}
