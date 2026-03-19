import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Avatar,
} from '../../components'
import { fetchJobById } from '../../services/api'
import './InvoiceApproval.css'

export default function InvoiceApproval() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState({ id: jobId, serviceType: 'Service', description: '', providerName: 'Provider' })

  useEffect(() => {
    fetchJobById(jobId).then(j => { if (j) setJob(j) }).catch(() => {})
  }, [jobId])

  const materials = 570
  const laborRate = 80
  const laborHours = 3
  const labor = laborRate * laborHours
  const tax = Math.round((materials + labor) * 0.08)
  const total = materials + labor + tax

  return (
    <PageShell
      header={<SubPageHeader title="Invoice Approval" onBack={() => navigate(-1)} />}
    >
      <div className="inv-app animate-fade-in">
        {/* Photos Before/After */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <p style={{ fontWeight: 'var(--fw-semibold)' }}>Repair Photos</p>
            <StatusBadge status="completed" />
          </div>
          <div className="inv-app__photos">
            <div className="inv-app__photo">
              <div className="inv-app__photo-img"><span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--text-tertiary)' }}>image</span></div>
              <span className="inv-app__photo-label">Before</span>
            </div>
            <div className="inv-app__photo-slider">
              <div className="inv-app__slider-handle" />
            </div>
            <div className="inv-app__photo">
              <div className="inv-app__photo-img"><span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--text-tertiary)' }}>image</span></div>
              <span className="inv-app__photo-label">After</span>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <GlassCard>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Avatar initials="JD" size="md" verified />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-bold)' }}>{job.providerName || 'John Doe'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                <span style={{ fontSize: 'var(--fs-caption)', color: '#F59E0B' }}>★ 4.8</span>
                <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{laborHours} hours of work</span>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '4px' }}>{job.id}</p>
            </div>
          </div>
        </GlassCard>

        {/* Invoice Breakdown */}
        <GlassCard>
          <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-3)' }}>Invoice Breakdown</p>
          <div className="inv-app__rows">
            <div className="inv-app__row">
              <div>
                <p style={{ fontWeight: 'var(--fw-medium)' }}>{job.serviceType}</p>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{job.description}</p>
              </div>
            </div>
            <div className="inv-app__row">
              <span>Materials</span><span>₹{materials}</span>
            </div>
            <div className="inv-app__row">
              <span>Labor (₹{laborRate}/hr × {laborHours}h)</span><span>₹{labor}</span>
            </div>
            <div className="inv-app__row">
              <span>Tax (8%)</span><span>₹{tax}</span>
            </div>
            <div className="inv-app__total-row">
              <span>Total Amount</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="inv-app__actions">
          <PrimaryButton icon="check" onClick={() => navigate(-1)}>✓ Approve & Release Payment</PrimaryButton>
          <SecondaryButton variant="danger" icon="warning" onClick={() => navigate(-1)}>⚠ Dispute Invoice</SecondaryButton>
        </div>
      </div>
    </PageShell>
  )
}
