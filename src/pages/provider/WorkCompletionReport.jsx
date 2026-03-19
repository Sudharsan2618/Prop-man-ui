import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, StatusBadge,
} from '../../components'
import { fetchJobById } from '../../services/api'
import './WorkCompletionReport.css'

export default function WorkCompletionReport() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState({ id: jobId, serviceType: 'Service', description: '', address: '' })

  useEffect(() => {
    fetchJobById(jobId).then(j => { if (j) setJob(j) }).catch(() => {})
  }, [jobId])

  const [invoiceItems, setInvoiceItems] = useState([
    { desc: 'PVC Pipe (1.5")', qty: 2, total: 180 },
    { desc: 'Elbow Joint', qty: 4, total: 120 },
    { desc: 'Sealant Tape', qty: 1, total: 80 },
    { desc: 'Adhesive', qty: 1, total: 190 },
  ])
  const [laborItems] = useState([
    { desc: 'Pipe replacement', hrs: 1, total: 800 },
    { desc: 'Leak sealing', hrs: 0.5, total: 400 },
    { desc: 'Pressure test', hrs: 0.5, total: 300 },
  ])

  const materialTotal = invoiceItems.reduce((s, i) => s + i.total, 0)
  const laborTotal = laborItems.reduce((s, i) => s + i.total, 0)
  const grandTotal = materialTotal + laborTotal

  return (
    <PageShell
      header={
        <SubPageHeader
          title="Work Completion"
          onBack={() => navigate(-1)}
          rightAction={
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>more_vert</span>
            </button>
          }
        />
      }
      stickyFooter={
        <PrimaryButton icon="send" onClick={() => navigate('/jobs')}>
          ▶ Submit Invoice
        </PrimaryButton>
      }
    >
      <div className="wcr animate-fade-in">
        {/* Job Summary */}
        <GlassCard>
          <div className="wcr__job-header">
            <StatusBadge status="active">IN PROGRESS</StatusBadge>
            <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{job.id}</span>
          </div>
          <p style={{ fontWeight: 'var(--fw-semibold)', marginTop: 'var(--space-2)' }}>{job.serviceType}</p>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{job.description}</p>
          <div className="wcr__job-meta">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>location_on</span>
            <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{job.address}</span>
          </div>
        </GlassCard>

        {/* Photo Evidence */}
        <div>
          <p className="wcr__overline">PHOTO EVIDENCE</p>
          <div className="wcr__photos">
            <div className="wcr__photo-card">
              <div className="wcr__photo-thumb">
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>image</span>
              </div>
              <p className="wcr__photo-label">Before</p>
              <span className="wcr__photo-uploaded">✓ Uploaded</span>
            </div>
            <div className="wcr__photo-card wcr__photo-card--upload">
              <div className="wcr__photo-dashed">
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>photo_camera</span>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Add Photo</p>
              </div>
              <p className="wcr__photo-label">After</p>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div>
          <div className="wcr__invoice-header">
            <p className="wcr__overline">ITEMIZED INVOICE</p>
            <button className="wcr__add-item">+ Add Item</button>
          </div>
          <GlassCard className="wcr__invoice">
            {/* Column headers */}
            <div className="wcr__invoice-row wcr__invoice-row--header">
              <span style={{ flex: 2 }}>Description</span>
              <span style={{ flex: 0.5, textAlign: 'center' }}>Qty</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
            </div>

            {/* Materials */}
            <p className="wcr__invoice-section-label">Materials</p>
            {invoiceItems.map((item, i) => (
              <div key={i} className="wcr__invoice-row">
                <span style={{ flex: 2 }}>{item.desc}</span>
                <span style={{ flex: 0.5, textAlign: 'center' }}>{item.qty}</span>
                <span style={{ flex: 1, textAlign: 'right' }}>₹{item.total}</span>
              </div>
            ))}
            <div className="wcr__invoice-subtotal">
              <span>Material Subtotal</span>
              <span>₹{materialTotal}</span>
            </div>

            {/* Labor */}
            <p className="wcr__invoice-section-label" style={{ marginTop: 'var(--space-3)' }}>Labor</p>
            {laborItems.map((item, i) => (
              <div key={i} className="wcr__invoice-row">
                <span style={{ flex: 2 }}>{item.desc}</span>
                <span style={{ flex: 0.5, textAlign: 'center' }}>{item.hrs}h</span>
                <span style={{ flex: 1, textAlign: 'right' }}>₹{item.total}</span>
              </div>
            ))}
            <div className="wcr__invoice-subtotal">
              <span>Labor Subtotal</span>
              <span>₹{laborTotal}</span>
            </div>

            {/* Grand Total */}
            <div className="wcr__invoice-grand">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </GlassCard>
        </div>

        {/* Signature */}
        <div>
          <div className="wcr__invoice-header">
            <p className="wcr__overline">PROVIDER SIGNATURE</p>
            <button className="wcr__add-item">Clear</button>
          </div>
          <GlassCard>
            <div className="wcr__sign-canvas">
              <p className="wcr__sign-placeholder">Sign here</p>
              <div className="wcr__sign-baseline" />
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 'var(--space-2)', fontFamily: 'monospace' }}>
              SIGNED BY PROVIDER ID: PRV-092
            </p>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
