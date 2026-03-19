import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Dropdown,
} from '../../components'
import { fetchUserById } from '../../services/api'
import './KycReview.css'

const OCR_DATA = [
  { label: 'Full Name', value: 'Vikram Patel' },
  { label: 'Document Number', value: 'ABCPD1234E' },
  { label: 'Date of Birth', value: '15 March 1990' },
  { label: 'Expiration Date', value: '31 Dec 2035' },
]

const CHECKLIST = [
  { id: 'name', label: 'Name matches account details', checked: true },
  { id: 'valid', label: 'ID number is valid & consistent', checked: true },
  { id: 'photo', label: 'Photo is clear and unobstructed', checked: true },
  { id: 'expired', label: 'Document is not expired', checked: true },
]

export default function KycReview() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'Loading...' })

  useEffect(() => {
    fetchUserById(userId).then(u => { if (u) setUser(u) }).catch(() => {})
  }, [userId])

  const [checks, setChecks] = useState(CHECKLIST)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [zoom, setZoom] = useState(1)

  const toggleCheck = (id) => setChecks((prev) => prev.map((c) => c.id === id ? { ...c, checked: !c.checked } : c))

  return (
    <PageShell header={<SubPageHeader title="KYC Review Detail" onBack={() => navigate(-1)} />}>
      <div className="kr animate-fade-in">
        {/* Document Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>User Submitted Document</p>
            <StatusBadge status="pending">PENDING</StatusBadge>
          </div>
          <GlassCard className="kr__doc-preview">
            <div className="kr__doc-image" style={{ transform: `scale(${zoom})` }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>description</span>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>PAN Card — {user.name}</p>
            </div>
            <div className="kr__doc-controls">
              <button className="kr__ctrl-btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{Math.round(zoom * 100)}%</span>
              <button className="kr__ctrl-btn" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              </button>
              <button className="kr__ctrl-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rotate_right</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* OCR Data */}
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>smart_toy</span>
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>System OCR Data</p>
          </div>
          <div className="kr__ocr-table">
            {OCR_DATA.map((row) => (
              <div key={row.label} className="kr__ocr-row">
                <span className="kr__ocr-label">{row.label}</span>
                <span className="kr__ocr-value">{row.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Verification Checklist */}
        <GlassCard>
          <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Verification Checklist</p>
          <div className="kr__checklist">
            {checks.map((item) => (
              <label key={item.id} className="kr__check-item">
                <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(item.id)} className="kr__check-input" />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </GlassCard>

        {/* Admin Actions */}
        <GlassCard>
          <Dropdown
            label="Rejection Reason"
            options={[
              { value: '', label: 'Select reason...' },
              { value: 'blurry', label: 'Document is blurry or unreadable' },
              { value: 'mismatch', label: 'Name does not match account' },
              { value: 'expired', label: 'Document has expired' },
              { value: 'tampered', label: 'Document appears tampered' },
            ]}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div style={{ marginTop: 'var(--space-3)' }}>
            <label style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', fontWeight: 'var(--fw-semibold)', display: 'block', marginBottom: '6px' }}>
              Internal Notes
            </label>
            <textarea
              className="kr__notes"
              placeholder="Notes for audit trail..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="kr__actions">
          <SecondaryButton variant="danger" icon="refresh" onClick={() => navigate(-1)}>↺ Request Re-upload</SecondaryButton>
          <PrimaryButton icon="check" onClick={() => navigate(-1)}>✓ Approve KYC</PrimaryButton>
        </div>
      </div>
    </PageShell>
  )
}
