import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SALayout from './SALayout'
import { GlassCard, StatusBadge, Skeleton, SecondaryButton, ProgressBar } from '../../components'
import OnboardingActions from '../common/OnboardingActions'
import { fetchOnboardingWorkflow } from '../../services/api'
import './SAOnboardingDetail.css'

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

export default function SAOnboardingDetail() {
  const { workflowId } = useParams()
  const navigate = useNavigate()
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

  const goBack = () => navigate('/sa/onboarding')

  if (loading) {
    return (
      <SALayout activeKey="onboarding" title="Onboarding" onBack={goBack}>
        <div className="saonbd"><Skeleton height="320px" radius="var(--radius-xl)" /></div>
      </SALayout>
    )
  }

  if (error || !workflow) {
    return (
      <SALayout activeKey="onboarding" title="Onboarding" onBack={goBack}>
        <div className="saonbd">
          <GlassCard>
            <p style={{ color: 'var(--status-danger)' }}>{error || 'Workflow not found.'}</p>
          </GlassCard>
        </div>
      </SALayout>
    )
  }

  const done = STEPS.filter((s) => workflow[s.key]).length
  const progressPct = Math.round((done / STEPS.length) * 100)
  const currentIdx = done < STEPS.length ? done : STEPS.length - 1

  return (
    <SALayout activeKey="onboarding" title="Onboarding" onBack={goBack}>
      <div className="saonbd">
        {/* Summary */}
        <GlassCard className="saonbd__summary">
          <div className="saonbd__summary-head">
            <div className="saonbd__head-text">
              <p className="saonbd__title">{workflow.property_name || 'Unnamed property'}</p>
              <p className="saonbd__sub">
                <span>Tenant <strong>{workflow.tenant_name || '—'}</strong></span>
                <span className="saonbd__sep">·</span>
                <span>Manager <strong>{workflow.primary_manager_name || 'Unassigned'}</strong></span>
              </p>
            </div>
            <StatusBadge status={workflow.state === 'cancelled' ? 'overdue' : progressPct === 100 ? 'verified' : 'pending'}>
              {(workflow.state || '').replace(/_/g, ' ')}
            </StatusBadge>
          </div>
          <div className="saonbd__progress">
            <ProgressBar value={progressPct} />
            <span className="saonbd__progress-pct">{progressPct}% · {done} of {STEPS.length}</span>
          </div>
          {workflow.last_action_notes && (
            <p className="saonbd__note">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
              <span>{workflow.last_action_notes}</span>
            </p>
          )}
        </GlassCard>

        {/* Timeline */}
        <GlassCard className="saonbd__timeline">
          <p className="saonbd__section-title">Timeline</p>
          <ol className="saonbd__steps">
            {STEPS.map((step, idx) => {
              const ts = workflow[step.key]
              const isDone = Boolean(ts)
              const isCurrent = !isDone && idx === currentIdx
              return (
                <li
                  key={step.key}
                  className={`saonbd__step ${isDone ? 'saonbd__step--done' : isCurrent ? 'saonbd__step--current' : 'saonbd__step--pending'}`}
                >
                  <span className="saonbd__step-dot">
                    <span className="material-symbols-outlined">
                      {isDone ? 'check' : step.icon}
                    </span>
                  </span>
                  <div className="saonbd__step-body">
                    <p className="saonbd__step-label">{step.label}</p>
                    <p className="saonbd__step-meta">
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
          visitsPath="/sa/visits"
          onChanged={reload}
        />
      </div>
    </SALayout>
  )
}
