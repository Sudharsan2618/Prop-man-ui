import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, StatusBadge, TabNav, BottomNav,
  Skeleton,
} from '../../components'

import { fetchInspections } from '../../services/api'
import './InspectionHub.css'

const STATS = [
  { label: 'Pending', value: 12, color: '#F59E0B' },
  { label: 'Active', value: 5, color: 'var(--primary)' },
  { label: 'Completed', value: 28, color: '#16A34A' },
  { label: 'Disputes', value: 3, color: '#EF4444' },
]

export default function InspectionHub() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('inspections')
  const [inspTab, setInspTab] = useState('move-in')
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInspections().then((data) => { setInspections(data); setLoading(false) })
  }, [])

  const filtered = inspections.filter((i) => {
    if (inspTab === 'move-in') return i.type === 'move-in'
    if (inspTab === 'move-out') return i.type === 'move-out'
    return i.status === 'in-progress'
  })

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <SubPageHeader
          title="Inspection Hub"
          onBack={() => navigate(-1)}
          rightAction={
            <button className="ih__filter-link">Filter</button>
          }
        />
      }
      bottomNav={<BottomNav role="owner" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="ih stagger-children">
        {/* Stats Grid */}
        <div className="ih__stats-grid">
          {STATS.map((s) => (
            <GlassCard key={s.label} className="ih__stat-card">
              <p className="ih__stat-value" style={{ color: s.color }}>{s.value}</p>
              <p className="ih__stat-label">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Tabs */}
        <TabNav
          tabs={[
            { key: 'move-in', label: 'Upcoming Move-ins' },
            { key: 'move-out', label: 'Upcoming Move-outs' },
            { key: 'in-progress', label: 'In Progress' },
          ]}
          activeTab={inspTab}
          onTabChange={setInspTab}
        />

        {/* Inspection Cards */}
        <div className="ih__list">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} height="140px" radius="var(--radius-xl)" />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)', display: 'block', marginBottom: 'var(--space-2)' }}>fact_check</span>
              No inspections here
            </div>
          ) : (
            filtered.map((insp) => (
              <GlassCard key={insp.id} className="ih__card animate-slide-up">
                <div className="ih__card-body">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>{insp.date}</p>
                    <p style={{ fontWeight: 'var(--fw-semibold)', margin: '4px 0' }}>{insp.tenantName}</p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{insp.propertyName}</p>
                    <StatusBadge status={insp.type === 'move-in' ? 'active' : 'pending'}>
                      ● {insp.type === 'move-in' ? 'Move-in Inspection' : 'Move-out Inspection'}
                    </StatusBadge>
                  </div>
                  {insp.propertyImage && (
                    <img src={insp.propertyImage} alt="" className="ih__card-thumb" />
                  )}
                </div>
                <PrimaryButton
                  className="ih__gold-btn"
                  icon="arrow_forward"
                  onClick={() => navigate(`/inspection-checklist/${insp.id}`)}
                >
                  Start Inspection →
                </PrimaryButton>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}
