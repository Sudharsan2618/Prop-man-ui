import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  PrimaryButton, SecondaryButton,
} from '../../components'
import { fetchPayments, fetchPropertiesByTenant, fetchOnboardingWorkflows } from '../../services/api'
import './TenantDashboard.css'

const SERVICES = [
  { key: 'plumber', icon: 'plumbing', label: 'Plumber' },
  { key: 'electrician', icon: 'electrical_services', label: 'Electrician' },
  { key: 'painter', icon: 'format_paint', label: 'Painter' },
  { key: 'water', icon: 'water_drop', label: 'Water (Cans)' },
  { key: 'milk', icon: 'local_drink', label: 'Milk Delivery' },
  { key: 'car', icon: 'local_car_wash', label: 'Car Cleaning' },
]

const OB_STEPS = [
  { key: 'visit_booked', label: 'Visit Booked', icon: 'event', ts: 'visit_booked_at' },
  { key: 'visit_approved', label: 'Visit Approved', icon: 'thumb_up', ts: 'visit_approved_at' },
  { key: 'agreement_generated', label: 'Agreement Ready', icon: 'description', ts: 'agreement_generated_at' },
  { key: 'tenant_signed', label: 'Agreement Signed', icon: 'draw', ts: 'tenant_signed_at' },
  { key: 'advance_submitted', label: 'Advance Submitted', icon: 'receipt_long', ts: 'advance_submitted_at' },
  { key: 'advance_approved', label: 'Advance Confirmed', icon: 'paid', ts: 'advance_approved_at' },
  { key: 'police_verification_completed', label: 'Police Verification', icon: 'verified_user', ts: 'police_verification_completed_at' },
  { key: 'original_agreement_uploaded', label: 'Original Agreement', icon: 'upload_file', ts: 'original_agreement_uploaded_at' },
  { key: 'tenant_activated', label: 'Move-in Ready', icon: 'how_to_reg', ts: 'tenant_activated_at' },
]

function getNextAction(wf) {
  switch (wf.state) {
    case 'visit_booked':
      return { text: 'Your visit is scheduled. The admin will confirm after the meeting.', icon: 'schedule', cta: null }
    case 'visit_approved':
    case 'agreement_generated':
      return { text: 'Your agreement is ready! Please review and sign it.', icon: 'edit_document', cta: 'Sign Agreement', route: `/agreement/${wf.agreement_id}` }
    case 'visit_rejected':
      return { text: 'Your visit was not approved. You can book a new visit for another property.', icon: 'block', cta: 'Browse Properties', route: '/browse' }
    case 'tenant_signed':
      return { text: 'Agreement signed! Please pay the advance amount offline. The admin will confirm once received.', icon: 'account_balance', cta: 'View Payments', route: '/payments' }
    case 'advance_submitted':
      return { text: 'Advance receipt submitted. Waiting for admin confirmation.', icon: 'hourglass_top', cta: null }
    case 'advance_approved':
      return { text: 'Advance confirmed! Upload police verification and original agreement documents.', icon: 'upload_file', cta: 'Upload Documents', route: `/agreement/${wf.agreement_id}` }
    case 'police_verification_completed':
    case 'original_agreement_uploaded':
      return { text: 'Almost there! Complete remaining document uploads.', icon: 'upload_file', cta: 'Upload Documents', route: `/agreement/${wf.agreement_id}` }
    default:
      return { text: 'Onboarding in progress.', icon: 'info', cta: null }
  }
}

