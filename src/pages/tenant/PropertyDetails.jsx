import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PageShell, GlassCard, PrimaryButton, SecondaryButton, StatusBadge, Avatar, Skeleton,
} from '../../components'
import { fetchMyVisits, fetchOnboardingWorkflows, fetchPropertyById, formatRent } from '../../services/api'
import './PropertyDetails.css'

const AMENITY_MAP = {
  parking: { icon: 'local_parking', label: 'Covered Parking' },
  pool: { icon: 'pool', label: 'Swimming Pool' },
  gym: { icon: 'fitness_center', label: 'Gymnasium' },
  security: { icon: 'security', label: '24/7 Security' },
  power_backup: { icon: 'bolt', label: 'Power Backup' },
  playground: { icon: 'park', label: 'Kids Play Area' },
  garden: { icon: 'yard', label: 'Landscaped Garden' },
}

const ONBOARDING_STEPS = [
  { key: 'visit_booked', label: 'Visit Booked', icon: 'event', ts: 'visit_booked_at' },
  { key: 'visit_approved', label: 'Visit Approved', icon: 'thumb_up', ts: 'visit_approved_at', rejKey: 'visit_rejected', rejTs: 'visit_rejected_at' },
  { key: 'agreement_generated', label: 'Agreement Ready', icon: 'description', ts: 'agreement_generated_at' },
  { key: 'tenant_signed', label: 'Agreement Signed', icon: 'draw', ts: 'tenant_signed_at' },
  { key: 'advance_submitted', label: 'Advance Submitted', icon: 'receipt_long', ts: 'advance_submitted_at' },
  { key: 'advance_approved', label: 'Advance Confirmed', icon: 'paid', ts: 'advance_approved_at' },
  { key: 'police_verification_completed', label: 'Police Verification', icon: 'verified_user', ts: 'police_verification_completed_at' },
  { key: 'original_agreement_uploaded', label: 'Original Agreement', icon: 'upload_file', ts: 'original_agreement_uploaded_at' },
  { key: 'tenant_activated', label: 'Move-in Ready', icon: 'how_to_reg', ts: 'tenant_activated_at' },
]

function OnboardingProgress({ workflow, navigate }) {
  const stateOrder = ONBOARDING_STEPS.map(s => s.key)
  const currentIdx = stateOrder.indexOf(workflow.state)

  return (
    <div className="pd__section">
      <h2 className="section-heading">Onboarding Progress</h2>
      <GlassCard className="pd__onboarding">
        {ONBOARDING_STEPS.map((step, idx) => {
          const isRejected = step.rejKey && workflow.state === step.rejKey
          const isDone = !!workflow[step.ts]
          const isActive = !isDone && !isRejected && idx === currentIdx + 1
          const status = isRejected ? 'rejected' : isDone ? 'done' : isActive ? 'active' : 'pending'

          return (
            <div key={step.key} className={`pd__ob-step pd__ob-step--${status}`}>
              <span className={`pd__ob-icon pd__ob-icon--${status}`}>
                <span className="material-symbols-outlined">
                  {status === 'done' ? 'check_circle' : status === 'rejected' ? 'cancel' : status === 'active' ? step.icon : 'radio_button_unchecked'}
                </span>
              </span>
              <span className={`pd__ob-label ${status === 'pending' ? 'pd__ob-label--dim' : ''}`}>{step.label}</span>
            </div>
          )
        })}
        {workflow.agreement_id && workflow.state !== 'visit_rejected' && (
          <button className="pd__ob-action" onClick={() => navigate(`/agreement/${workflow.agreement_id}`)}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
            View Agreement
          </button>
        )}
      </GlassCard>
    </div>
  )
}

