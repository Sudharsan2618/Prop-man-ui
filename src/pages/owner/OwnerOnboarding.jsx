import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, Skeleton,
} from '../../components'
import { fetchOnboardingWorkflows } from '../../services/api'
import { reportError } from '../../utils/errors'
import './OwnerOnboarding.css'

const STEPS = [
  { key: 'visit_requested_at' },
  { key: 'visit_scheduled_at' },
  { key: 'visit_approved_at' },
  { key: 'agreement_generated_at' },
  { key: 'tenant_signed_at' },
  { key: 'advance_submitted_at' },
  { key: 'advance_approved_at' },
  { key: 'police_verification_completed_at' },
  { key: 'original_agreement_uploaded_at' },
  { key: 'tenant_activated_at' },
]

const STATE_BADGE = {
  visit_requested: 'pending',
  visit_scheduled: 'pending',
  visit_approved: 'pending',
  visit_rejected: 'overdue',
  agreement_generated: 'pending',
  tenant_signed: 'pending',
  advance_submitted: 'pending',
  advance_approved: 'pending',
  police_verification_completed: 'pending',
  original_agreement_uploaded: 'pending',
  tenant_activated: 'verified',
  cancelled: 'overdue',
}

function computeProgress(wf) {
  const done = STEPS.filter((s) => wf[s.key]).length
  return Math.round((done / STEPS.length) * 100)
}

export default function OwnerOnboarding() {
  const navigate = useNavigate()
  const { user, role } = useRole()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all') // 'all' | 'in_progress' | 'done'

  useEffect(() => {
    fetchOnboardingWorkflows()
      .then((data) => setItems((data || []).map((w) => ({ ...w, progress: computeProgress(w) }))))
      .catch((err) => reportError(err, { context: 'OwnerOnboarding.fetch' }))
      .finally(() => setLoading(false))
  }, [])

  const handleTabChange = (t) => { setActiveTab(t); _navTabChange(t) }

  const filtered = items.filter((w) => {
    if (tab === 'in_progress') return w.progress < 100 && w.state !== 'cancelled'
    if (tab === 'done') return w.progress === 100
    return true
  })

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Tenant Onboarding"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="oonb">
        <div className="oonb__filter">
          <button className={`oonb__chip ${tab === 'all' ? 'oonb__chip--active' : ''}`} onClick={() => setTab('all')}>
            All ({items.length})
          </button>
          <button className={`oonb__chip ${tab === 'in_progress' ? 'oonb__chip--active' : ''}`} onClick={() => setTab('in_progress')}>
            In Progress ({items.filter((w) => w.progress < 100 && w.state !== 'cancelled').length})
          </button>
          <button className={`oonb__chip ${tab === 'done' ? 'oonb__chip--active' : ''}`} onClick={() => setTab('done')}>
            Completed ({items.filter((w) => w.progress === 100).length})
          </button>
        </div>

        {loading ? (
          <div className="oonb__list">
            {[1, 2, 3].map((i) => <Skeleton key={i} height="100px" radius="var(--radius-xl)" />)}
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="oonb__empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>checklist</span>
            <p>No onboarding workflows here.</p>
          </GlassCard>
        ) : (
          <div className="oonb__list">
            {filtered.map((w) => (
              <GlassCard
                key={w.id}
                interactive
                className="oonb__row"
                onClick={() => navigate(`/owner-onboarding/${w.id}`)}
              >
                <div className="oonb__row-head">
                  <div className="oonb__row-text">
                    <p className="oonb__row-title">{w.property_name || 'Unnamed property'}</p>
                    <p className="oonb__row-sub">
                      <span>Tenant <strong>{w.tenant_name || '—'}</strong></span>
                      <span className="oonb__sep">·</span>
                      <span>Manager <strong>{w.primary_manager_name || 'Unassigned'}</strong></span>
                    </p>
                  </div>
                  <div className="oonb__row-meta">
                    <span className="oonb__row-pct">{w.progress}%</span>
                    <StatusBadge status={STATE_BADGE[w.state] || 'pending'}>
                      {(w.state || '').replace(/_/g, ' ')}
                    </StatusBadge>
                  </div>
                </div>
                <div className="oonb__bar" style={{ '--oonb-progress': `${w.progress}%` }} aria-hidden="true" />
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
