import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Skeleton,
} from '../../components'
import { fetchCalendarSlots, bookVisitSlot, fetchMyVisits, cancelVisitBooking } from '../../services/api'
import './BookVisit.css'

export default function BookVisit() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [slots, setSlots] = useState([])
  const [myVisits, setMyVisits] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSuccessTick, setShowSuccessTick] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchCalendarSlots({ status: 'available' }),
      fetchMyVisits(),
    ]).then(([available, visits]) => {
      setSlots(available)
      setMyVisits(visits)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleBookSlot = async () => {
    if (!propertyId) { setError('Property ID is required'); return }
    if (!selectedSlot) { setError('Please select a slot first'); return }
    setError('')
    setBooking(true)
    try {
      const currentVisit = myVisits.find((visit) => (
        visit.status === 'booked' && visit.property_id === propertyId
      ))
      if (currentVisit?.id) {
        await cancelVisitBooking(currentVisit.id)
      }

      await bookVisitSlot(selectedSlot.id, propertyId)
      setSuccess('Visit booked successfully! Redirecting...')
      setShowSuccessTick(true)
      setTimeout(() => {
        navigate(`/property/${propertyId}`)
      }, 1200)
    } catch (e) { setError(e.message) }
    setBooking(false)
  }

  const handleCancelBooking = async (slotId) => {
    try {
      await cancelVisitBooking(slotId)
      const [available, visits] = await Promise.all([
        fetchCalendarSlots({ status: 'available' }),
        fetchMyVisits(),
      ])
      setSlots(available)
      setMyVisits(visits)
    } catch (e) { setError(e.message) }
  }

  // Group slots by date
  const grouped = slots.reduce((acc, slot) => {
    const d = slot.slot_date
    if (!acc[d]) acc[d] = []
    acc[d].push(slot)
    return acc
  }, {})
  const dateKeys = Object.keys(grouped).sort()

  const formatTime = (t) => {
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${ampm}`
  }

  const formatDate = (d) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const bookedVisits = myVisits.filter(v => v.status === 'booked')
  const completedVisits = myVisits.filter(v => v.status === 'completed')
  const activeVisitForProperty = bookedVisits.find(v => v.property_id === propertyId)

  return (
    <PageShell
      header={<SubPageHeader title="Book Property Visit" onBack={() => navigate(-1)} />}
      stickyFooter={
        <GlassCard className="bvisit__book-cta">
          <div className="bvisit__book-meta">
            {selectedSlot ? (
              <p className="bvisit__selected-copy">
                Selected: {formatDate(selectedSlot.slot_date)} · {formatTime(selectedSlot.start_time)} — {formatTime(selectedSlot.end_time)}
              </p>
            ) : (
              <p className="bvisit__selected-copy">Select a slot to continue</p>
            )}
            {activeVisitForProperty && (
              <p className="bvisit__reschedule-copy">
                Existing booking will be replaced after confirmation.
              </p>
            )}
          </div>
          <div className="bvisit__book-action">
            <PrimaryButton
              fullWidth={false}
              icon={showSuccessTick ? 'check_circle' : 'event_available'}
              loading={booking}
              disabled={booking || !selectedSlot}
              onClick={handleBookSlot}
            >
              {activeVisitForProperty ? 'Reschedule Visit' : 'Book Visit'}
            </PrimaryButton>
          </div>
        </GlassCard>
      }
    >
      <div className="bvisit animate-fade-in">
        {/* Error / Success */}
        {error && (
          <div className="bvisit__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bvisit__success">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {showSuccessTick && (
          <GlassCard className="bvisit__tick-card">
            <span className="material-symbols-outlined">check_circle</span>
            <p>Visit Confirmed</p>
          </GlassCard>
        )}

        {/* My Active Bookings */}
        {bookedVisits.length > 0 && (
          <div>
            <p className="bvisit__section-title">Your Upcoming Visits</p>
            {bookedVisits.map(v => (
              <GlassCard key={v.id} className="bvisit__booking-card">
                <div className="bvisit__booking-row">
                  <div>
                    <p style={{ fontWeight: 'var(--fw-semibold)' }}>{formatDate(v.slot_date)}</p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                      {formatTime(v.start_time)} — {formatTime(v.end_time)}
                    </p>
                  </div>
                  <StatusBadge status="pending">Booked</StatusBadge>
                </div>
                <SecondaryButton variant="danger" icon="close" onClick={() => handleCancelBooking(v.id)}>
                  Cancel Visit
                </SecondaryButton>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Completed Visits */}
        {completedVisits.length > 0 && (
          <div>
            <p className="bvisit__section-title">Past Visits</p>
            {completedVisits.map(v => (
              <GlassCard key={v.id} className="bvisit__booking-card">
                <div className="bvisit__booking-row">
                  <div>
                    <p style={{ fontWeight: 'var(--fw-semibold)' }}>{formatDate(v.slot_date)}</p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                      {formatTime(v.start_time)} — {formatTime(v.end_time)}
                    </p>
                  </div>
                  <StatusBadge status={v.visit_result === 'approved' ? 'verified' : v.visit_result === 'rejected' ? 'overdue' : 'pending'}>
                    {v.visit_result === 'approved' ? 'Approved ✅' : v.visit_result === 'rejected' ? 'Not Approved' : 'Pending Review'}
                  </StatusBadge>
                </div>
                {v.visit_result === 'approved' && v.property_id && (
                  <PrimaryButton
                    icon="description"
                    onClick={() => navigate(`/agreement/${v.agreement_id || v.property_id}`)}
                  >
                    View Agreement
                  </PrimaryButton>
                )}
                {v.rejection_reason && (
                  <p style={{ fontSize: '11px', color: 'var(--status-danger)', marginTop: 'var(--space-2)' }}>
                    Reason: {v.rejection_reason}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {/* Available Slots */}
        <div>
          <p className="bvisit__section-title">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle' }}>calendar_month</span>
            {' '}Available Visit Slots
          </p>

          {loading ? (
            <div className="bvisit__slots-list">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height="80px" radius="var(--radius-xl)" />
              ))}
            </div>
          ) : dateKeys.length === 0 ? (
            <div className="bvisit__empty">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>event_busy</span>
              <p>No slots available right now</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Check back later for new availability</p>
            </div>
          ) : (
            <div className="bvisit__slots-list">
              {dateKeys.map(d => (
                <div key={d}>
                  <p className="bvisit__date-header">{formatDate(d)}</p>
                  <div className="bvisit__time-grid">
                    {grouped[d].map(slot => (
                      <GlassCard
                        key={slot.id}
                        interactive
                        className={`bvisit__time-card ${selectedSlot?.id === slot.id ? 'bvisit__time-card--selected' : ''}`}
                        onClick={() => !booking && setSelectedSlot(slot)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>schedule</span>
                        <p style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}>
                          {formatTime(slot.start_time)}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          to {formatTime(slot.end_time)}
                        </p>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageShell>
  )
}
