import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, Skeleton, SecondaryButton, ProgressBar,
} from '../../components'
import OnboardingActions from '../common/OnboardingActions'
import { useRole } from '../../context/RoleContext'
import { fetchOnboardingWorkflow } from '../../services/api'
import './ManagerOnboardingDetail.css'

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

export default function ManagerOnboardingDetail() {
  const { workflowId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useRole()
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const data = await fetchOnboardingWorkflow(workflowId)
      setWorkflow(data)
    } catch (e) { setError(e.message) }
  }, [workflowId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchOnboardingWorkflow(workflowId)
      .then((data) => { if (!cancelled) setWorkflow(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workflowId])

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
      <PageShell header={headerNode} bottomNav={<BottomNav role={role} />}>
        <div className="mobd"><Skeleton height="320px" radius="var(--radius-xl)" /></div>
      </PageShell>
    )
  }

  if (error || !workflow) {
    return (
      <PageShell header={headerNode} bottomNav={<BottomNav role={role} />}>
        <div className="mobd">
          <GlassCard>
            <p style={{ color: 'var(--status-danger)' }}>{error || 'Workflow not found.'}</p>
            <SecondaryButton icon="arrow_back" onClick={() => navigate('/manager-onboarding')} style={{ marginTop: 'var(--space-3)' }}>Back to list</SecondaryButton>
          </GlassCard>
        </div>
      </PageShell>
    )
  }

  const done = STEPS.filter((s) => workflow[s.key]).length
  const progressPct = Math.round((done / STEPS.length) * 100)
  const currentIdx = done < STEPS.length ? done : STEPS.length - 1

  return (
    <PageShell header={headerNode} bottomNav={<BottomNav role={role} />}>
      <div className="mobd">
        <div className="mobd__back">
          <SecondaryButton fullWidth={false} icon="arrow_back" onClick={() => navigate('/manager-onboarding')}>
            Back
          </SecondaryButton>
        </div>

        {/* Summary */}
        <GlassCard className="mobd__summary">
          <div className="mobd__summary-head">
            <div className="mobd__head-text">
              <p className="mobd__title">{workflow.property_name || 'Unnamed property'}</p>
              <p className="mobd__sub">
                <span>Tenant <strong>{workflow.tenant_name || '—'}</strong></span>
                <span className="mobd__sep">·</span>
                <span>Manager <strong>{workflow.primary_manager_name || 'Unassigned'}</strong></span>
              </p>
            </div>
            <StatusBadge status={progressPct === 100 ? 'verified' : workflow.state === 'cancelled' ? 'overdue' : 'pending'}>
              {(workflow.state || '').replace(/_/g, ' ')}
            </StatusBadge>
          </div>
          <div className="mobd__progress">
            <ProgressBar value={progressPct} />
            <span className="mobd__progress-pct">{progressPct}% · {done} of {STEPS.length}</span>
          </div>
          {workflow.last_action_notes && (
            <p className="mobd__note">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
              <span>{workflow.last_action_notes}</span>
            </p>
          )}
        </GlassCard>

        {/* Timeline */}
        <GlassCard className="mobd__timeline">
          <p className="mobd__section-title">Timeline</p>
          <ol className="mobd__steps">
            {STEPS.map((step, idx) => {
              const ts = workflow[step.key]
              const isDone = Boolean(ts)
              const isCurrent = !isDone && idx === currentIdx
              return (
                <li
                  key={step.key}
                  className={`mobd__step ${isDone ? 'mobd__step--done' : isCurrent ? 'mobd__step--current' : 'mobd__step--pending'}`}
                >
                  <span className="mobd__step-dot">
                    <span className="material-symbols-outlined">
                      {isDone ? 'check' : step.icon}
                    </span>
                  </span>
                  <div className="mobd__step-body">
                    <p className="mobd__step-label">{step.label}</p>
                    <p className="mobd__step-meta">
                      {isDone ? formatDateTime(ts) : isCurrent ? 'In progress…' : 'Not yet'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </GlassCard>

        {/* Actions */}
        <OnboardingActions
          workflow={workflow}
          visitsPath="/manager-visits"
          onChanged={reload}
        />
      </div>
    </PageShell>
  )
}
