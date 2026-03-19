import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  CountdownTimer, Skeleton,
} from '../../components'
import { fetchJobs, fetchProviderDashboard, fetchProviderStats } from '../../services/api'
import './ProviderDashboard.css'

export default function ProviderDashboard() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('home')
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviderDashboard().then((payload) => {
      setJobs(payload?.jobs || [])
      setStats(payload?.stats || null)
      setLoading(false)
    }).catch(() => {
      Promise.all([fetchJobs(), fetchProviderStats()]).then(([j, s]) => {
        setJobs(j)
        setStats(s)
        setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [])

  const activeJobs = jobs.filter((j) => j.status === 'active')
  const scheduledJobs = jobs.filter((j) => j.status === 'scheduled')

  const onTabChange = (tab) => {
    setActiveTab(tab)
    handleTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle={`Hello, ${user?.name?.split(' ')[0] || ''}`}
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav role="provider" activeTab={activeTab} onTabChange={onTabChange} badges={{ messages: 2 }} />
      }
    >
      <div className="pd-home stagger-children">
        {/* ── Welcome ── */}
        <div className="pdh__welcome animate-slide-down">
          <h1 className="pdh__welcome-title">Welcome Back</h1>
          <p className="pdh__welcome-sub">Manage your service jobs & earnings</p>
          <div className="pdh__status-pill">
            <span className="pdh__status-dot" />
            Available for Jobs
          </div>
        </div>

        {/* ── Payout Card ── */}
        {stats && (
          <GlassCard className="pdh__payout-card animate-slide-up">
            <div className="pdh__payout-top">
              <div className="pdh__payout-heading">
                <span className="material-symbols-outlined pdh__payout-icon">account_balance_wallet</span>
                <h2 className="pdh__payout-title">Next Payout</h2>
              </div>
              <StatusBadge status="pending" />
            </div>

            <p className="pdh__payout-label">Amount</p>
            <p className="pdh__payout-amount">₹{stats.nextPayoutAmount.toLocaleString('en-IN')}</p>

            <div className="pdh__payout-row">
              <span className="pdh__payout-label">Payout In</span>
              <CountdownTimer targetDate={stats.nextPayoutDate} />
            </div>

            <button className="pdh__payout-btn" onClick={() => navigate('/provider-earnings')}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
              View Earnings Ledger
            </button>
          </GlassCard>
        )}

        {/* ── Stats Row ── */}
        {stats && (
          <div className="pdh__stats-grid">
            <GlassCard className="pdh__stat-card">
              <span className="material-symbols-outlined pdh__stat-icon" style={{ color: 'var(--primary)' }}>work</span>
              <p className="pdh__stat-value">{stats.activeJobs}</p>
              <p className="pdh__stat-label">Active</p>
            </GlassCard>
            <GlassCard className="pdh__stat-card">
              <span className="material-symbols-outlined pdh__stat-icon" style={{ color: 'var(--accent)' }}>schedule</span>
              <p className="pdh__stat-value">{stats.scheduledJobs}</p>
              <p className="pdh__stat-label">Scheduled</p>
            </GlassCard>
            <GlassCard className="pdh__stat-card">
              <span className="material-symbols-outlined pdh__stat-icon" style={{ color: 'var(--status-success)' }}>check_circle</span>
              <p className="pdh__stat-value">{stats.completedJobs}</p>
              <p className="pdh__stat-label">Completed</p>
            </GlassCard>
          </div>
        )}

        {/* ── Upcoming Jobs ── */}
        <div>
          <div className="section-heading-row">
            <h2 className="section-heading">Upcoming Jobs</h2>
            <button className="section-link" onClick={() => navigate('/jobs')}>View All →</button>
          </div>
          <div className="pdh__job-list">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} height="90px" radius="var(--radius-xl)" />)
            ) : scheduledJobs.length === 0 ? (
              <GlassCard>
                <div className="pdh__empty">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>event_available</span>
                  <p>No upcoming jobs</p>
                </div>
              </GlassCard>
            ) : (
              scheduledJobs.slice(0, 3).map((job) => (
                <GlassCard key={job.id} interactive className="pdh__job-card" onClick={() => navigate(`/work-report/${job.id}`)}>
                  <div className="pdh__job-row">
                    <div className="pdh__job-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>{job.icon}</span>
                    </div>
                    <div className="pdh__job-info">
                      <p className="pdh__job-type">{job.serviceType}</p>
                      <p className="pdh__job-desc">{job.description}</p>
                      <div className="pdh__job-meta">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                        {job.scheduledDate} • {job.scheduledTime}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* ── Active Jobs ── */}
        {activeJobs.length > 0 && (
          <div>
            <div className="section-heading-row">
              <h2 className="section-heading">Active Now</h2>
              <span className="pdh__active-count">{activeJobs.length} jobs</span>
            </div>
            <div className="pdh__job-list">
              {activeJobs.slice(0, 2).map((job) => (
                <GlassCard key={job.id} interactive className="pdh__job-card pdh__job-card--active" onClick={() => navigate(`/work-report/${job.id}`)}>
                  <div className="pdh__job-row">
                    <div className="pdh__job-icon pdh__job-icon--active">
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#FFFFFF' }}>{job.icon}</span>
                    </div>
                    <div className="pdh__job-info">
                      <p className="pdh__job-type">{job.serviceType}</p>
                      <p className="pdh__job-desc">{job.address}</p>
                      {job.tenantName && <p className="pdh__job-meta">Tenant: {job.tenantName}</p>}
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>chevron_right</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Action Cards ── */}
        <div className="pdh__action-grid">
          <GlassCard interactive className="pdh__action-card" onClick={() => navigate('/jobs')}>
            <span className="material-symbols-outlined pdh__action-icon">work</span>
            <span className="pdh__action-label">All Jobs</span>
          </GlassCard>
          <GlassCard interactive className="pdh__action-card" onClick={() => navigate('/messaging')}>
            <span className="material-symbols-outlined pdh__action-icon">chat</span>
            <span className="pdh__action-label">Messages</span>
          </GlassCard>
          <GlassCard interactive className="pdh__action-card" onClick={() => navigate('/provider-earnings')}>
            <span className="material-symbols-outlined pdh__action-icon">payments</span>
            <span className="pdh__action-label">Earnings</span>
          </GlassCard>
          <GlassCard interactive className="pdh__action-card" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined pdh__action-icon">person</span>
            <span className="pdh__action-label">My Profile</span>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
