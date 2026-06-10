import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SALayout from './SALayout'
import { GlassCard, SearchBar, StatusBadge, Skeleton } from '../../components'
import { fetchOnboardingWorkflows } from '../../services/api'
import { reportError } from '../../utils/errors'
import './SAOnboarding.css'

const STEPS = [
  { key: 'visit_requested_at',               label: 'Visit Requested' },
  { key: 'visit_scheduled_at',               label: 'Visit Scheduled' },
  { key: 'visit_approved_at',                label: 'Visit Approved' },
  { key: 'agreement_generated_at',           label: 'Agreement Generated' },
  { key: 'tenant_signed_at',                 label: 'Tenant Signed' },
  { key: 'advance_submitted_at',             label: 'Advance Submitted' },
  { key: 'advance_approved_at',              label: 'Advance Approved' },
  { key: 'police_verification_completed_at', label: 'Police Verification' },
  { key: 'original_agreement_uploaded_at',   label: 'Original Agreement' },
  { key: 'tenant_activated_at',              label: 'Tenant Activated' },
]

const STATE_BADGE = {
  visit_requested: 'pending',
  visit_scheduled: 'pending',
  visit_approved: 'pending',
  visit_rejected: 'overdue',
  agreement_generated: 'pending',
  tenant_signed: 'pending',
  advance_submitted: 'pending',
  advance_approved: 'pending',
  police_verification_completed: 'pending',
  original_agreement_uploaded: 'pending',
  tenant_activated: 'verified',
}

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc',  label: 'Oldest first' },
  { value: 'progress_desc', label: 'Progress: high → low' },
  { value: 'progress_asc',  label: 'Progress: low → high' },
]

const PROGRESS_BUCKETS = [
  { value: 'all',     label: 'Any progress',  test: () => true },
  { value: '0_30',    label: '0% – 30%',      test: (p) => p < 30 },
  { value: '30_50',   label: '30% – 50%',     test: (p) => p >= 30 && p < 50 },
  { value: '50_70',   label: '50% – 70%',     test: (p) => p >= 50 && p < 70 },
  { value: '70_100',  label: '70% – 100%',    test: (p) => p >= 70 && p <= 100 },
]

function computeProgress(wf) {
  const done = STEPS.filter((s) => wf[s.key]).length
  return Math.round((done / STEPS.length) * 100)
}

function useClickOutside(ref, onClose, active) {
  useEffect(() => {
    if (!active) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose, active])
}

