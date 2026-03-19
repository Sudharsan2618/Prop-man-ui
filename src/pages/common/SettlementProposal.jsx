import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, GlassCard, PrimaryButton,
} from '../../components'
import './SettlementProposal.css'

export default function SettlementProposal() {
  const navigate = useNavigate()
  const originalAmount = 12500
  const [deduction, setDeduction] = useState(2500)
  const [note, setNote] = useState('')

  const netResolution = originalAmount - deduction

  return (
    <PageShell
      header={
        <div className="sp__header">
          <button className="sp__close-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <span className="sp__header-title">Propose Settlement</span>
          <span style={{ width: '36px' }} />
        </div>
      }
    >
      <div className="sp animate-fade-in">
        {/* Amount Card */}
        <GlassCard variant="highlighted" className="sp__amount-card">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', textAlign: 'center' }}>Original Invoice Amount</p>
          <p className="sp__original-amount">₹{originalAmount.toLocaleString('en-IN')}.00</p>

          <div className="sp__slider-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Proposed Deduction</span>
              <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--status-danger)' }}>
                -₹{deduction.toLocaleString('en-IN')}.00
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={originalAmount}
              step={100}
              value={deduction}
              onChange={(e) => setDeduction(Number(e.target.value))}
              className="sp__slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)' }}>
              <span>₹0</span>
              <span>₹{originalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="sp__net-section">
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Net Resolution</p>
            <p className="sp__net-amount">₹{netResolution.toLocaleString('en-IN')}.00</p>
          </div>
        </GlassCard>

        {/* Note */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>edit_note</span>
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>Resolution Note</p>
          </div>
          <textarea
            className="sp__textarea"
            placeholder="Provide reasoning or terms..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <p style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {note.length} / 500
          </p>
        </div>

        {/* CTAs */}
        <PrimaryButton icon="send" onClick={() => navigate(-1)}>Send Proposal ➤</PrimaryButton>
        <button className="sp__cancel" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </PageShell>
  )
}