function OnboardingCard({ wf, navigate }) {
  const done = OB_STEPS.filter(s => !!wf[s.ts]).length
  const total = OB_STEPS.length
  const action = getNextAction(wf)
  const isRejected = wf.state === 'visit_rejected'

  return (
    <GlassCard className={`td__ob-card animate-slide-up ${isRejected ? 'td__ob-card--rejected' : ''}`}>
      <div className="td__ob-header">
        <span className="material-symbols-outlined td__ob-header-icon">{action.icon}</span>
        <div style={{ flex: 1 }}>
          <p className="td__ob-title">Onboarding Progress</p>
          <p className="td__ob-sub">{done} of {total} steps completed</p>
        </div>
        <StatusBadge status={isRejected ? 'overdue' : 'pending'}>
          {(wf.state || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </StatusBadge>
      </div>

      <div className="td__ob-bar">
        <div className="td__ob-bar-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <div className="td__ob-steps">
        {OB_STEPS.map((step) => {
          const isDone = !!wf[step.ts]
          const isReject = step.key === 'visit_approved' && wf.state === 'visit_rejected'
          return (
            <div key={step.key} className={`td__ob-step ${isDone ? 'td__ob-step--done' : isReject ? 'td__ob-step--rejected' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isDone ? 'check_circle' : isReject ? 'cancel' : 'radio_button_unchecked'}
              </span>
              <span>{step.label}</span>
            </div>
          )
        })}
      </div>

      <div className="td__ob-action-area">
        <p className="td__ob-next">{action.text}</p>
        {action.cta && (
          <PrimaryButton fullWidth icon="arrow_forward" onClick={() => navigate(action.route)}>
            {action.cta}
          </PrimaryButton>
        )}
      </div>
    </GlassCard>
  )
}

export default function TenantDashboard() {
  const { user, role } = useRole()
  const navigate = useNavigate()
  const { handleTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('home')
  const [agreementOpen, setAgreementOpen] = useState(true)

  if (!user) return null

  const [myProperty, setMyProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workflows, setWorkflows] = useState([])
  const [rentPayment, setRentPayment] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchPropertiesByTenant()
      .then(props => {
        setMyProperty(props?.[0] || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    fetchOnboardingWorkflows()
      .then(wfs => setWorkflows(wfs || []))
      .catch(() => setWorkflows([]))
    fetchPayments({ type: 'rent' })
      .then((payments) => {
        const next = (payments || []).find((p) => p.status === 'pending' || p.status === 'overdue')
        setRentPayment(next || null)
      })
      .catch(() => setRentPayment(null))
  }, [user?.id])

  const rentDue = rentPayment?.amount || (myProperty ? myProperty.rent + (myProperty.maintenance_charges || 0) : 0)
  const rentStatus = rentPayment?.status || 'paid'
  const dueDate = rentPayment?.dueDate ? new Date(rentPayment.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : null

  const onTabChange = (tab) => {
    setActiveTab(tab)
    handleTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle={`Hello, ${user?.name?.split(' ')[0] || ''}`}
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav role="tenant" activeTab={activeTab} onTabChange={onTabChange} badges={{}} />
      }
    >
      <div className="tenant-dash stagger-children">
        {/* ── Welcome ── */}
        <div className="td__welcome animate-slide-down">
          <h1 className="td__welcome-title">Welcome Back</h1>
          <p className="td__welcome-sub">Manage your rental and services</p>
        </div>

        {/* ── Onboarding Cards ── */}
        {workflows.filter(wf => wf.state !== 'tenant_activated').map(wf => (
          <OnboardingCard key={wf.id} wf={wf} navigate={navigate} />
        ))}

        {/* ── Rent Due Card ── */}
        <GlassCard className="td__rent-card animate-slide-up">
          <div className="td__rent-top">
            <div className="td__rent-heading">
              <span className="material-symbols-outlined td__rent-icon">info</span>
              <h2 className="td__rent-title">Rent Due</h2>
            </div>
            <StatusBadge status={rentStatus === 'overdue' ? 'overdue' : rentStatus === 'pending' ? 'pending' : 'verified'}>
              {rentStatus.toUpperCase()}
            </StatusBadge>
          </div>

          {rentPayment ? (
            <>
              <p className="td__rent-label">Amount</p>
              <p className="td__rent-amount">₹{rentDue.toLocaleString('en-IN')}</p>

              <div className="td__rent-row">
                <span className="td__rent-label">Due Date</span>
                <span className="td__rent-date">{dueDate || '—'}</span>
              </div>

              <button
                className="td__pay-btn"
                onClick={() => navigate('/pay', { state: { mode: 'rent', payment: rentPayment, property: myProperty } })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>credit_card</span>
                Pay Now
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--text-secondary)' }}>
              <p style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--status-success)' }}>All caught up!</p>
              <p style={{ fontSize: 'var(--fs-caption)' }}>No pending rent dues right now.</p>
            </div>
          )}
        </GlassCard>

        {/* ── Service Marketplace ── */}
        <div>
          <div className="section-heading-row">
            <h2 className="section-heading">Service Marketplace</h2>
            <button className="section-link" onClick={() => navigate('/services')}>View All →</button>
          </div>
          <div className="td__services-grid">
            {SERVICES.map((s) => (
              <button
                key={s.key}
                className="td__service-card"
                onClick={() => navigate(`/book-service/${s.key}`)}
              >
                <div className="td__service-icon-wrap">
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{s.icon}</span>
                </div>
                <span className="td__service-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── My Agreement ── */}
        {myProperty && (
        <GlassCard className="td__agreement-card animate-slide-up">
          <button className="td__agreement-header" onClick={() => setAgreementOpen(!agreementOpen)}>
            <div className="td__agreement-heading">
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--status-success)' }}>check_circle</span>
              <h2 className="td__agreement-title">My Agreement</h2>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-tertiary)', transform: agreementOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
          </button>

          {agreementOpen && (
            <div className="td__agreement-body">
              <div className="td__agreement-row">
                <div>
                  <p className="td__agreement-label">Property</p>
                  <p className="td__agreement-value">{myProperty.name}</p>
                </div>
              </div>
              <div className="td__agreement-row">
                <div>
                  <p className="td__agreement-label">Tenant</p>
                  <p className="td__agreement-value">{user?.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="td__agreement-label">Status</p>
                  <p className="td__agreement-status">Signed</p>
                </div>
              </div>
              <div className="td__agreement-actions">
                <button className="td__agreement-btn" onClick={() => navigate(`/agreement/${myProperty.id}`)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                  View Agreement
                </button>
                <button className="td__agreement-btn td__agreement-btn--danger">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                  Notice to Vacate
                </button>
              </div>
            </div>
          )}
        </GlassCard>
        )}

        {/* ── Quick Action Cards ── */}
        <div className="td__action-grid">
          <GlassCard interactive className="td__action-card" onClick={() => navigate('/browse')}>
            <span className="material-symbols-outlined td__action-icon">real_estate_agent</span>
            <span className="td__action-label">Explore Properties</span>
          </GlassCard>
          <GlassCard interactive className="td__action-card" onClick={() => navigate('/services')}>
            <span className="material-symbols-outlined td__action-icon">handyman</span>
            <span className="td__action-label">Book Services</span>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
