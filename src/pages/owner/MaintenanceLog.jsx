import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  PrimaryButton, SecondaryButton, TabNav, Dropdown, Avatar, Skeleton,
} from '../../components'
import { fetchJobs, fetchPropertiesByOwner } from '../../services/api'
import './MaintenanceLog.css'

export default function MaintenanceLog() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('maintenance')
  const [statusTab, setStatusTab] = useState('pending')
  const [property, setProperty] = useState('all')
  const [jobs, setJobs] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchJobs(), fetchPropertiesByOwner()])
      .then(([jobData, propData]) => {
        setJobs(jobData || [])
        setProperties(propData || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = jobs.filter((j) => {
    const matchesProperty = property === 'all' || j.propertyId === property || j.property_id === property
    if (!matchesProperty) return false
    if (statusTab === 'pending') return ['scheduled'].includes(j.status)
    if (statusTab === 'inprogress') return j.status === 'active'
    return ['completed', 'disputed'].includes(j.status)
  })

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={<AppHeader title="Maintenance Log" onNotificationClick={() => navigate('/notifications')} />}
      bottomNav={<BottomNav role="owner" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="mlog stagger-children">
        {/* Property Filter */}
        <Dropdown
          label="Select Property"
          options={[
            { value: 'all', label: 'All Properties' },
            ...properties.map((p) => ({ value: p.id, label: p.name || p.id })),
          ]}
          value={property}
          onChange={(e) => setProperty(e.target.value)}
        />

        {/* Status Tabs */}
        <TabNav
          tabs={[
            { key: 'pending', label: 'Pending Approval', count: jobs.filter((j) => j.status === 'scheduled').length },
            { key: 'inprogress', label: 'In Progress', count: jobs.filter((j) => j.status === 'active').length },
            { key: 'completed', label: 'Completed' },
          ]}
          activeTab={statusTab}
          onTabChange={setStatusTab}
        />

        {/* Request Cards */}
        <div className="mlog__list">
          {loading ? (
            [1, 2].map((i) => <Skeleton key={i} height="200px" radius="var(--radius-xl)" />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)', display: 'block', marginBottom: 'var(--space-2)' }}>handyman</span>
              No {statusTab} requests
            </div>
          ) : (
            filtered.map((job) => (
              <GlassCard key={job.id} className="mlog__card animate-slide-up">
                <div className="mlog__card-top">
                  <div className="mlog__card-icon">
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>{job.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <p style={{ fontWeight: 'var(--fw-semibold)' }}>{job.serviceType}</p>
                      <StatusBadge status={job.status === 'scheduled' ? 'pending' : job.status} />
                    </div>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{job.address}</p>
                  </div>
                </div>
                {job.providerName && (
                  <div className="mlog__provider-row">
                    <Avatar initials={job.providerName.split(' ').map((n) => n[0]).join('')} size="sm" />
                    <span style={{ fontSize: 'var(--fs-caption)' }}>{job.providerName}</span>
                    <span style={{ fontSize: 'var(--fs-caption)', color: '#F59E0B' }}>★ 4.8</span>
                  </div>
                )}
                <div className="mlog__card-meta">
                  <span>Est. Cost: ₹{job.estimatedCost.min} – ₹{job.estimatedCost.max}</span>
                  <span>Requested: {job.createdAt}</span>
                </div>
                {statusTab === 'pending' && (
                  <div className="mlog__card-actions">
                    <SecondaryButton variant="danger" icon="close">Reject</SecondaryButton>
                    <PrimaryButton icon="check" onClick={() => navigate(`/invoice-approval/${job.id}`)}>Approve Quote</PrimaryButton>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}
