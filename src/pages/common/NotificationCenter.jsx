import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, PrimaryButton, FilterChips,
  Skeleton,
} from '../../components'
import { fetchNotifications } from '../../services/api'
import './NotificationCenter.css'

const TYPE_ICONS = {
  payment: { icon: 'currency_rupee', bg: 'rgba(212, 168, 67, 0.12)', color: 'var(--primary)' },
  payment_receipt: { icon: 'receipt_long', bg: 'rgba(212, 168, 67, 0.12)', color: 'var(--primary)' },
  maintenance: { icon: 'build', bg: 'rgba(212,168,67,0.15)', color: '#D4A843' },
  inspection: { icon: 'fact_check', bg: 'rgba(212, 168, 67, 0.12)', color: 'var(--primary)' },
  agreement_generated: { icon: 'description', bg: 'rgba(19, 200, 236, 0.12)', color: 'var(--primary)' },
  visit_booked: { icon: 'event', bg: 'rgba(19, 200, 236, 0.12)', color: 'var(--primary)' },
  visit_cancelled: { icon: 'event_busy', bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--status-danger)' },
  system: { icon: 'settings', bg: 'rgba(27, 42, 74, 0.06)', color: 'var(--text-tertiary)' },
}

function getNotifRoute(notif) {
  const d = notif.data || {}
  if (d.agreement_id) return `/agreement/${d.agreement_id}`
  if (d.payment_id) return '/payments'
  if (d.property_id) return `/property/${d.property_id}`
  if (notif.action_target) return notif.action_target
  return null
}

const FILTERS = ['All', 'Payments', 'Maintenance', 'Inspections']

export default function NotificationCenter() {
  const { role } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('alerts')
  const [filter, setFilter] = useState('All')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications().then((data) => { setNotifications(data); setLoading(false) })
  }, [])

  const filtered = filter === 'All' ? notifications : notifications.filter((n) => {
    if (filter === 'Payments') return n.type === 'payment'
    if (filter === 'Maintenance') return n.type === 'maintenance'
    if (filter === 'Inspections') return n.type === 'inspection'
    return true
  })

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <div className="nc__header">
          <h1 className="nc__title">Notifications</h1>
          <button className="nc__mark-all">Mark all as read</button>
        </div>
      }
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="nc stagger-children">
        <FilterChips
          chips={FILTERS}
          activeChip={filter}
          onChipClick={setFilter}
        />

        <div className="nc__list">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} height="100px" radius="var(--radius-xl)" />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)', display: 'block', marginBottom: 'var(--space-2)' }}>notifications_off</span>
              No notifications
            </div>
          ) : (
            filtered.map((notif) => {
              const typeInfo = TYPE_ICONS[notif.type] || TYPE_ICONS.system
              const route = getNotifRoute(notif)
              return (
                <GlassCard
                  key={notif.id}
                  interactive={!!route}
                  className={`nc__card animate-slide-up ${notif.unread ? 'nc__card--unread' : ''}`}
                  onClick={route ? () => navigate(route) : undefined}
                  style={route ? { cursor: 'pointer' } : undefined}
                >
                  <div className="nc__card-row">
                    <div className="nc__icon" style={{ background: typeInfo.bg }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: typeInfo.color }}>{typeInfo.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontWeight: notif.unread ? 'var(--fw-bold)' : 'var(--fw-medium)', fontSize: 'var(--fs-body)' }}>{notif.title}</p>
                        <span className="nc__time">{notif.timeAgo || '2h ago'}</span>
                      </div>
                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>{notif.body}</p>
                      {route && (
                        <p style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px', fontWeight: 'var(--fw-medium)' }}>
                          Tap to view →
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              )
            })
          )}
        </div>
      </div>
    </PageShell>
  )
}
