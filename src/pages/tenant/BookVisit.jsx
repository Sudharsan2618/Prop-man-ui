import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Skeleton,
} from '../../components'
import {
  createVisitRequest,
  fetchMyVisits,
  fetchVisitRequest,
  proposeVisitTime,
  acceptVisitProposal,
  rejectVisitProposal,
  rescheduleVisit,
  cancelVisit,
} from '../../services/api'
import { useRole } from '../../context/RoleContext'
import './BookVisit.css'

const STATUS_LABEL = {
  pending: 'Pending',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  appointment_scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

const STATUS_BADGE = {
  pending: 'pending',
  negotiating: 'pending',
  confirmed: 'verified',
  appointment_scheduled: 'verified',
  completed: 'verified',
  cancelled: 'overdue',
  rejected: 'overdue',
}

const isOpen = (s) => ['pending', 'negotiating', 'confirmed', 'appointment_scheduled'].includes(s)

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatTimeLabel(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${ampm}`
}

export default function BookVisit() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const { user } = useRole()

  const [activeVisit, setActiveVisit] = useState(null)  // open visit for this property
  const [pastVisits, setPastVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Form state — used for create / counter-propose / reschedule
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('create')  // 'create' | 'counter' | 'reschedule'
  const [formDate, setFormDate] = useState(todayISO())
  const [formStart, setFormStart] = useState('10:00')
  const [formEnd, setFormEnd] = useState('11:00')
  const [formMessage, setFormMessage] = useState('')

  const loadVisits = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await fetchMyVisits()
      const forThisProp = items.filter((v) => v.property_id === propertyId)
      const open = forThisProp.find((v) => isOpen(v.status))
      const past = forThisProp.filter((v) => !isOpen(v.status))

      // Fetch full proposals for the open one
      if (open) {
        const full = await fetchVisitRequest(open.id)
        setActiveVisit(full)
      } else {
        setActiveVisit(null)
      }
      setPastVisits(past)
    } catch (e) {
      setError(e.message || 'Failed to load visits')
    }
    setLoading(false)
  }, [propertyId])

  useEffect(() => { loadVisits() }, [loadVisits])

  const openForm = (mode) => {
    setFormMode(mode)
    // Prefill from current proposal if we have one
    const cur = activeVisit?.proposals?.find((p) => p.response === 'pending')
    if (cur) {
      setFormDate(cur.proposed_date)
      setFormStart(cur.proposed_start_time)
      setFormEnd(cur.proposed_end_time)
    } else {
      setFormDate(todayISO())
      setFormStart('10:00')
      setFormEnd('11:00')
    }
    setFormMessage('')
    setShowForm(true)
  }

  const submitForm = async () => {
    setError('')
    if (!formDate || !formStart || !formEnd) {
      setError('Pick a date, start time, and end time.')
      return
    }
    if (formEnd <= formStart) {
      setError('End time must be after start time.')
      return
    }
    setBusy(true)
    try {
      if (formMode === 'create') {
        await createVisitRequest({
          property_id: propertyId,
          requested_date: formDate,
          start_time: formStart,
          end_time: formEnd,
          message: formMessage || null,
        })
      } else if (formMode === 'counter') {
        await proposeVisitTime(activeVisit.id, {
          proposed_date: formDate,
          start_time: formStart,
          end_time: formEnd,
          message: formMessage || null,
        })
      } else if (formMode === 'reschedule') {
        await rescheduleVisit(activeVisit.id, {
          proposed_date: formDate,
          start_time: formStart,
          end_time: formEnd,
          message: formMessage || null,
        })
      }
      setShowForm(false)
      await loadVisits()
    } catch (e) {
      setError(e.message || 'Could not submit')
    }
    setBusy(false)
  }

  const onAccept = async () => {
    setBusy(true); setError('')
    try {
      await acceptVisitProposal(activeVisit.id)
      await loadVisits()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const onReject = async () => {
    const reason = window.prompt('Reason for rejecting this proposal?')
    if (!reason) return
    setBusy(true); setError('')
    try {
      await rejectVisitProposal(activeVisit.id, { reason })
      await loadVisits()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const onCancel = async () => {
    if (!window.confirm('Cancel this visit request?')) return
    setBusy(true); setError('')
    try {
      await cancelVisit(activeVisit.id, { reason: 'Cancelled by tenant' })
      await loadVisits()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  // Who has the next turn?
  const currentProposal = activeVisit?.proposals?.find((p) => p.response === 'pending')
  const pendingWith = activeVisit?.pending_with  // 'tenant' | 'manager' | 'super_admin' | null
  const isMyTurn = pendingWith === 'tenant'

  return (
    <PageShell header={<SubPageHeader title="Book Property Visit" onBack={() => navigate(-1)} />}>
      <div className="bvisit animate-fade-in">
        {error && (
          <div className="bvisit__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="bvisit__slots-list">
            {[1, 2].map((i) => <Skeleton key={i} height="120px" radius="var(--radius-xl)" />)}
          </div>
        )}

        {/* No open request → create form */}
        {!loading && !activeVisit && !showForm && (
          <GlassCard className="bvisit__empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>event_available</span>
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>Ready to visit?</p>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              Propose a date and time that works for you. Our team will respond.
            </p>
            <PrimaryButton icon="add" onClick={() => openForm('create')}>Request a Visit</PrimaryButton>
          </GlassCard>
        )}

        {/* Open request — status card */}
        {!loading && activeVisit && (
          <GlassCard className="bvisit__active">
            <div className="bvisit__active-head">
              <div>
                <p className="bvisit__active-title">
                  Visit · {STATUS_LABEL[activeVisit.status] || activeVisit.status}
                </p>
                <p className="bvisit__active-sub">
                  {activeVisit.status === 'confirmed'
                    ? `Confirmed for ${formatDateLabel(activeVisit.scheduled_date)} · ${formatTimeLabel(activeVisit.scheduled_start_time)}–${formatTimeLabel(activeVisit.scheduled_end_time)}`
                    : isMyTurn
                      ? 'Your turn — review the proposal below.'
                      : pendingWith
                        ? 'Waiting on the other party…'
                        : ''}
                </p>
              </div>
              <StatusBadge status={STATUS_BADGE[activeVisit.status] || 'pending'}>
                {STATUS_LABEL[activeVisit.status] || activeVisit.status}
              </StatusBadge>
            </div>

            {/* Current open proposal */}
            {currentProposal && (
              <div className={`bvisit__proposal ${currentProposal.proposed_by_role === 'tenant' ? 'bvisit__proposal--me' : ''}`}>
                <div className="bvisit__proposal-when">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>schedule</span>
                  <span>
                    {formatDateLabel(currentProposal.proposed_date)} · {formatTimeLabel(currentProposal.proposed_start_time)} – {formatTimeLabel(currentProposal.proposed_end_time)}
                  </span>
                </div>
                <p className="bvisit__proposal-by">
                  Proposed by {currentProposal.proposed_by_role === 'tenant' ? 'you' : currentProposal.proposed_by_role.replace('_', ' ')}
                </p>
                {currentProposal.message && <p className="bvisit__proposal-msg">"{currentProposal.message}"</p>}
              </div>
            )}

            {/* Actions */}
            {activeVisit.status === 'negotiating' && isMyTurn && (
              <div className="bvisit__actions">
                <PrimaryButton icon="check" onClick={onAccept} disabled={busy}>Accept</PrimaryButton>
                <SecondaryButton icon="edit_calendar" onClick={() => openForm('counter')} disabled={busy}>
                  Propose Different Time
                </SecondaryButton>
                <SecondaryButton variant="danger" icon="close" onClick={onReject} disabled={busy}>
                  Decline
                </SecondaryButton>
              </div>
            )}
            {activeVisit.status === 'negotiating' && !isMyTurn && (
              <div className="bvisit__actions">
                <SecondaryButton variant="danger" icon="close" onClick={onCancel} disabled={busy}>
                  Cancel Request
                </SecondaryButton>
              </div>
            )}
            {activeVisit.status === 'confirmed' && (
              <div className="bvisit__actions">
                <SecondaryButton icon="edit_calendar" onClick={() => openForm('reschedule')} disabled={busy}>
                  Reschedule
                </SecondaryButton>
                <SecondaryButton variant="danger" icon="close" onClick={onCancel} disabled={busy}>
                  Cancel
                </SecondaryButton>
              </div>
            )}

            {/* Timeline */}
            {activeVisit.proposals && activeVisit.proposals.length > 1 && (
              <div className="bvisit__timeline">
                <p className="bvisit__timeline-title">Negotiation history</p>
                {activeVisit.proposals.map((p) => (
                  <div key={p.id} className={`bvisit__t-item bvisit__t-item--${p.response}`}>
                    <div className="bvisit__t-row">
                      <span className="bvisit__t-by">{p.proposed_by_role === 'tenant' ? 'You' : p.proposed_by_role.replace('_', ' ')}</span>
                      <span className="bvisit__t-status">{p.response}</span>
                    </div>
                    <div className="bvisit__t-when">
                      {formatDateLabel(p.proposed_date)} · {formatTimeLabel(p.proposed_start_time)}–{formatTimeLabel(p.proposed_end_time)}
                    </div>
                    {p.message && <div className="bvisit__t-msg">"{p.message}"</div>}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Inline form (create / counter / reschedule) */}
        {showForm && (
          <GlassCard className="bvisit__form">
            <p className="bvisit__form-title">
              {formMode === 'create' && 'Propose a Visit'}
              {formMode === 'counter' && 'Counter-propose'}
              {formMode === 'reschedule' && 'Reschedule'}
            </p>
            <div className="bvisit__form-row">
              <label className="bvisit__form-field">
                <span>Date</span>
                <input type="date" min={todayISO()} value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </label>
            </div>
            <div className="bvisit__form-row bvisit__form-row--two">
              <label className="bvisit__form-field">
                <span>Start time</span>
                <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </label>
              <label className="bvisit__form-field">
                <span>End time</span>
                <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </label>
            </div>
            <label className="bvisit__form-field">
              <span>Message (optional)</span>
              <textarea
                rows={2}
                placeholder="Any note for the property team?"
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
              />
            </label>
            <div className="bvisit__form-actions">
              <SecondaryButton onClick={() => setShowForm(false)} disabled={busy}>Cancel</SecondaryButton>
              <PrimaryButton icon="send" loading={busy} disabled={busy} onClick={submitForm}>
                {formMode === 'create' ? 'Send Request' : formMode === 'counter' ? 'Send Counter-Proposal' : 'Request Reschedule'}
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {/* Past visits */}
        {!loading && pastVisits.length > 0 && (
          <div>
            <p className="bvisit__section-title">Past visits for this property</p>
            {pastVisits.map((v) => (
              <GlassCard key={v.id} className="bvisit__booking-card">
                <div className="bvisit__booking-row">
                  <div>
                    <p style={{ fontWeight: 'var(--fw-semibold)' }}>
                      {formatDateLabel(v.scheduled_date || v.requested_date)}
                    </p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                      {v.scheduled_start_time
                        ? `${formatTimeLabel(v.scheduled_start_time)}–${formatTimeLabel(v.scheduled_end_time)}`
                        : '—'}
                    </p>
                  </div>
                  <StatusBadge status={STATUS_BADGE[v.status] || 'pending'}>
                    {STATUS_LABEL[v.status] || v.status}
                  </StatusBadge>
                </div>
                {v.rejection_reason && (
                  <p style={{ fontSize: '11px', color: 'var(--status-danger)', marginTop: 'var(--space-2)' }}>
                    {v.rejection_reason}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
