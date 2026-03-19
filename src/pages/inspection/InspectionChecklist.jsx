import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, GlassCard, PrimaryButton, Dropdown, ProgressBar,
} from '../../components'
import './InspectionChecklist.css'

const ROOMS = [
  { key: 'living', label: 'Living Room', status: 'done' },
  { key: 'master', label: 'Master Bed', status: 'partial' },
  { key: 'kitchen', label: 'Kitchen', status: 'empty' },
  { key: 'bath1', label: 'Bathroom 1', status: 'empty' },
  { key: 'bed2', label: 'Bedroom 2', status: 'empty' },
  { key: 'bath2', label: 'Bathroom 2', status: 'empty' },
  { key: 'balcony', label: 'Balcony', status: 'empty' },
  { key: 'utility', label: 'Utility', status: 'empty' },
]

const CHECKLIST = {
  living: [
    { id: 'walls', label: 'Walls', checked: true, condition: 'good' },
    { id: 'flooring', label: 'Flooring', checked: true, condition: 'fair', photos: 2, note: 'Minor scratch near entrance' },
    { id: 'windows', label: 'Windows & Blinds', checked: false, condition: '' },
    { id: 'electrical', label: 'Electrical Outlets', checked: false, condition: '' },
    { id: 'ceiling', label: 'Ceiling & Fan', checked: false, condition: '' },
  ],
  master: [
    { id: 'walls', label: 'Walls', checked: true, condition: 'good' },
    { id: 'flooring', label: 'Flooring', checked: false, condition: '' },
    { id: 'wardrobe', label: 'Wardrobe', checked: false, condition: '' },
    { id: 'windows', label: 'Windows', checked: false, condition: '' },
  ],
}

const CONDITION_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
]

const CONDITION_COLORS = { good: 'var(--status-success)', fair: 'var(--status-warning)', poor: '#F97316', damaged: 'var(--status-danger)' }

export default function InspectionChecklist() {
  const { inspId } = useParams()
  const navigate = useNavigate()
  const [activeRoom, setActiveRoom] = useState('living')
  const [items, setItems] = useState(CHECKLIST)

  const completed = ROOMS.filter((r) => r.status === 'done').length
  const totalRooms = ROOMS.length
  const pct = Math.round((completed / totalRooms) * 100)

  const currentItems = items[activeRoom] || items.living

  const toggleCheck = (itemId) => {
    setItems((prev) => ({
      ...prev,
      [activeRoom]: (prev[activeRoom] || currentItems).map((i) =>
        i.id === itemId ? { ...i, checked: !i.checked } : i
      ),
    }))
  }

  const setCondition = (itemId, val) => {
    setItems((prev) => ({
      ...prev,
      [activeRoom]: (prev[activeRoom] || currentItems).map((i) =>
        i.id === itemId ? { ...i, condition: val } : i
      ),
    }))
  }

  return (
    <PageShell
      header={
        <div className="ic__header">
          <button className="ic__close-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <span className="ic__header-title">Property Inspection</span>
          <button className="ic__save-link">Save</button>
        </div>
      }
      stickyFooter={
        <PrimaryButton className="ic__gold-btn" icon="arrow_forward" onClick={() => {
          const idx = ROOMS.findIndex((r) => r.key === activeRoom)
          if (idx < ROOMS.length - 1) setActiveRoom(ROOMS[idx + 1].key)
          else navigate(`/handover-summary/${inspId}`)
        }}>
          Save & Next Room →
        </PrimaryButton>
      }
    >
      <div className="ic">
        {/* Progress */}
        <div className="ic__progress-section">
          <div className="ic__progress-text">
            <span>{completed} of {totalRooms} rooms completed</span>
            <span style={{ color: '#D4A843', fontWeight: 'var(--fw-bold)' }}>{pct}%</span>
          </div>
          <div className="ic__progress-bar">
            <div className="ic__progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Room Tabs */}
        <div className="ic__room-tabs">
          {ROOMS.map((r) => (
            <button
              key={r.key}
              className={`ic__room-tab ${activeRoom === r.key ? 'ic__room-tab--active' : ''}`}
              onClick={() => setActiveRoom(r.key)}
            >
              <span className={`ic__room-status ic__room-status--${r.status}`}>
                {r.status === 'done' && <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check</span>}
                {r.status === 'partial' && <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>horizontal_rule</span>}
              </span>
              <span className="ic__room-label">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Checklist Items */}
        <div className="ic__items">
          {currentItems.map((item) => (
            <GlassCard key={item.id} className="ic__item">
              {/* Top row */}
              <div className="ic__item-top">
                <button
                  className={`ic__checkbox ${item.checked ? 'ic__checkbox--checked' : ''}`}
                  onClick={() => toggleCheck(item.id)}
                >
                  {item.checked && <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>}
                </button>
                <span className="ic__item-label">{item.label}</span>
                <div className="ic__condition-pill">
                  <select
                    value={item.condition}
                    onChange={(e) => setCondition(item.id, e.target.value)}
                    className="ic__condition-select"
                    style={item.condition ? { color: CONDITION_COLORS[item.condition] } : undefined}
                  >
                    {CONDITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photos row */}
              <div className="ic__photos-row">
                {item.photos && Array.from({ length: item.photos }).map((_, i) => (
                  <div key={i} className="ic__photo-thumb">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>image</span>
                  </div>
                ))}
                <button className="ic__add-photo">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D4A843' }}>photo_camera</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{item.photos ? '+' : 'Capture'}</span>
                </button>
              </div>

              {/* Notes */}
              {item.note && (
                <p className="ic__note">{item.note}</p>
              )}
              {item.checked && !item.note && (
                <input
                  type="text"
                  className="ic__note-input"
                  placeholder="Add notes (e.g. minor scratch...)"
                />
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