export default function SAOnboarding() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Tab filter (simple)
  const [tab, setTab] = useState('all') // 'all' | 'in_progress' | 'done'

  // Advanced filter state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sort, setSort] = useState('created_desc')
  const [progressBucket, setProgressBucket] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [stepFilter, setStepFilter] = useState('all')
  const filterRef = useRef(null)
  useClickOutside(filterRef, () => setFiltersOpen(false), filtersOpen)

  useEffect(() => {
    fetchOnboardingWorkflows()
      .then((data) => setItems(data || []))
      .catch((err) => reportError(err, { context: 'SAOnboarding.fetch' }))
      .finally(() => setLoading(false))
  }, [])

  const enriched = useMemo(
    () => items.map((w) => ({ ...w, progress: computeProgress(w) })),
    [items],
  )

  // Distinct managers / states for the dropdowns
  const distinctManagers = useMemo(() => {
    const seen = new Map()
    for (const w of enriched) {
      if (w.primary_manager_id && !seen.has(w.primary_manager_id)) {
        seen.set(w.primary_manager_id, w.primary_manager_name || w.primary_manager_id)
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }))
  }, [enriched])

  const distinctSteps = useMemo(() => {
    const seen = new Set()
    for (const w of enriched) if (w.state) seen.add(w.state)
    return Array.from(seen)
  }, [enriched])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const bucket = PROGRESS_BUCKETS.find((b) => b.value === progressBucket) || PROGRESS_BUCKETS[0]

    let out = enriched.filter((w) => {
      if (tab === 'in_progress' && w.progress === 100) return false
      if (tab === 'done' && w.progress !== 100) return false
      if (!bucket.test(w.progress)) return false
      if (managerFilter !== 'all' && w.primary_manager_id !== managerFilter) return false
      if (stepFilter !== 'all' && w.state !== stepFilter) return false
      if (!q) return true
      return (
        (w.property_name || '').toLowerCase().includes(q) ||
        (w.tenant_name || '').toLowerCase().includes(q) ||
        (w.primary_manager_name || '').toLowerCase().includes(q) ||
        (w.state || '').toLowerCase().includes(q)
      )
    })

    out.sort((a, b) => {
      switch (sort) {
        case 'created_asc': return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        case 'progress_desc': return b.progress - a.progress
        case 'progress_asc': return a.progress - b.progress
        case 'created_desc':
        default: return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      }
    })
    return out
  }, [enriched, search, tab, sort, progressBucket, managerFilter, stepFilter])

  const activeFilterCount = (
    (sort !== 'created_desc' ? 1 : 0) +
    (progressBucket !== 'all' ? 1 : 0) +
    (managerFilter !== 'all' ? 1 : 0) +
    (stepFilter !== 'all' ? 1 : 0)
  )

  const resetFilters = () => {
    setSort('created_desc')
    setProgressBucket('all')
    setManagerFilter('all')
    setStepFilter('all')
  }

  return (
    <SALayout activeKey="onboarding" title="Onboarding" subtitle={`${items.length} onboarding workflows`}>
      <div className="saonb">
        <div className="saonb__toolbar">
          <div className="saonb__toolbar-search">
            <SearchBar
              placeholder="Search by property, tenant, manager, or state…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="saonb__filter-wrap" ref={filterRef}>
            <button
              type="button"
              className={`saonb__filter-btn ${filtersOpen ? 'saonb__filter-btn--open' : ''}`}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="saonb__filter-count">{activeFilterCount}</span>
              )}
            </button>
            {filtersOpen && (
              <div className="saonb__filter-panel" role="menu">
                <div className="saonb__filter-row">
                  <label className="saonb__filter-label">Sort by</label>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="saonb__filter-row">
                  <label className="saonb__filter-label">Progress</label>
                  <select value={progressBucket} onChange={(e) => setProgressBucket(e.target.value)}>
                    {PROGRESS_BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div className="saonb__filter-row">
                  <label className="saonb__filter-label">Manager</label>
                  <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
                    <option value="all">All managers</option>
                    {distinctManagers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="saonb__filter-row">
                  <label className="saonb__filter-label">Onboarding step</label>
                  <select value={stepFilter} onChange={(e) => setStepFilter(e.target.value)}>
                    <option value="all">Any step</option>
                    {distinctSteps.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="saonb__filter-actions">
                  <button type="button" className="saonb__filter-reset" onClick={resetFilters}>Reset</button>
                  <button type="button" className="saonb__filter-done" onClick={() => setFiltersOpen(false)}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="saonb__filter">
          <button className={`saonb__chip ${tab === 'all' ? 'saonb__chip--active' : ''}`} onClick={() => setTab('all')}>
            All ({enriched.length})
          </button>
          <button className={`saonb__chip ${tab === 'in_progress' ? 'saonb__chip--active' : ''}`} onClick={() => setTab('in_progress')}>
            In Progress ({enriched.filter((w) => w.progress < 100).length})
          </button>
          <button className={`saonb__chip ${tab === 'done' ? 'saonb__chip--active' : ''}`} onClick={() => setTab('done')}>
            Completed ({enriched.filter((w) => w.progress === 100).length})
          </button>
        </div>

        {loading ? (
          <div className="saonb__list">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} height="100px" radius="var(--radius-xl)" />)}
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="saonb__empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>checklist</span>
            <p>No onboarding workflows match these filters.</p>
          </GlassCard>
        ) : (
          <div className="saonb__list">
            {filtered.map((w) => (
              <GlassCard
                key={w.id}
                interactive
                className="saonb__row"
                onClick={() => navigate(`/sa/onboarding/${w.id}`)}
              >
                <div className="saonb__row-head">
                  <div className="saonb__row-text">
                    <p className="saonb__row-title">
                      {w.property_name || <em>Unnamed property</em>}
                    </p>
                    <p className="saonb__row-sub">
                      <span>Tenant <strong>{w.tenant_name || '—'}</strong></span>
                      <span className="saonb__sep">·</span>
                      <span>Manager <strong>{w.primary_manager_name || 'Unassigned'}</strong></span>
                      {w.last_action_notes && (
                        <>
                          <span className="saonb__sep">·</span>
                          <span className="saonb__row-note">{w.last_action_notes}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="saonb__row-meta">
                    <span className="saonb__row-pct">{w.progress}%</span>
                    <StatusBadge status={STATE_BADGE[w.state] || 'pending'}>
                      {(w.state || '').replace(/_/g, ' ')}
                    </StatusBadge>
                  </div>
                </div>
                <div
                  className="saonb__bar"
                  style={{ '--saonb-progress': `${w.progress}%` }}
                  aria-hidden="true"
                />
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </SALayout>
  )
}
