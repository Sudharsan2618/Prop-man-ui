import { useNavigate, useLocation } from 'react-router-dom'
import { PageShell, SubPageHeader, GlassCard, PrimaryButton } from '../../components'
import './BookingConfirmed.css'

const NEXT_STEPS = [
  { icon: 'check_circle', label: 'Service Booked', done: true },
  { icon: 'person_pin', label: 'Provider Assigned', done: false },
  { icon: 'build', label: 'Service Completed', done: false },
  { icon: 'verified', label: 'Payment Verified', done: false },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BookingConfirmed() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const agreement = state.agreement
  const propertyName = state.propertyName || agreement?.property_name || 'Your Property'
  const rent = state.rent || agreement?.rent_amount || 0
  const moveInDate = state.moveInDate || agreement?.lease_start
  const refId = agreement?.id ? agreement.id.slice(-12).toUpperCase() : 'N/A'

  return (
    <PageShell
      header={<SubPageHeader title="Booking Confirmed" onBack={() => navigate('/')} />}
      stickyFooter={
        <PrimaryButton icon="arrow_forward" onClick={() => navigate('/')}>Go to Dashboard →</PrimaryButton>
      }
    >
      <div className="booking-confirm animate-fade-in">
        {/* Success Animation */}
        <div className="booking-confirm__hero">
          <div className="booking-confirm__check-ring animate-scale-in">
            <span className="material-symbols-outlined icon-filled booking-confirm__check-icon">check_circle</span>
          </div>
          <h1 className="booking-confirm__title">Booking Confirmed!</h1>
          <p className="booking-confirm__subtitle">
            Your service request has been confirmed. A provider will be assigned and you'll be notified with the schedule.
          </p>
        </div>

        {/* Summary Card */}
        <GlassCard variant="highlighted">
          <div className="booking-confirm__summary">
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">Property</span>
              <span className="booking-confirm__value">{propertyName}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">Move-in Date</span>
              <span className="booking-confirm__value">{formatDate(moveInDate)}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">Rent/month</span>
              <span className="booking-confirm__value" style={{ color: 'var(--primary)' }}>₹{rent.toLocaleString('en-IN')}</span>
            </div>
            <div className="booking-confirm__row">
              <span className="booking-confirm__label">Reference ID</span>
              <span className="booking-confirm__value" style={{ fontFamily: 'monospace' }}>{refId}</span>
            </div>
          </div>
        </GlassCard>

        {/* PDF Download */}
        <GlassCard interactive>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#EF4444', fontSize: '22px' }}>picture_as_pdf</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-medium)' }}>Rental Agreement (PDF)</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Signed — 2.4 MB</p>
            </div>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>download</span>
          </div>
        </GlassCard>

        {/* Next Steps Timeline */}
        <div>
          <h2 className="section-heading">Next Steps</h2>
          <div className="booking-confirm__timeline">
            {NEXT_STEPS.map((step, i) => (
              <div key={i} className={`booking-confirm__step ${step.done ? 'booking-confirm__step--done' : ''}`}>
                <div className="booking-confirm__step-dot">
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px' }}>
                    {step.done ? 'check_circle' : step.icon}
                  </span>
                </div>
                {i < NEXT_STEPS.length - 1 && <div className="booking-confirm__step-line" />}
                <span className="booking-confirm__step-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
