import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  PrimaryButton, SecondaryButton, TabNav, Skeleton,
} from '../../components'
import { fetchJobs } from '../../services/api'
import './MyServiceJobs.css'

export default function MyServiceJobs() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('jobs')
  const [jobTab, setJobTab] = useState('active')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs().then((j) => {
      setJobs(j)
      setLoading(false)
    })
  }, [])

  const filteredJobs = jobs.filter((j) => {
    if (jobTab === 'active') return j.status === 'active'
    if (jobTab === 'scheduled') return j.status === 'scheduled'
    if (jobTab === 'completed') return ['completed', 'disputed'].includes(j.status)
    return true
  })

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="My Service Jobs"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav role="provider" activeTab={activeTab} onTabChange={handleTabChange} badges={{ messages: 2 }} />
      }
    >
      <div className="msj stagger-children">
        {/* ── Tab Nav ── */}
        <TabNav
          tabs={[
            { key: 'scheduled', label: 'Scheduled', count: jobs.filter((j) => j.status === 'scheduled').length },
            { key: 'active', label: 'Active', count: jobs.filter((j) => j.status === 'active').length },
            { key: 'completed', label: 'Completed', count: jobs.filter((j) => ['completed','disputed'].includes(j.status)).length },
          ]}
          activeTab={jobTab}
          onTabChange={setJobTab}
        />

        {/* ── Job Cards ── */}
        <div className="msj__jobs">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} height="180px" radius="var(--radius-xl)" />)
          ) : filteredJobs.length === 0 ? (
            <div className="msj__empty">
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>work_off</span>
              <p>No {jobTab} jobs</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <GlassCard key={job.id} className={`msj__job-card ${job.status === 'active' ? 'msj__job-card--active' : ''}`}>
                {/* Header */}
                <div className="msj__job-top">
                  <div className="msj__job-icon">
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>{job.icon}</span>
                  </div>
                  <div className="msj__job-header-info">
                    <p className="msj__job-type">{job.serviceType}</p>
                    <p className="msj__job-desc">{job.description}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                {/* Details */}
                <div className="msj__job-details">
                  <div className="msj__job-detail-row">
                    <span className="material-symbols-outlined msj__detail-icon">location_on</span>
                    <span>{job.address}</span>
                  </div>
                  <div className="msj__job-detail-row">
                    <span className="material-symbols-outlined msj__detail-icon">schedule</span>
                    <span>{job.scheduledDate} • {job.scheduledTime}</span>
                  </div>
                  {job.tenantName && (
                    <div className="msj__job-detail-row">
                      <span className="material-symbols-outlined msj__detail-icon">person</span>
                      <span>Tenant: {job.tenantName}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="msj__job-actions">
                  <button className="msj__action-btn" onClick={() => navigate('/messaging')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                    Contact
                  </button>
                  <button className="msj__action-btn msj__action-btn--primary" onClick={() => navigate(`/work-report/${job.id}`)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    Update Job
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}
