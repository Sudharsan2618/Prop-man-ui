import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProperties, fetchPropertyDetails, publishProperty } from '../../services/api'
import { reportError } from '../../utils/errors'
import { ConfirmModal } from '../../components'
import SALayout from './SALayout'
import './SAProperties.css'

const STATUS_META = {
  active: { label: 'Published', cls: 'sap__status--active' },
  draft: { label: 'Draft', cls: 'sap__status--draft' },
  archived: { label: 'Archived', cls: 'sap__status--archived' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
]

export default function SAProperties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [publishTarget, setPublishTarget] = useState(null)
  const [publishing, setPublishing] = useState(false)

  const loadProperties = () => {
    setLoading(true)
    fetchProperties()
      .then((data) => setProperties(data || []))
      .catch((err) => reportError(err, { context: 'SAProperties.fetchProperties', silent: true }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProperties() }, [])

  const statusOf = (p) => (p?.status || 'draft').toLowerCase()

  const counts = useMemo(() => {
    const c = { all: properties.length, active: 0, draft: 0, archived: 0 }
    properties.forEach((p) => { const s = statusOf(p); if (c[s] !== undefined) c[s] += 1 })
    return c
  }, [properties])

  const occupiedCount = useMemo(
    () => properties.filter((p) => (p?.occupancy || '').toLowerCase() === 'occupied').length,
    [properties],
  )
  const publishedCount = counts.active
  const occupancyRate = publishedCount ? Math.round((occupiedCount / publishedCount) * 100) : 0

  const filtered = useMemo(() => {
    return (properties || [])
      .filter((p) => (filter === 'all' ? true : statusOf(p) === filter))
      .filter((p) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return (
          (p?.name || '').toLowerCase().includes(q) ||
          (p?.address || '').toLowerCase().includes(q) ||
          (p?.city || '').toLowerCase().includes(q)
        )
      })
  }, [properties, filter, query])

  const openProperty = async (id) => {
    setDetailLoading(true)
    setSelectedProperty({ id })
    try {
      const detail = await fetchPropertyDetails(id)
      setSelectedProperty(detail)
    } catch (err) {
      reportError(err, { context: 'SAProperties.openProperty', silent: true })
      setSelectedProperty(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const confirmPublish = async () => {
    if (!publishTarget) return
    setPublishing(true)
    try {
      await publishProperty(publishTarget.id)
      setPublishTarget(null)
      loadProperties()
    } catch (err) {
      reportError(err, { context: 'SAProperties.publish' })
    } finally {
      setPublishing(false)
    }
  }

  const addPropertyBtn = (
    <button className="sap__add-btn" onClick={() => navigate('/sa/properties/create')}>
      <span className="material-symbols-outlined">add_home</span>
      <span>Add Property</span>
    </button>
  )

  return (
    <SALayout activeKey="properties" title="Property Ledger" subtitle={`Managing ${properties.length} assets`} actions={addPropertyBtn}>
      <div className="sap">
        {/* Stats */}
        <div className="sap__stats">
          <div className="sap__stat">
            <div className="sap__stat-icon sap__stat-icon--primary"><span className="material-symbols-outlined">location_city</span></div>
            <div><p className="sap__stat-val">{properties.length}</p><p className="sap__stat-lbl">Total Properties</p></div>
          </div>
          <div className="sap__stat">
            <div className="sap__stat-icon sap__stat-icon--warning"><span className="material-symbols-outlined">edit_note</span></div>
            <div><p className="sap__stat-val">{counts.draft}</p><p className="sap__stat-lbl">Drafts</p></div>
          </div>
          <div className="sap__stat">
            <div className="sap__stat-icon sap__stat-icon--success"><span className="material-symbols-outlined">check_circle</span></div>
            <div><p className="sap__stat-val">{publishedCount}</p><p className="sap__stat-lbl">Published</p></div>
          </div>
          <div className="sap__stat">
            <div className="sap__stat-icon sap__stat-icon--info"><span className="material-symbols-outlined">home</span></div>
            <div><p className="sap__stat-val">{occupancyRate}%</p><p className="sap__stat-lbl">Occupancy</p></div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="sap__toolbar">
          <div className="sap__filter-pills">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`sap__pill ${filter === f.key ? 'sap__pill--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="sap__pill-count">{counts[f.key] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="sap__search-wrap">
            <span className="material-symbols-outlined sap__search-icon">search</span>
            <input
              className="sap__search-input"
              placeholder="Search properties..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <p className="sap__results-info">Showing {filtered.length} of {properties.length} properties</p>

        {/* Grid */}
        <div className="sap__grid">
          {loading && (
            <div className="sap__empty"><span className="material-symbols-outlined sap__spin">progress_activity</span><p>Loading properties…</p></div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="sap__empty">
              <span className="material-symbols-outlined">search_off</span>
              <p>No properties found.</p>
              {filter === 'draft' && <span className="sap__empty-hint">Drafts you save will appear here.</span>}
            </div>
          )}
          {!loading && filtered.map((p) => {
            const status = statusOf(p)
            const meta = STATUS_META[status] || STATUS_META.draft
            const occupied = (p?.occupancy || '').toLowerCase() === 'occupied'
            const isDraft = status === 'draft'
            return (
              <div key={p.id} className="sap__card">
                <button className="sap__card-thumb" onClick={() => openProperty(p.id)} aria-label={`View ${p.name}`}>
                  <img src={p.image || p.images?.[0] || 'https://placehold.co/280x160?text=Property'} alt="" />
                  <span className={`sap__status-badge ${meta.cls}`}>{meta.label}</span>
                  {status === 'active' && (
                    <span className={`sap__occ-badge ${occupied ? 'sap__occ-badge--occ' : 'sap__occ-badge--vac'}`}>
                      {occupied ? 'Occupied' : 'Vacant'}
                    </span>
                  )}
                </button>
                <div className="sap__card-body">
                  <button className="sap__card-name-btn" onClick={() => openProperty(p.id)}>{p.name || 'Untitled draft'}</button>
                  <p className="sap__card-address">{p.address || 'No address yet'}</p>
                  <div className="sap__card-meta">
                    {p.bhk && <span className="sap__card-tag">{p.bhk}</span>}
                    {p.sqft && <span className="sap__card-tag">{p.sqft} sqft</span>}
                    {p.rent ? <span className="sap__card-rent">₹{(p.rent).toLocaleString('en-IN')}/mo</span> : <span className="sap__card-rent sap__card-rent--muted">No rent set</span>}
                  </div>
                  <div className="sap__card-actions">
                    <button className="sap__card-btn" onClick={() => navigate(`/sa/properties/${p.id}/edit`)}>
                      <span className="material-symbols-outlined">{isDraft ? 'edit_note' : 'edit'}</span>
                      {isDraft ? 'Continue' : 'Edit'}
                    </button>
                    {isDraft && (
                      <button className="sap__card-btn sap__card-btn--publish" onClick={() => setPublishTarget(p)}>
                        <span className="material-symbols-outlined">publish</span>
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail Panel */}
        {selectedProperty && (
          <div className="sap__panel-overlay" onClick={() => setSelectedProperty(null)}>
            <div className="sap__panel" onClick={(e) => e.stopPropagation()}>
              <div className="sap__panel-header">
                <h3 className="sap__panel-title">Property Details</h3>
                <button className="sap__panel-close" onClick={() => setSelectedProperty(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="sap__panel-body">
                {detailLoading ? (
                  <p className="sap__detail-muted">Loading...</p>
                ) : (
                  <>
                    <div className="sap__detail-section">
                      <h4 className="sap__detail-heading">{selectedProperty.name}</h4>
                      <p className="sap__detail-sub">{selectedProperty.address}, {selectedProperty.city}</p>
                    </div>
                    <div className="sap__detail-grid">
                      <div className="sap__detail-field">
                        <span className="sap__detail-label">Listing Status</span>
                        <span className={`sap__detail-pill ${STATUS_META[statusOf(selectedProperty)]?.cls || ''}`}>
                          {STATUS_META[statusOf(selectedProperty)]?.label || 'Draft'}
                        </span>
                      </div>
                      <div className="sap__detail-field">
                        <span className="sap__detail-label">Occupancy</span>
                        <span className="sap__detail-value">{selectedProperty.occupancy || '—'}</span>
                      </div>
                      <div className="sap__detail-field">
                        <span className="sap__detail-label">Type</span>
                        <span className="sap__detail-value">{(selectedProperty.type || '').replace(/_/g, ' ')}</span>
                      </div>
                      <div className="sap__detail-field">
                        <span className="sap__detail-label">Monthly Rent</span>
                        <span className="sap__detail-value">{selectedProperty.rent ? `₹${(selectedProperty.rent).toLocaleString('en-IN')}` : '—'}</span>
                      </div>
                      <div className="sap__detail-field">
                        <span className="sap__detail-label">Configuration</span>
                        <span className="sap__detail-value">{selectedProperty.bhk || '—'} · {selectedProperty.sqft || '—'} sqft</span>
                      </div>
                      <div className="sap__detail-field">
                        <span className="sap__detail-label">Furnishing</span>
                        <span className="sap__detail-value">{(selectedProperty.furnishing || '').replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="sap__panel-actions">
                      <button className="sap__panel-action-btn" onClick={() => navigate(`/sa/properties/${selectedProperty.id}/edit`)}>
                        <span className="material-symbols-outlined">edit</span> Edit Property
                      </button>
                      {statusOf(selectedProperty) === 'draft' && (
                        <button className="sap__panel-action-btn sap__panel-action-btn--publish" onClick={() => { const t = selectedProperty; setSelectedProperty(null); setPublishTarget(t) }}>
                          <span className="material-symbols-outlined">publish</span> Publish
                        </button>
                      )}
                    </div>

                    {/* Owner */}
                    <div className="sap__detail-person">
                      <div className="sap__detail-person-header"><span className="material-symbols-outlined">real_estate_agent</span><span>Owner</span></div>
                      {selectedProperty.owner ? (
                        <div className="sap__detail-person-body">
                          <p className="sap__detail-person-name">{selectedProperty.owner.name}</p>
                          <p className="sap__detail-person-email">{selectedProperty.owner.email}</p>
                        </div>
                      ) : <p className="sap__detail-muted">Not assigned</p>}
                    </div>

                    {/* Managers */}
                    <div className="sap__detail-person">
                      <div className="sap__detail-person-header"><span className="material-symbols-outlined">manage_accounts</span><span>Managers ({selectedProperty.managers?.length || 0})</span></div>
                      {selectedProperty.managers?.length > 0 ? (
                        selectedProperty.managers.map(m => (
                          <div key={m.id} className="sap__detail-person-body sap__detail-person-clickable" onClick={() => navigate(`/sa/users/${m.id}`)}>
                            <p className="sap__detail-person-name">{m.name} <span className="sap__detail-role">({m.role})</span></p>
                            <p className="sap__detail-person-email">{m.email}</p>
                          </div>
                        ))
                      ) : <p className="sap__detail-muted">No managers assigned</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(publishTarget)}
        variant="approve"
        icon="publish"
        title="Publish this property?"
        subtitle={publishTarget?.name}
        description="It will become visible and available for tenant onboarding. Make sure the listing details are complete."
        confirmText="Publish"
        cancelText="Cancel"
        loading={publishing}
        onConfirm={confirmPublish}
        onCancel={() => setPublishTarget(null)}
      />
    </SALayout>
  )
}