export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [fav, setFav] = useState(false)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [myVisits, setMyVisits] = useState([])
  const [workflow, setWorkflow] = useState(null)

  useEffect(() => {
    fetchPropertyById(id)
      .then((p) => { setProperty(p); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchMyVisits().then(setMyVisits).catch(() => setMyVisits([]))
    fetchOnboardingWorkflows({ property_id: id })
      .then(wfs => setWorkflow(wfs?.[0] || null))
      .catch(() => setWorkflow(null))
  }, [id])

  if (loading) return (
    <PageShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Skeleton height="260px" radius={0} />
        <Skeleton height="80px" radius="var(--radius-xl)" style={{ margin: '0 var(--space-4)' }} />
        <Skeleton height="180px" radius="var(--radius-xl)" style={{ margin: '0 var(--space-4)' }} />
      </div>
    </PageShell>
  )

  if (!property) return (
    <PageShell>
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Property not found</p>
        <PrimaryButton onClick={() => navigate(-1)} style={{ marginTop: 'var(--space-4)' }}>Go Back</PrimaryButton>
      </div>
    </PageShell>
  )

  const images = property.images || [property.image]
  const bookedVisit = myVisits.find((visit) => visit.status === 'booked' && visit.property_id === id)

  const formatDate = (d) => {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const formatTime = (t) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`
  }

  return (
    <PageShell
      stickyFooter={
        <div className="pd-footer">
          <div className="pd-footer__price">
            <span className="pd-footer__label">Total Price</span>
            <span className="pd-footer__amount">{formatRent(property.rent)}</span>
          </div>
          <PrimaryButton fullWidth={false} onClick={() => {
            navigate(`/book-visit/${property.id}`)
          }}>
            {bookedVisit ? 'Reschedule Visit' : 'Schedule Visit'}
          </PrimaryButton>
        </div>
      }
    >
      <div className="pd">
        {/* ── Image Gallery ── */}
        <div className="pd__gallery">
          <img src={images[imgIdx]} alt={property.name} className="pd__hero-img" />
          <div className="pd__gallery-overlay">
            <button className="pd__gallery-btn" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="pd__gallery-actions">
              <button className="pd__gallery-btn" onClick={() => setFav(!fav)}>
                <span className={`material-symbols-outlined ${fav ? 'icon-filled' : ''}`} style={fav ? { color: 'var(--status-danger)' } : undefined}>favorite</span>
              </button>
              <button className="pd__gallery-btn">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
          <span className="pd__photo-count">{imgIdx + 1}/{images.length}</span>
          {images.length > 1 && (
            <div className="pd__gallery-dots">
              {images.map((_, i) => (
                <button key={i} className={`pd__dot ${i === imgIdx ? 'pd__dot--active' : ''}`} onClick={() => setImgIdx(i)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Title & Price ── */}
        <div className="pd__section">
          <h1 className="pd__title">{property.name}</h1>
          <div className="pd__location">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
            <span>{property.address}</span>
          </div>
          <div className="pd__price-row">
            <span className="pd__price">{formatRent(property.rent)}</span>
            <span className="pd__deposit">Security: ₹{(property.security_deposit || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="pd__stats">
          {[
            { icon: 'bed', label: property.bhk },
            { icon: 'square_foot', label: `${property.sqft} Sqft` },
            { icon: 'stairs', label: `Floor ${property.floor}` },
            { icon: 'explore', label: `${property.facing} facing` },
          ].map((s, i) => (
            <div key={i} className="pd__stat-pill">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── About ── */}
        <div className="pd__section">
          <h2 className="section-heading">About</h2>
          <p className={`pd__desc ${showFullDesc ? '' : 'pd__desc--clamped'}`}>{property.description}</p>
          {property.description && property.description.length > 120 && (
            <button className="pd__read-more" onClick={() => setShowFullDesc(!showFullDesc)}>
              {showFullDesc ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {bookedVisit && (
          <div className="pd__section">
            <h2 className="section-heading">Meeting Booked</h2>
            <GlassCard className="pd__visit-card">
              <div className="pd__visit-header">
                <StatusBadge status="pending">Booked</StatusBadge>
                <span className="pd__visit-time">
                  {formatDate(bookedVisit.slot_date)} · {formatTime(bookedVisit.start_time)} — {formatTime(bookedVisit.end_time)}
                </span>
              </div>
              <p className="pd__visit-note">Need a different time? Tap <strong>Reschedule Visit</strong> below.</p>
            </GlassCard>
          </div>
        )}

        {workflow && <OnboardingProgress workflow={workflow} navigate={navigate} />}

        {/* ── Amenities ── */}
        <div className="pd__section">
          <h2 className="section-heading">Amenities</h2>
          <div className="pd__amenities-grid">
            {property.amenities.slice(0, 6).map((a) => {
              const info = AMENITY_MAP[a] || { icon: 'check_circle', label: a }
              return (
                <div key={a} className="pd__amenity">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>{info.icon}</span>
                  <span className="pd__amenity-label">{info.label}</span>
                </div>
              )
            })}
          </div>
          {property.amenities.length > 6 && (
            <SecondaryButton fullWidth>View all {property.amenities.length} amenities</SecondaryButton>
          )}
        </div>

        {/* ── Owner Info ── */}
        <div className="pd__section">
          <h2 className="section-heading">Property Owner</h2>
          <GlassCard>
            <div className="pd__owner-row">
              <Avatar initials="RM" size="md" verified />
              <div className="pd__owner-info">
                <p style={{ fontWeight: 'var(--fw-semibold)' }}>Rajesh Mehta</p>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Property Owner • Rents usually in 2 days</p>
              </div>
              <button className="pd__chat-btn" onClick={() => navigate('/messaging')}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>chat</span>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
