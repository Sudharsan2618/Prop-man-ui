import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  Avatar, ProgressBar, CountdownTimer, Skeleton,
} from '../../components'
import { fetchProviderStats, fetchJobs } from '../../services/api'
import './PayoutLedger.css'

export default function PayoutLedger() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('earnings')
  const [stats, setStats] = useState(null)
  const [recentJobs, setRecentJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchProviderStats(), fetchJobs()]).then(([s, j]) => {
      setStats(s)
      setRecentJobs(j)
      setLoading(false)
    })
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  const statusToColor = {
    escrowed: '#3B82F6',
    completed: '#22C55E',
    disputed: '#EF4444',
    active: '#F59E0B',
  }

  return (
    <PageShell
      header={
        <AppHeader title="Payout Ledger" onNotificationClick={() => navigate('/notifications')} />
      }
      bottomNav={
        <BottomNav role="provider" activeTab={activeTab} onTabChange={handleTabChange} badges={{ messages: 2 }} />
      }
    >
      <div className="pl stagger-children">
        {/* Provider Card */}
        <div className="pl__provider-card animate-slide-up">
          <Avatar initials={user?.initials || ''} size="lg" verified />
          <div>
            <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)' }}>{user.name}</p>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Verified Service Provider</p>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Member since {user.memberSince?.slice(0, 4) || '2021'}</p>
          </div>
        </div>

        {/* Next Payout Hero */}
        {stats && (
          <GlassCard variant="highlighted" className="pl__hero animate-slide-up">
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Next Payout</p>
            <p className="pl__overline">TOTAL AMOUNT</p>
            <p className="pl__amount">₹{stats.nextPayoutAmount.toLocaleString('en-IN')}</p>
            <CountdownTimer targetDate={stats.nextPayoutDate} />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <ProgressBar label="Weekly Target" value={stats.weeklyTarget} />
            </div>
            <p className="pl__bonus-note">Complete 5 more jobs to unlock weekend bonus 🎯</p>
          </GlassCard>
        )}

        {/* Earnings Summary Pills */}
        {stats && (
          <div className="pl__pills">
            <div className="pl__pill">
              <span className="pl__pill-label">This Week</span>
              <span className="pl__pill-value">₹{stats.earningsThisWeek.toLocaleString('en-IN')}</span>
            </div>
            <div className="pl__pill">
              <span className="pl__pill-label">This Month</span>
              <span className="pl__pill-value">₹{stats.earningsThisMonth.toLocaleString('en-IN')}</span>
            </div>
            <div className="pl__pill pl__pill--highlight">
              <span className="pl__pill-label">Lifetime</span>
              <span className="pl__pill-value">₹8.5L</span>
            </div>
          </div>
        )}

        {/* Weekly Chart */}
        {stats && (
          <GlassCard>
            <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Weekly Earnings</p>
            <div className="pl__chart">
              {stats.weeklyBreakdown.map((d, i) => {
                const maxAmt = Math.max(...stats.weeklyBreakdown.map((x) => x.amount), 1)
                const heightPct = (d.amount / maxAmt) * 100
                const isToday = i === new Date().getDay() - 1
                return (
                  <div key={d.day} className="pl__chart-col">
                    <div className="pl__chart-bar-wrap">
                      <div
                        className={`pl__chart-bar ${isToday ? 'pl__chart-bar--today' : ''}`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                    </div>
                    <span className={`pl__chart-day ${isToday ? 'pl__chart-day--today' : ''}`}>{d.day}</span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}

        {/* Recent Jobs */}
        <div>
          <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Recent Jobs</p>
          <div className="pl__recent-jobs">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} height="72px" radius="var(--radius-xl)" />)
            ) : (
              recentJobs.map((job) => (
                <GlassCard key={job.id} interactive onClick={() => navigate(`/work-report/${job.id}`)}>
                  <div className="pl__job-row">
                    <div className="pl__job-icon" style={{ background: `${statusToColor[job.status] || 'var(--primary)'}20` }}>
                      <span className="material-symbols-outlined" style={{ color: statusToColor[job.status] || 'var(--primary)', fontSize: '20px' }}>{job.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-body)' }}>{job.serviceType}</p>
                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{job.address}</p>
                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>{job.scheduledDate}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 'var(--fw-semibold)', color: job.actualCost ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        {job.actualCost ? `₹${job.actualCost.toLocaleString('en-IN')}` : 'TBD'}
                      </p>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
