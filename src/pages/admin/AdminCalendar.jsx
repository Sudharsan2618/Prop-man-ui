import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, InputField, Skeleton,
} from '../../components'
import {
  createCalendarBlock,
  fetchCalendarBlocks,
  fetchCalendarSlots,
  deleteCalendarBlock,
  deleteCalendarSlot,
  completeVisit,
  fetchOnboardingWorkflows,
} from '../../services/api'
import './AdminCalendar.css'

const STATUS_MAP = {
  available: { label: 'Available', type: 'verified' },
  booked: { label: 'Booked', type: 'pending' },
  completed: { label: 'Completed', type: 'verified' },
  cancelled: { label: 'Cancelled', type: 'overdue' },
}

const VISIT_RESULT_MAP = {
  approved: { label: 'Approved', type: 'verified' },
  rejected: { label: 'Rejected', type: 'overdue' },
  pending: { label: 'Pending', type: 'pending' },
}

function getTodayInIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function formatDateIST(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

const DURATION_OPTIONS = [
  { key: 'forever', label: 'Forever' },
  { key: '3days', label: '3 Days' },
  { key: '3weeks', label: '3 Weeks' },
  { key: '3months', label: '3 Months' },
  { key: 'custom', label: 'Custom' },
]

export default function AdminCalendar() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('calendar')
  const [slots, setSlots] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingBlocks, setLoadingBlocks] = useState(true)
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockStart, setBlockStart] = useState('08:00')
  const [blockEnd, setBlockEnd] = useState('10:00')
  const [blockDuration, setBlockDuration] = useState('forever')
  const [blockFromDate, setBlockFromDate] = useState(getTodayInIST())
  const [blockToDate, setBlockToDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [creatingBlock, setCreatingBlock] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  // Visit approval state
  const [approvingSlot, setApprovingSlot] = useState(null)
  const [visitNotes, setVisitNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [workflowCount, setWorkflowCount] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)

  const handleTabChange = (tab) => { setActiveTab(tab); _navTabChange(tab) }

  const loadSlots = async () => {
    setLoading(true)
    try {
      const data = await fetchCalendarSlots(
        filter !== 'all' ? { status: filter } : {},
      )
      setSlots(data)
    } catch { setSlots([]) }
    setLoading(false)
  }

  const loadBlocks = async () => {
    setLoadingBlocks(true)
    try {
      const data = await fetchCalendarBlocks({ active_only: true })
      setBlocks(data)
    } catch {
      setBlocks([])
    }
    setLoadingBlocks(false)
  }

  useEffect(() => {
    loadSlots()
    loadBlocks()
    fetchOnboardingWorkflows().then(wfs => setWorkflowCount(wfs.length)).catch(() => {})
  }, [filter])

  const handleCreateBlock = async () => {
    if (!blockStart || !blockEnd || !blockFromDate) {
      setError('Please fill all required fields')
      return
    }
    if (blockDuration === 'custom' && !blockToDate) {
      setError('Please provide custom end date')
      return
    }

    const payload = {
      start_time: blockStart,
      end_time: blockEnd,
      effective_from: blockFromDate,
      reason: blockReason || null,
    }
    if (blockDuration === 'forever') {
      payload.duration_type = 'forever'
    } else if (blockDuration === '3days') {
      payload.duration_type = 'days'
      payload.duration_value = 3
    } else if (blockDuration === '3weeks') {
      payload.duration_type = 'weeks'
      payload.duration_value = 3
    } else if (blockDuration === '3months') {
      payload.duration_type = 'months'
      payload.duration_value = 3
    } else {
      payload.duration_type = 'custom'
      payload.effective_to = blockToDate
    }

    setError('')
    setCreatingBlock(true)
    try {
      await createCalendarBlock(payload)
      setShowBlockForm(false)
      setBlockDuration('forever')
      setBlockReason('')
      setBlockFromDate(getTodayInIST())
      setBlockToDate('')
      await Promise.all([loadSlots(), loadBlocks()])
    } catch (e) { setError(e.message) }
    setCreatingBlock(false)
  }

  const handleDeleteBlock = async (blockId) => {
    try {
      await deleteCalendarBlock(blockId)
      await Promise.all([loadSlots(), loadBlocks()])
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    try {
      await deleteCalendarSlot(slotId)
      await loadSlots()
    } catch (e) { setError(e.message) }
  }

  const handleCompleteVisit = async (slotId, approve) => {
    try {
      await completeVisit(slotId, {
        approve,
        notes: visitNotes || null,
        rejection_reason: approve ? null : (rejectionReason || 'Not a good fit'),
      })
      setApprovingSlot(null)
      setVisitNotes('')
      setRejectionReason('')
      await loadSlots()
    } catch (e) { setError(e.message) }
  }

  const formatTime = (t) => {
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${ampm}`
  }

  const toDateKey = (dateObj) => dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const getWeekStart = () => {
    const now = new Date()
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const day = ist.getDay() // 0 Sun - 6 Sat
    const diffToMonday = day === 0 ? -6 : (1 - day)
    const monday = new Date(ist)
    monday.setDate(ist.getDate() + diffToMonday + (weekOffset * 7))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  const weekStartDate = getWeekStart()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate)
    d.setDate(weekStartDate.getDate() + i)
    return {
      key: toDateKey(d),
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    }
  })

  const timeAxis = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8
    return `${String(hour).padStart(2, '0')}:00`
  })

  const weekDayKeys = new Set(weekDays.map((d) => d.key))
  const weekSlots = slots.filter((slot) => weekDayKeys.has(slot.slot_date))
  const weekCellMap = weekSlots.reduce((acc, slot) => {
    const hour = slot.start_time.slice(0, 2)
    const key = `${slot.slot_date}|${hour}`
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  return (
    <PageShell
      header={<AppHeader title="Calendar Management" hasNotification onNotificationClick={() => navigate('/notifications')} />}
      bottomNav={<BottomNav role="admin" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="acal animate-fade-in">
        {/* Error */}
        {error && (
          <div className="acal__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>close</span>
            </button>
          </div>
        )}

        {/* Filter + Block Rule */}
        <div className="acal__actions">
          <div className="acal__filters">
            {['all', 'available', 'booked', 'completed'].map(f => (
              <button
                key={f}
                className={`acal__filter-btn ${filter === f ? 'acal__filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <PrimaryButton icon="block" onClick={() => setShowBlockForm(!showBlockForm)}>
            Add Block Rule
          </PrimaryButton>
        </div>

        <p className="acal__timezone-note">Calendar timezone: IST (Asia/Kolkata)</p>

        {workflowCount > 0 && (
          <GlassCard interactive className="acal__onboarding-banner" onClick={() => navigate('/admin-onboarding')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>checklist</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}>Onboarding Tracker</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{workflowCount} active workflow{workflowCount !== 1 ? 's' : ''}</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)' }}>chevron_right</span>
            </div>
          </GlassCard>
        )}

        {/* Block Rule Form */}
        {showBlockForm && (
          <GlassCard className="acal__create-form">
            <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Block Time Range</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <InputField
                label="Start Time" type="time" value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
              />
              <InputField
                label="End Time" type="time" value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
              />
            </div>

            <InputField
              label="Effective From" type="date" value={blockFromDate}
              onChange={(e) => setBlockFromDate(e.target.value)}
            />

            <div className="acal__duration-grid">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`acal__duration-btn ${blockDuration === opt.key ? 'acal__duration-btn--active' : ''}`}
                  onClick={() => setBlockDuration(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {blockDuration === 'custom' && (
              <InputField
                label="Custom End Date" type="date" value={blockToDate}
                onChange={(e) => setBlockToDate(e.target.value)}
              />
            )}

            <InputField
              label="Reason (optional)"
              placeholder="e.g. Weekly owner meeting"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <SecondaryButton onClick={() => setShowBlockForm(false)}>Cancel</SecondaryButton>
              <PrimaryButton icon="check" loading={creatingBlock} disabled={creatingBlock} onClick={handleCreateBlock}>
                Save Block
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        <GlassCard className="acal__blocks-card">
          <div className="acal__blocks-header">
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>Active Block Rules</p>
            <StatusBadge status="pending">{blocks.length}</StatusBadge>
          </div>
          {loadingBlocks ? (
            <Skeleton height="72px" radius="var(--radius-lg)" />
          ) : blocks.length === 0 ? (
            <p className="acal__blocks-empty">No active block rules</p>
          ) : (
            <div className="acal__blocks-list">
              {blocks.map((block) => (
                <div key={block.id} className="acal__block-item">
                  <div>
                    <p className="acal__block-time">{formatTime(block.start_time)} — {formatTime(block.end_time)}</p>
                    <p className="acal__block-meta">
                      {formatDateIST(block.effective_from)}
                      {block.effective_to ? ` → ${formatDateIST(block.effective_to)}` : ' → Forever'}
                    </p>
                    {block.reason && <p className="acal__block-meta">Reason: {block.reason}</p>}
                  </div>
                  <SecondaryButton variant="danger" icon="delete" onClick={() => handleDeleteBlock(block.id)}>
                    Delete
                  </SecondaryButton>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="acal__week-card">
          <div className="acal__week-header">
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>Weekly Planner</p>
            <div className="acal__week-controls">
              <button className="acal__week-btn" onClick={() => setWeekOffset((p) => p - 1)}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <p className="acal__week-range">
                {weekDays[0]?.label} — {weekDays[6]?.label}
              </p>
              <button className="acal__week-btn" onClick={() => setWeekOffset((p) => p + 1)}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="acal__week-grid-wrap">
            <div className="acal__week-grid">
              <div className="acal__time-col-head">IST</div>
              {weekDays.map((day) => (
                <div key={day.key} className="acal__day-head">{day.label}</div>
              ))}

              {timeAxis.map((time) => {
                const hourKey = time.slice(0, 2)
                return (
                  <div key={`row-${time}`} className="acal__week-row">
                    <div className="acal__time-cell">{formatTime(time)}</div>
                    {weekDays.map((day) => {
                      const cellSlots = weekCellMap[`${day.key}|${hourKey}`] || []
                      const slot = cellSlots[0]
                      return (
                        <div key={`${day.key}-${time}`} className="acal__week-cell">
                          {slot && (
                            <div className={`acal__week-pill acal__week-pill--${slot.status}`} title={`${formatTime(slot.start_time)}-${formatTime(slot.end_time)}`}>
                              <span>{formatTime(slot.start_time)}</span>
                              {cellSlots.length > 1 && <strong>+{cellSlots.length - 1}</strong>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {loading && (
            <div className="acal__week-note">Loading calendar slots...</div>
          )}

          {!loading && weekSlots.length === 0 && (
            <div className="acal__week-note">No slots available for this week.</div>
          )}
        </GlassCard>
      </div>
    </PageShell>
  )
}
