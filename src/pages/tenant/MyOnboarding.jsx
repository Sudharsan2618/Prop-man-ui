import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, Skeleton,
  SecondaryButton, PrimaryButton, ProgressBar,
} from '../../components'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import { fetchOnboardingWorkflow } from '../../services/api'
import './MyOnboarding.css'

const STEPS = [
  { key: 'visit_requested_at',               label: 'Visit Requested',     icon: 'event' },
  { key: 'visit_scheduled_at',               label: 'Visit Scheduled',     icon: 'today' },
  { key: 'visit_approved_at',                label: 'Visit Approved',      icon: 'check_circle' },
  { key: 'agreement_generated_at',           label: 'Agreement Generated', icon: 'description' },
  { key: 'tenant_signed_at',                 label: 'Agreement Signed',    icon: 'draw' },
  { key: 'advance_submitted_at',             label: 'Advance Submitted',   icon: 'receipt' },
  { key: 'advance_approved_at',              label: 'Advance Approved',    icon: 'paid' },
  { key: 'police_verification_completed_at', label: 'Police Verification', icon: 'shield' },
  { key: 'original_agreement_uploaded_at',   label: 'Original Agreement',  icon: 'fact_check' },
  { key: 'tenant_activated_at',              label: 'Move-in Ready',       icon: 'how_to_reg' },
]

function formatDateTime(s) {
  if (!s) return null
  try {
    return new Date(s).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return s }
}

function getNextAction(wf) {
  switch (wf.state) {
    case 'visit_requested':
      return { text: 'Your visit request has been sent. The manager will confirm a time soon.', cta: null }
    case 'visit_scheduled':
      return { text: 'Visit confirmed. See you at the property!', cta: null }
    case 'visit_approved':
    case 'agreement_generated':
      return { text: 'Your rental agreement is ready. Please review and sign.', cta: 'Sign Agreement', route: `/agreement/${wf.agreement_id}` }
    case 'visit_rejected':
      return { text: 'Your visit was not approved. You can browse other properties.', cta: 'Browse Properties', route: '/browse' }
    case 'tenant_signed':
      return { text: 'Agreement signed. Please pay the advance offline and upload the receipt.', cta: 'View Payments', route: '/payments' }
    case 'advance_submitted':
      return { text: 'Advance receipt submitted. Waiting for manager confirmation.', cta: null }
    case 'advance_approved':
      return { text: 'Advance confirmed! Upload police verification and a copy of the signed original agreement.', cta: 'Upload Documents', route: `/agreement/${wf.agreement_id}` }
    case 'police_verification_completed':
    case 'original_agreement_uploaded':
      return { text: 'Almost there — complete any remaining document uploads.', cta: 'Upload Documents', route: `/agreement/${wf.agreement_id}` }
    case 'tenant_activated':
      return { text: 'Welcome home! Your onboarding is complete.', cta: null }
    case 'cancelled':
      return { text: 'This onboarding was cancelled.', cta: null }
    default:
      return { text: 'Onboarding in progress.', cta: null }
  }
}

export default function MyOnboarding() {
  const { workflowId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useRole()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('home')
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

  const handleTabChange = (tab) => { setActiveTab(tab); _navTabChange(tab) }

  const headerNode = (
    <AppHeader
      title="LuxeLife"
      subtitle="My Onboarding"
      avatarText={user?.initials || ''}
      hasNotification={true}
      onNotificationClick={() => navigate('/notifications')}
      onAvatarClick={() => navigate('/profile')}
    />
  )

  if (loading) {
    return (
      <PageShell header={headerNode} bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}>
        <div className="myob"><Skeleton height="320px" radius="var(--radius-xl)" /></div>
      </PageShell>
    )
  }

  if (error || !workflow) {
    return (
      <PageShell header={headerNode} bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}>
        <div className="myob">
          <GlassCard>
            <p style={{ color: 'var(--status-danger)' }}>{error || 'Onboarding not found.'}</p>
            <SecondaryButton icon="arrow_back" onClick={() => navigate('/')} style={{ marginTop: 'var(--space-3)' }}>Back to Home</SecondaryButton>
          </GlassCard>
        </div>
      </PageShell>
    )
  }

  const done = STEPS.filter((s) => workflow[s.key]).length
  const progressPct = Math.round((done / STEPS.length) * 100)
  const currentIdx = done < STEPS.length ? done : STEPS.length - 1
  const next = getNextAction(workflow)

  return (
    <PageShell header={headerNode} bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}>
      <div className="myob">
        <div className="myob__back">
          <SecondaryButton fullWidth={false} icon="arrow_back" onClick={() => navigate('/')}>Back</SecondaryButton>
        </div>

        {/* Summary */}
        <GlassCard className="myob__summary">
          <div className="myob__summary-head">
            <div className="myob__head-text">
              <p className="myob__title">{workflow.property_name || 'Property'}</p>
              <p className="myob__sub">
                <span>Manager <strong>{workflow.primary_manager_name || 'Unassigned'}</strong></span>
              </p>
            </div>
            <StatusBadge status={progressPct === 100 ? 'verified' : workflow.state === 'cancelled' ? 'overdue' : 'pending'}>
              {(workflow.state || '').replace(/_/g, ' ')}
            </StatusBadge>
          </div>
          <div className="myob__progress">
            <ProgressBar value={progressPct} />
            <span className="myob__progress-pct">{progressPct}% · {done} of {STEPS.length}</span>
          </div>
        </GlassCard>

        {/* Next action */}
        {(next.text || next.cta) && (
          <GlassCard className="myob__next">
            <p className="myob__section-title">What's next</p>
            <p className="myob__next-text">{next.text}</p>
            {next.cta && (
              <PrimaryButton icon="arrow_forward" onClick={() => navigate(next.route)}>{next.cta}</PrimaryButton>
            )}
          </GlassCard>
        )}

        {/* Timeline */}
        <GlassCard className="myob__timeline">
          <p className="myob__section-title">Timeline</p>
          <ol className="myob__steps">
            {STEPS.map((step, idx) => {
              const ts = workflow[step.key]
              const isDone = Boolean(ts)
              const isCurrent = !isDone && idx === currentIdx
              return (
                <li
                  key={step.key}
                  className={`myob__step ${isDone ? 'myob__step--done' : isCurrent ? 'myob__step--current' : 'myob__step--pending'}`}
                >
                  <span className="myob__step-dot">
                    <span className="material-symbols-outlined">
                      {isDone ? 'check' : step.icon}
                    </span>
                  </span>
                  <div className="myob__step-body">
                    <p className="myob__step-label">{step.label}</p>
                    <p className="myob__step-meta">
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
