import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, AppHeader, BottomNav, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Skeleton,
} from '../../components'
import { useRole } from '../../context/RoleContext'
import {
  fetchVisitRequests,
  fetchVisitRequest,
  proposeVisitTime,
  acceptVisitProposal,
  rejectVisitProposal,
  rescheduleVisit,
  cancelVisit,
  approveVisit,
  rejectVisit,
} from '../../services/api'
import './ManagerVisits.css'

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

function todayISO() { return new Date().toISOString().slice(0, 10) }
function visitDateHasPassed(v) {
  // scheduled_date is "YYYY-MM-DD"; show the post-visit actions on the visit
  // day itself so the manager can mark approve/reject as soon as the walkthrough
  // is done (not the next day).
  if (!v?.scheduled_date) return false
  return v.scheduled_date <= todayISO()
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}
function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${ampm}`
}

export default function ManagerVisits() {
  const navigate = useNavigate()
  const { user, role } = useRole()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')   // 'pending' | 'all'
  const [expandedId, setExpandedId] = useState(null)
  const [expandedDetail, setExpandedDetail] = useState(null)
  const [busy, setBusy] = useState(false)

  // Counter-proposal form state (per-row)
  const [counterMode, setCounterMode] = useState(false)
  // 'counter' when in a NEGOTIATING flow; 'reschedule' when re-opening a CONFIRMED visit.
  const [counterIntent, setCounterIntent] = useState('counter')
  const [cDate, setCDate] = useState(todayISO())
  const [cStart, setCStart] = useState('10:00')
  const [cEnd, setCEnd] = useState('11:00')
  const [cMsg, setCMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const items = await fetchVisitRequests({ limit: 100 })
      setList(items || [])
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = list.filter((v) => {
    if (filter === 'pending') return ['pending', 'negotiating'].includes(v.status)
    return true
  })

  const expand = async (visit) => {
    if (expandedId === visit.id) {
      setExpandedId(null); setExpandedDetail(null); setCounterMode(false); return
    }
    setExpandedId(visit.id); setCounterMode(false)
    try {
      const full = await fetchVisitRequest(visit.id)
      setExpandedDetail(full)
      const cur = full?.proposals?.find((p) => p.response === 'pending')
      if (cur) {
        setCDate(cur.proposed_date)
        setCStart(cur.proposed_start_time)
        setCEnd(cur.proposed_end_time)
      }
    } catch (e) { setError(e.message) }
  }

  const onAccept = async (id) => {
    setBusy(true); setError('')
    try { await acceptVisitProposal(id); await load() }
    catch (e) { setError(e.message) }
    setBusy(false); setExpandedId(null)
  }

  const onReject = async (id) => {
    const reason = window.prompt('Reason for rejecting this visit request?')
    if (!reason) return
    setBusy(true); setError('')
    try { await rejectVisitProposal(id, { reason }); await load() }
    catch (e) { setError(e.message) }
    setBusy(false); setExpandedId(null)
  }

  const onCancel = async (id) => {
    if (!window.confirm('Cancel this visit?')) return
    setBusy(true); setError('')
    try { await cancelVisit(id, { reason: 'Cancelled by manager' }); await load() }
    catch (e) { setError(e.message) }
    setBusy(false); setExpandedId(null)
  }

  const onApproveTenant = async (id) => {
    if (!window.confirm('Approve the tenant after this visit? This will auto-generate the rental agreement.')) return
    const notes = window.prompt('Notes for this approval (optional):', '') ?? ''
    setBusy(true); setError('')
    try { await approveVisit(id, { notes: notes.trim() || null }); await load() }
    catch (e) { setError(e.message) }
    setBusy(false); setExpandedId(null)
  }

  const onRejectTenant = async (id) => {
    const reason = window.prompt('Reason for rejecting the tenant after this visit?')
    if (!reason || !reason.trim()) return
    setBusy(true); setError('')
    try { await rejectVisit(id, { rejection_reason: reason.trim() }); await load() }
    catch (e) { setError(e.message) }
    setBusy(false); setExpandedId(null)
  }

  const onSendCounter = async (id) => {
    if (cEnd <= cStart) { setError('End time must be after start time'); return }
    setBusy(true); setError('')
    try {
      const payload = {
        proposed_date: cDate, start_time: cStart, end_time: cEnd, message: cMsg || null,
      }
      if (counterIntent === 'reschedule') {
        await rescheduleVisit(id, payload)
      } else {
        await proposeVisitTime(id, payload)
      }
      setCounterMode(false); setCMsg('')
      await load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const startReschedule = () => { setCounterIntent('reschedule'); setCounterMode(true) }
  const startCounter = () => { setCounterIntent('counter'); setCounterMode(true) }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Visit Requests"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={<BottomNav role={role} />}
    >
      <div className="mvisits stagger-children">
        {error && (
          <div className="mvisits__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mvisits__filter">
          <button
            className={`mvisits__chip ${filter === 'pending' ? 'mvisits__chip--active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Needs Response
          </button>
          <button
            className={`mvisits__chip ${filter === 'all' ? 'mvisits__chip--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>

        {loading && (
          <div className="mvisits__list">
            {[1,2,3].map(i => <Skeleton key={i} height="120px" radius="var(--radius-xl)" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <GlassCard className="mvisits__empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>event_busy</span>
            <p>No visit requests right now.</p>
          </GlassCard>
        )}

        {!loading && filtered.map((v) => {
          const expanded = expandedId === v.id
          const detail = expanded ? expandedDetail : null
          const current = detail?.proposals?.find((p) => p.response === 'pending')
          const isMyTurn = detail && detail.pending_with && detail.pending_with !== 'tenant'
          return (
            <GlassCard key={v.id} interactive className="mvisits__row" onClick={() => expand(v)}>
              <div className="mvisits__row-head">
                <div className="mvisits__row-text">
                  <p className="mvisits__row-title">
                    {v.property_name || 'Unnamed property'}
                    {v.tenant_name && <span className="mvisits__row-tenant"> · {v.tenant_name}</span>}
                  </p>
                  <p className="mvisits__row-sub">
                    {v.scheduled_date
                      ? `${formatDate(v.scheduled_date)} · ${formatTime(v.scheduled_start_time)}–${formatTime(v.scheduled_end_time)}`
                      : v.requested_date
                        ? `Requested: ${formatDate(v.requested_date)} · ${formatTime(v.requested_start_time)}–${formatTime(v.requested_end_time)}`
                        : '—'}
                  </p>
                </div>
                {expanded && expandedDetail?.status === 'confirmed' && !counterMode && (
                  <div className="mvisits__inline-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="mvisits__btn-inline" onClick={startReschedule} disabled={busy}>
                      <span className="material-symbols-outlined">edit_calendar</span>
                      Reschedule
                    </button>
                    <button type="button" className="mvisits__btn-inline mvisits__btn-inline--danger" onClick={() => onCancel(expandedDetail.id)} disabled={busy}>
                      <span className="material-symbols-outlined">close</span>
                      Cancel
                    </button>
                  </div>
                )}
                <StatusBadge status={STATUS_BADGE[v.status] || 'pending'}>
                  {STATUS_LABEL[v.status] || v.status}
                </StatusBadge>
              </div>

              {expanded && detail && (
                <div onClick={(e) => e.stopPropagation()} className="mvisits__expand">
                  {current && (
                    <div className="mvisits__proposal">
                      <p className="mvisits__proposal-when">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>schedule</span>
                        {formatDate(current.proposed_date)} · {formatTime(current.proposed_start_time)}–{formatTime(current.proposed_end_time)}
                      </p>
                      <p className="mvisits__proposal-by">
                        Proposed by {current.proposed_by_role.replace('_', ' ')}
                      </p>
                      {current.message && <p className="mvisits__proposal-msg">"{current.message}"</p>}
                    </div>
                  )}

                  {detail.status === 'negotiating' && isMyTurn && !counterMode && (
                    <div className="mvisits__actions">
                      <PrimaryButton icon="check" onClick={() => onAccept(detail.id)} disabled={busy}>Accept</PrimaryButton>
                      <SecondaryButton icon="edit_calendar" onClick={startCounter} disabled={busy}>Counter</SecondaryButton>
                      <SecondaryButton variant="danger" icon="close" onClick={() => onReject(detail.id)} disabled={busy}>Reject</SecondaryButton>
                    </div>
                  )}
                  {detail.status === 'negotiating' && !isMyTurn && (
                    <div className="mvisits__actions">
                      <SecondaryButton variant="danger" icon="close" onClick={() => onCancel(detail.id)} disabled={busy}>Cancel</SecondaryButton>
                    </div>
                  )}
                  {/* Reschedule / Cancel buttons for CONFIRMED visits live inline in the row head. */}

                  {/* Post-visit approval: shown on/after the scheduled day. Approve triggers
                      auto-generation of the rental agreement (BE: /visit-requests/:id/complete). */}
                  {(detail.status === 'confirmed' || detail.status === 'appointment_scheduled') && !counterMode && visitDateHasPassed(detail) && (
                    <div className="mvisits__actions">
                      <PrimaryButton icon="how_to_reg" onClick={() => onApproveTenant(detail.id)} disabled={busy}>Approve Tenant</PrimaryButton>
                      <SecondaryButton variant="danger" icon="block" onClick={() => onRejectTenant(detail.id)} disabled={busy}>Reject Tenant</SecondaryButton>
                    </div>
                  )}

                  {counterMode && (detail.status === 'negotiating' || detail.status === 'confirmed') && (
                    <div className="mvisits__form">
                      <div className="mvisits__form-row">
                        <label className="mvisits__form-field">
                          <span>Date</span>
                          <input type="date" min={todayISO()} value={cDate} onChange={(e) => setCDate(e.target.value)} />
                        </label>
                      </div>
                      <div className="mvisits__form-row mvisits__form-row--two">
                        <label className="mvisits__form-field">
                          <span>Start</span>
                          <input type="time" value={cStart} onChange={(e) => setCStart(e.target.value)} />
                        </label>
                        <label className="mvisits__form-field">
                          <span>End</span>
                          <input type="time" value={cEnd} onChange={(e) => setCEnd(e.target.value)} />
                        </label>
                      </div>
                      <label className="mvisits__form-field">
                        <span>Message (optional)</span>
                        <textarea rows={2} value={cMsg} onChange={(e) => setCMsg(e.target.value)} />
                      </label>
                      <div className="mvisits__form-actions">
                        <SecondaryButton onClick={() => setCounterMode(false)} disabled={busy}>Cancel</SecondaryButton>
                        <PrimaryButton icon="send" loading={busy} disabled={busy} onClick={() => onSendCounter(detail.id)}>
                          {counterIntent === 'reschedule' ? 'Send Reschedule' : 'Send Counter'}
                        </PrimaryButton>
                      </div>
                    </div>
                  )}

                  {detail.proposals && detail.proposals.length > 1 && (
                    <div className="mvisits__timeline">
                      <p className="mvisits__timeline-title">History</p>
                      {detail.proposals.map((p) => (
                        <div key={p.id} className={`mvisits__t-item mvisits__t-item--${p.response}`}>
                          <div className="mvisits__t-row">
                            <span className="mvisits__t-by">{p.proposed_by_role.replace('_', ' ')}</span>
                            <span className="mvisits__t-status">{p.response}</span>
                          </div>
                          <div className="mvisits__t-when">
                            {formatDate(p.proposed_date)} · {formatTime(p.proposed_start_time)}–{formatTime(p.proposed_end_time)}
                          </div>
                          {p.message && <div className="mvisits__t-msg">"{p.message}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>
    </PageShell>
  )
}
