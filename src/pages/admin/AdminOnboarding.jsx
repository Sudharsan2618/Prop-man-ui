import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, Skeleton,
} from '../../components'
import { fetchOnboardingWorkflows } from '../../services/api'
import './AdminOnboarding.css'

const STEPS = [
  { key: 'visit_booked', label: 'Visit Booked', icon: 'event', tsField: 'visit_booked_at' },
  { key: 'visit_approved', label: 'Visit Approved', icon: 'thumb_up', tsField: 'visit_approved_at', rejKey: 'visit_rejected', rejTs: 'visit_rejected_at' },
  { key: 'agreement_generated', label: 'Agreement Generated', icon: 'description', tsField: 'agreement_generated_at' },
  { key: 'tenant_signed', label: 'Tenant Signed', icon: 'draw', tsField: 'tenant_signed_at' },
  { key: 'advance_submitted', label: 'Advance Submitted', icon: 'receipt_long', tsField: 'advance_submitted_at' },
  { key: 'advance_approved', label: 'Advance Approved', icon: 'paid', tsField: 'advance_approved_at' },
  { key: 'police_verification_completed', label: 'Police Verification', icon: 'verified_user', tsField: 'police_verification_completed_at' },
  { key: 'original_agreement_uploaded', label: 'Original Agreement', icon: 'upload_file', tsField: 'original_agreement_uploaded_at' },
  { key: 'tenant_activated', label: 'Tenant Activated', icon: 'how_to_reg', tsField: 'tenant_activated_at' },
]

function getStepStatus(wf, step, idx) {
  if (step.rejKey && wf.state === step.rejKey) return 'rejected'
  const ts = wf[step.tsField]
  if (ts) return 'done'
  const stateOrder = STEPS.map(s => s.key)
  const currentIdx = stateOrder.indexOf(wf.state)
  if (idx === currentIdx + 1) return 'active'
  return 'pending'
}

function formatTs(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function stateLabel(state) {
  return (state || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function completedCount(wf) {
  return STEPS.filter(s => !!wf[s.tsField]).length
}

export default function AdminOnboarding() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('home')
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleTabChange = (tab) => { setActiveTab(tab); _navTabChange(tab) }

  useEffect(() => {
    fetchOnboardingWorkflows()
      .then(setWorkflows)
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell
      header={<AppHeader title="Onboarding Tracker" hasNotification onNotificationClick={() => navigate('/notifications')} />}
      bottomNav={<BottomNav role="admin" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="aonb animate-fade-in">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2].map(i => (
              <Skeleton key={i} height="200px" radius="var(--radius-xl)" />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="aonb__empty">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>checklist</span>
            <p>No active onboarding workflows</p>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Workflows are created automatically when a tenant books a property visit</p>
          </div>
        ) : (
          workflows.map(wf => {
            const isOpen = !!expanded[wf.id]
            const done = completedCount(wf)

            return (
              <GlassCard key={wf.id} className="aonb__wf-card">
                <button className="aonb__wf-toggle" onClick={() => toggle(wf.id)}>
                  <span className={`material-symbols-outlined aonb__chevron ${isOpen ? 'aonb__chevron--open' : ''}`}>chevron_right</span>
                  <div className="aonb__wf-summary">
                    <div className="aonb__wf-summary-top">
                      <p className="aonb__wf-title">Tenant Onboarding</p>
                      <StatusBadge status={wf.state === 'tenant_activated' ? 'verified' : wf.state === 'visit_rejected' ? 'overdue' : 'pending'}>
                        {stateLabel(wf.state)}
                      </StatusBadge>
                    </div>
                    <p className="aonb__wf-ids">
                      Property: {wf.property_id}
                    </p>
                    <p className="aonb__wf-ids">Tenant: {wf.tenant_id}</p>
                    <div className="aonb__progress-bar">
                      <div className="aonb__progress-fill" style={{ width: `${(done / STEPS.length) * 100}%` }} />
                    </div>
                    <p className="aonb__progress-text">{done} of {STEPS.length} steps completed</p>
                  </div>
                </button>

                {isOpen && (
                  <div className="aonb__body">
                    <div className="aonb__timeline">
                      {STEPS.map((step, idx) => {
                        const status = getStepStatus(wf, step, idx)
                        const ts = wf[step.tsField]
                        const rejTs = step.rejTs ? wf[step.rejTs] : null

                        return (
                          <div key={step.key} className="aonb__step">
                            <span className={`aonb__step-icon aonb__step-icon--${status}`}>
                              <span className="material-symbols-outlined">
                                {status === 'done' ? 'check' : status === 'rejected' ? 'close' : status === 'active' ? 'arrow_forward' : 'circle'}
                              </span>
                            </span>
                            <div className="aonb__step-content">
                              <p className={`aonb__step-label ${status === 'pending' ? 'aonb__step-label--pending' : ''}`}>
                                {step.label}
                              </p>
                              {status === 'done' && ts && (
                                <p className="aonb__step-time">{formatTs(ts)}</p>
                              )}
                              {status === 'rejected' && rejTs && (
                                <p className="aonb__step-time">{formatTs(rejTs)}</p>
                              )}
                              {status === 'rejected' && (
                                <p className="aonb__step-note">Visit was rejected</p>
                              )}
                              {step.key === 'police_verification_completed' && wf.police_verification_status === 'submitted' && (
                                <p className="aonb__step-note" style={{ color: 'var(--status-warning)' }}>Document submitted — awaiting review</p>
                              )}
                              {step.key === 'police_verification_completed' && wf.police_verification_status === 'rejected' && (
                                <p className="aonb__step-note">Rejected: {wf.police_verification_rejection_reason}</p>
                              )}
                              {step.key === 'original_agreement_uploaded' && wf.original_agreement_status === 'submitted' && (
                                <p className="aonb__step-note" style={{ color: 'var(--status-warning)' }}>Document submitted — awaiting review</p>
                              )}
                              {step.key === 'original_agreement_uploaded' && wf.original_agreement_status === 'rejected' && (
                                <p className="aonb__step-note">Rejected: {wf.original_agreement_rejection_reason}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </GlassCard>
            )
          })
        )}
      </div>
    </PageShell>
  )
}
