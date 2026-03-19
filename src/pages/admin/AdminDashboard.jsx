import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
} from '../../components'
import { fetchAdminDashboard } from '../../services/api'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('home')
  const [financials, setFinancials] = useState(null)
  const [stats, setStats] = useState({ user_count: 0, property_count: 0, pending_actions_count: 0 })
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchAdminDashboard().then((payload) => {
      setFinancials(payload?.financials || null)
      setStats(payload?.stats || { user_count: 0, property_count: 0, pending_actions_count: 0 })
      setActivities(payload?.recent_activity || [])
    }).catch(() => {})
  }, [])

  const onTabChange = (tab) => {
    setActiveTab(tab)
    handleTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Admin Console"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav role="admin" activeTab={activeTab} onTabChange={onTabChange} />
      }
    >
      <div className="adm stagger-children">
        {/* ── Welcome ── */}
        <div className="adm__welcome animate-slide-down">
          <h1 className="adm__welcome-title">Welcome Back</h1>
          <p className="adm__welcome-sub">Platform administration overview</p>
          <div className="adm__role-pill">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shield</span>
            Platform Admin
          </div>
        </div>

        {/* ── Stats Overview ── */}
        <div className="adm__stats-grid">
          <GlassCard className="adm__stat-card">
            <span className="material-symbols-outlined adm__stat-icon" style={{ color: 'var(--primary)' }}>group</span>
            <p className="adm__stat-value">{stats.user_count?.toLocaleString('en-IN') || 0}</p>
            <p className="adm__stat-label">Total Users</p>
          </GlassCard>
          <GlassCard className="adm__stat-card">
            <span className="material-symbols-outlined adm__stat-icon" style={{ color: 'var(--accent)' }}>location_city</span>
            <p className="adm__stat-value">{stats.property_count?.toLocaleString('en-IN') || 0}</p>
            <p className="adm__stat-label">Properties</p>
          </GlassCard>
          <GlassCard className="adm__stat-card">
            <span className="material-symbols-outlined adm__stat-icon" style={{ color: 'var(--status-warning)' }}>pending_actions</span>
            <p className="adm__stat-value">{stats.pending_actions_count?.toLocaleString('en-IN') || 0}</p>
            <p className="adm__stat-label">Pending Actions</p>
          </GlassCard>
        </div>

        {/* ── Financial Summary ── */}
        {financials && (
          <GlassCard className="adm__finance-card animate-slide-up">
            <div className="adm__finance-header">
              <div className="adm__finance-heading">
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--accent)' }}>account_balance_wallet</span>
                <h2 className="adm__finance-title">Financial Summary</h2>
              </div>
              <button className="adm__view-link" onClick={() => navigate('/admin-finance')}>Details →</button>
            </div>
            <div className="adm__finance-grid">
              <div className="adm__finance-item">
                <p className="adm__finance-label">Escrowed Funds</p>
                <p className="adm__finance-value">₹{(financials.escrowedFunds / 100).toLocaleString('en-IN')}</p>
              </div>
              <div className="adm__finance-item">
                <p className="adm__finance-label">Pending Invoices</p>
                <p className="adm__finance-value" style={{ color: 'var(--status-warning)' }}>₹{(financials.pendingInvoices / 100).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── Recent Activity ── */}
        <div>
          <h2 className="section-heading">Recent Activity</h2>
          <div className="adm__activity-list">
            {activities.length === 0 ? (
              <GlassCard className="adm__activity-card">
                <div className="adm__activity-row">
                  <div className="adm__activity-icon" style={{ background: 'rgba(148,163,184,0.15)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>history</span>
                  </div>
                  <div className="adm__activity-info">
                    <p className="adm__activity-label">No recent activity</p>
                    <p className="adm__activity-detail">Recent admin events will appear here.</p>
                  </div>
                </div>
              </GlassCard>
            ) : activities.map((a, i) => (
              <GlassCard key={a.id || i} className="adm__activity-card">
                <div className="adm__activity-row">
                  <div className="adm__activity-icon" style={{ background: a.iconBg || 'rgba(27,42,74,0.1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: a.iconColor || 'var(--primary)' }}>{a.icon || 'notifications'}</span>
                  </div>
                  <div className="adm__activity-info">
                    <p className="adm__activity-label">{a.title || 'Activity'}</p>
                    <p className="adm__activity-detail">{a.subtitle || '—'}</p>
                  </div>
                  <span className="adm__activity-time">{a.timestamp || ''}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Quick Action Cards ── */}
        <div className="adm__action-grid">
          <GlassCard interactive className="adm__action-card" onClick={() => navigate('/admin-payments')}>
            <span className="material-symbols-outlined adm__action-icon" style={{ color: 'var(--primary)' }}>payments</span>
            <span className="adm__action-label">Payments</span>
          </GlassCard>
          <GlassCard interactive className="adm__action-card" onClick={() => navigate('/admin-calendar')}>
            <span className="material-symbols-outlined adm__action-icon" style={{ color: 'var(--accent)' }}>calendar_month</span>
            <span className="adm__action-label">Calendar</span>
          </GlassCard>
          <GlassCard interactive className="adm__action-card" onClick={() => navigate('/admin-onboarding')}>
            <span className="material-symbols-outlined adm__action-icon" style={{ color: 'var(--status-success)' }}>checklist</span>
            <span className="adm__action-label">Onboarding</span>
          </GlassCard>
          <GlassCard interactive className="adm__action-card" onClick={() => navigate('/admin-users')}>
            <span className="material-symbols-outlined adm__action-icon">manage_accounts</span>
            <span className="adm__action-label">Users</span>
          </GlassCard>
          <GlassCard interactive className="adm__action-card" onClick={() => navigate('/admin-properties')}>
            <span className="material-symbols-outlined adm__action-icon">real_estate_agent</span>
            <span className="adm__action-label">Properties</span>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
