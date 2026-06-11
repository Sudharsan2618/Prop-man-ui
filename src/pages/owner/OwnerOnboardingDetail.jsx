import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, Skeleton,
  SecondaryButton, ProgressBar,
} from '../../components'
import { fetchOnboardingWorkflow } from '../../services/api'
import './OwnerOnboardingDetail.css'

const STEPS = [
  { key: 'visit_requested_at',               label: 'Visit Requested',     icon: 'event' },
  { key: 'visit_scheduled_at',               label: 'Visit Scheduled',     icon: 'today' },
  { key: 'visit_approved_at',                label: 'Visit Approved',      icon: 'check_circle' },
  { key: 'agreement_generated_at',           label: 'Agreement Generated', icon: 'description' },
  { key: 'tenant_signed_at',                 label: 'Tenant Signed',       icon: 'draw' },
  { key: 'advance_submitted_at',             label: 'Advance Submitted',   icon: 'receipt' },
  { key: 'advance_approved_at',              label: 'Advance Approved',    icon: 'paid' },
  { key: 'police_verification_completed_at', label: 'Police Verification', icon: 'shield' },
  { key: 'original_agreement_uploaded_at',   label: 'Original Agreement',  icon: 'fact_check' },
  { key: 'tenant_activated_at',              label: 'Tenant Activated',    icon: 'how_to_reg' },
]

function formatDateTime(s) {
  if (!s) return null
  try {
    return new Date(s).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return s }
}

export default function OwnerOnboardingDetail() {
  const { workflowId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useRole()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchOnboardingWorkflow(workflowId)
      .then((data) => { if (!cancelled) setWorkflow(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workflowId])

  const handleTabChange = (t) => { setActiveTab(t); _navTabChange(t) }

  const headerNode = (
    <AppHeader
      title="LuxeLife"
      subtitle="Onboarding"
      avatarText={user?.initials || ''}
      hasNotification={true}
      onNotificationClick={() => navigate('/notifications')}
      onAvatarClick={() => navigate('/profile')}
    />
  )

  if (loading) {
    return (
      <PageShell header={headerNode} bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}>
        <div className="oobd"><Skeleton height="320px" radius="var(--radius-xl)" /></div>
      </PageShell>
    )
  }

  if (error || !workflow) {
    return (
      <PageShell header={headerNode} bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}>
        <div className="oobd">
          <GlassCard>
            <p style={{ color: 'var(--status-danger)' }}>{error || 'Onboarding not found.'}</p>
            <SecondaryButton icon="arrow_back" onClick={() => navigate('/owner-onboarding')} style={{ marginTop: 'var(--space-3)' }}>Back</SecondaryButton>
          </GlassCard>
        </div>
      </PageShell>
    )
  }

  const done = STEPS.filter((s) => workflow[s.key]).length
  const progressPct = Math.round((done / STEPS.length) * 100)
  const currentIdx = done < STEPS.length ? done : STEPS.length - 1

  return (
    <PageShell header={headerNode} bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}>
      <div className="oobd">
        <div className="oobd__back">
          <SecondaryButton fullWidth={false} icon="arrow_back" onClick={() => navigate('/owner-onboarding')}>Back</SecondaryButton>
        </div>

        <GlassCard className="oobd__summary">
          <div className="oobd__summary-head">
            <div className="oobd__head-text">
              <p className="oobd__title">{workflow.property_name || 'Property'}</p>
              <p className="oobd__sub">
                <span>Tenant <strong>{workflow.tenant_name || '—'}</strong></span>
                <span className="oobd__sep">·</span>
                <span>Manager <strong>{workflow.primary_manager_name || 'Unassigned'}</strong></span>
              </p>
            </div>
            <StatusBadge status={progressPct === 100 ? 'verified' : workflow.state === 'cancelled' ? 'overdue' : 'pending'}>
              {(workflow.state || '').replace(/_/g, ' ')}
            </StatusBadge>
          </div>
          <div className="oobd__progress">
            <ProgressBar value={progressPct} />
            <span className="oobd__progress-pct">{progressPct}% · {done} of {STEPS.length}</span>
          </div>
          {workflow.last_action_notes && (
            <p className="oobd__note">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
              <span>{workflow.last_action_notes}</span>
            </p>
          )}
        </GlassCard>

        <GlassCard className="oobd__timeline">
          <p className="oobd__section-title">Timeline</p>
          <ol className="oobd__steps">
            {STEPS.map((step, idx) => {
              const ts = workflow[step.key]
              const isDone = Boolean(ts)
              const isCurrent = !isDone && idx === currentIdx
              return (
                <li
                  key={step.key}
                  className={`oobd__step ${isDone ? 'oobd__step--done' : isCurrent ? 'oobd__step--current' : 'oobd__step--pending'}`}
                >
                  <span className="oobd__step-dot">
                    <span className="material-symbols-outlined">{isDone ? 'check' : step.icon}</span>
                  </span>
                  <div className="oobd__step-body">
                    <p className="oobd__step-label">{step.label}</p>
                    <p className="oobd__step-meta">
                      {isDone ? formatDateTime(ts) : isCurrent ? 'In progress…' : 'Not yet'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </GlassCard>
      </div>
    </PageShell>
  )
}
