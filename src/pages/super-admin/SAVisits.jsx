import { useEffect, useState, useCallback } from 'react'
import SALayout from './SALayout'
import {
  GlassCard, PrimaryButton, SecondaryButton, StatusBadge, Skeleton,
} from '../../components'
import {
  fetchVisitRequests,
  fetchVisitRequest,
  proposeVisitTime,
  acceptVisitProposal,
  rejectVisitProposal,
  rescheduleVisit,
  cancelVisit,
} from '../../services/api'
import './SAVisits.css'

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

export default function SAVisits() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')
  const [expandedId, setExpandedId] = useState(null)
  const [expandedDetail, setExpandedDetail] = useState(null)
  const [busy, setBusy] = useState(false)

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
    try { await cancelVisit(id, { reason: 'Cancelled by super-admin' }); await load() }
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

  const startReschedule = () => {
    setCounterIntent('reschedule')
    setCounterMode(true)
  }

  const startCounter = () => {
    setCounterIntent('counter')
    setCounterMode(true)
  }

  return (
    <SALayout activeKey="visits" title="Visit Requests" subtitle="Properties without an assigned manager — your fallback queue">
      <div className="savisits">
        {error && (
          <div className="savisits__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="savisits__filter">
          <button
            className={`savisits__chip ${filter === 'pending' ? 'savisits__chip--active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Needs Response
          </button>
          <button
            className={`savisits__chip ${filter === 'all' ? 'savisits__chip--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>

        {loading && (
          <div className="savisits__list">
            {[1, 2, 3].map((i) => <Skeleton key={i} height="80px" radius="var(--radius-xl)" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <GlassCard className="savisits__empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>event_busy</span>
            <p>No visit requests in your fallback queue right now.</p>
          </GlassCard>
        )}

        {!loading && filtered.map((v) => {
          const expanded = expandedId === v.id
          const detail = expanded ? expandedDetail : null
          const current = detail?.proposals?.find((p) => p.response === 'pending')
          const isMyTurn = detail && detail.pending_with && detail.pending_with !== 'tenant'
          return (
            <GlassCard key={v.id} interactive className="savisits__row" onClick={() => expand(v)}>
              <div className="savisits__row-head">
                <div className="savisits__row-text">
                  <p className="savisits__row-title">
                    {v.property_name || 'Unnamed property'}
                    {v.tenant_name && <span className="savisits__row-tenant"> · {v.tenant_name}</span>}
                  </p>
                  <p className="savisits__row-sub">
                    {v.scheduled_date
                      ? `${formatDate(v.scheduled_date)} · ${formatTime(v.scheduled_start_time)}–${formatTime(v.scheduled_end_time)}`
                      : v.requested_date
                        ? `Requested ${formatDate(v.requested_date)} · ${formatTime(v.requested_start_time)}–${formatTime(v.requested_end_time)}`
                        : '—'}
                  </p>
                </div>
                {expanded && expandedDetail?.status === 'confirmed' && !counterMode && (
                  <div className="savisits__inline-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="savisits__btn-inline" onClick={startReschedule} disabled={busy}>
                      <span className="material-symbols-outlined">edit_calendar</span>
                      Reschedule
                    </button>
                    <button type="button" className="savisits__btn-inline savisits__btn-inline--danger" onClick={() => onCancel(expandedDetail.id)} disabled={busy}>
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
                <div onClick={(e) => e.stopPropagation()} className="savisits__expand">
                  {current && (
                    <div className="savisits__proposal">
                      <p className="savisits__proposal-when">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>schedule</span>
                        {formatDate(current.proposed_date)} · {formatTime(current.proposed_start_time)}–{formatTime(current.proposed_end_time)}
                      </p>
                      <p className="savisits__proposal-by">Proposed by {current.proposed_by_role.replace('_', ' ')}</p>
                      {current.message && <p className="savisits__proposal-msg">"{current.message}"</p>}
                    </div>
                  )}

                  {detail.status === 'negotiating' && isMyTurn && !counterMode && (
                    <div className="savisits__actions">
                      <PrimaryButton fullWidth={false} icon="check" onClick={() => onAccept(detail.id)} disabled={busy}>Accept</PrimaryButton>
                      <SecondaryButton fullWidth={false} icon="edit_calendar" onClick={startCounter} disabled={busy}>Counter</SecondaryButton>
                      <SecondaryButton fullWidth={false} variant="danger" icon="close" onClick={() => onReject(detail.id)} disabled={busy}>Reject</SecondaryButton>
                    </div>
                  )}
                  {detail.status === 'negotiating' && !isMyTurn && (
                    <div className="savisits__actions">
                      <SecondaryButton fullWidth={false} variant="danger" icon="close" onClick={() => onCancel(detail.id)} disabled={busy}>Cancel</SecondaryButton>
                    </div>
                  )}
                  {/* Reschedule / Cancel buttons for CONFIRMED visits live inline in the row head. */}

                  {counterMode && (detail.status === 'negotiating' || detail.status === 'confirmed') && (
                    <div className="savisits__form">
                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                        {counterIntent === 'reschedule'
                          ? 'Propose a new time. The other party will need to accept.'
                          : 'Propose a different time. The other party will be notified.'}
                      </p>
                      <div className="savisits__form-row">
                        <label className="savisits__form-field">
                          <span>Date</span>
                          <input type="date" min={todayISO()} value={cDate} onChange={(e) => setCDate(e.target.value)} />
                        </label>
                        <label className="savisits__form-field">
                          <span>Start</span>
                          <input type="time" value={cStart} onChange={(e) => setCStart(e.target.value)} />
                        </label>
                        <label className="savisits__form-field">
                          <span>End</span>
                          <input type="time" value={cEnd} onChange={(e) => setCEnd(e.target.value)} />
                        </label>
                      </div>
                      <label className="savisits__form-field">
                        <span>Message (optional)</span>
                        <textarea rows={2} value={cMsg} onChange={(e) => setCMsg(e.target.value)} />
                      </label>
                      <div className="savisits__form-actions">
                        <SecondaryButton fullWidth={false} onClick={() => setCounterMode(false)} disabled={busy}>Cancel</SecondaryButton>
                        <PrimaryButton fullWidth={false} icon="send" loading={busy} disabled={busy} onClick={() => onSendCounter(detail.id)}>
                          {counterIntent === 'reschedule' ? 'Send Reschedule' : 'Send Counter'}
                        </PrimaryButton>
                      </div>
                    </div>
                  )}

                  {detail.proposals && detail.proposals.length > 1 && (
                    <div className="savisits__timeline">
                      <p className="savisits__timeline-title">History</p>
                      {detail.proposals.map((p) => (
                        <div key={p.id} className={`savisits__t-item savisits__t-item--${p.response}`}>
                          <div className="savisits__t-row">
                            <span className="savisits__t-by">{p.proposed_by_role.replace('_', ' ')}</span>
                            <span className="savisits__t-status">{p.response}</span>
                          </div>
                          <div className="savisits__t-when">
                            {formatDate(p.proposed_date)} · {formatTime(p.proposed_start_time)}–{formatTime(p.proposed_end_time)}
                          </div>
                          {p.message && <div className="savisits__t-msg">"{p.message}"</div>}
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
    </SALayout>
  )
}
