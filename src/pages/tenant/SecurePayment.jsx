import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton, FileUploadField
} from '../../components'
import {
  fetchPropertiesByTenant, uploadPaymentReceipt, fetchPayments, uploadDocument
} from '../../services/api'
import { useRole } from '../../context/RoleContext'
import './SecurePayment.css'

export default function SecurePayment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useRole()
  const [processing, setProcessing] = useState(false)
  const [property, setProperty] = useState(null)
  const [error, setError] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const state = location.state || {}
  const mode = state.mode || 'rent' 
  const paymentData = state.payment || state.rentPaymentOverride
  const navProperty = state.property

  const [payment, setPayment] = useState(paymentData || null)

  const isPaid = payment?.status === 'paid'
  const isAwaitingVerification = payment?.status === 'awaiting_verification'

  useEffect(() => {
    if (navProperty) {
      setProperty(navProperty)
    } else {
      fetchPropertiesByTenant().then(props => setProperty(props?.[0] || null)).catch(() => {})
    }

    if (!payment) {
      fetchPayments().then(payments => {
        const p = payments.find(p =>
          p.status === 'pending' || p.status === 'overdue' || p.status === 'awaiting_verification'
        )
        if (p) setPayment(p)
      }).catch(() => {})
    }
  }, [navProperty])

  const amount = payment?.amount || property?.rent || 0
  const maintenance = mode === 'rent' ? (property?.maintenance_charges || 0) : 0
  const total = amount + maintenance

  const handleUpload = async () => {
    if (!payment?.id) {
      setError('No pending payment found to submit receipt')
      return
    }
    if (!receiptFile) {
      setError('Please select a payment receipt file')
      return
    }
    setError('')
    setProcessing(true)

    try {
      const uploadedUrl = await uploadDocument(receiptFile, 'payment-receipts')
      await uploadPaymentReceipt(payment.id, uploadedUrl)
      setPaymentSuccess(true)
      setTimeout(() => navigate('/payments'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to submit receipt')
    }
    setProcessing(false)
  }

  return (
    <PageShell
      header={
        <SubPageHeader
          title="Offline Payment"
          onBack={() => navigate(-1)}
        />
      }
    >
      <div className="pay-page animate-fade-in">
        {isPaid ? (
          <div className="pay-page__success">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#22C55E' }}>verified</span>
            <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-3)' }}>Payment Confirmed</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)', marginBottom: 'var(--space-2)' }}>
              {payment?.label} — ₹{(payment?.amount || 0).toLocaleString('en-IN')} has been verified by admin.
            </p>
            <PrimaryButton fullWidth onClick={() => navigate('/payments')} style={{ marginTop: 'var(--space-4)' }}>
              View All Payments
            </PrimaryButton>
          </div>
        ) : isAwaitingVerification ? (
          <div className="pay-page__success">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#F59E0B' }}>hourglass_top</span>
            <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-3)' }}>Awaiting Verification</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)', marginBottom: 'var(--space-2)' }}>
              Your receipt for {payment?.label} (₹{(payment?.amount || 0).toLocaleString('en-IN')}) has been submitted. The admin will verify it shortly.
            </p>
            <PrimaryButton fullWidth onClick={() => navigate('/payments')} style={{ marginTop: 'var(--space-4)' }}>
              View All Payments
            </PrimaryButton>
          </div>
        ) : paymentSuccess ? (
          <div className="pay-page__success">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#22C55E' }}>check_circle</span>
            <h2 style={{ color: 'var(--text-primary)', marginTop: 'var(--space-3)' }}>Receipt Submitted!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>The administrator will verify your payment shortly.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="pay-page__error">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <GlassCard>
              <div className="pay-page__summary-header">
                <div className="pay-page__summary-icon">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>account_balance</span>
                </div>
                <div>
                  <p style={{ fontWeight: 'var(--fw-semibold)' }}>{payment?.label || 'Payment'}</p>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{property?.name || 'Property'}</p>
                </div>
              </div>
              <div className="pay-page__line-items">
                <div className="pay-page__line"><span>Amount</span><span style={{ color: 'var(--text-primary)' }}>₹{amount.toLocaleString('en-IN')}</span></div>
                {maintenance > 0 && <div className="pay-page__line"><span>Maintenance</span><span style={{ color: 'var(--text-primary)' }}>₹{maintenance.toLocaleString('en-IN')}</span></div>}
                <div className="pay-page__total-line">
                  <span>Total Payable</span>
                  <span className="pay-page__total-amount">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="pay-page__instructions">
              <h3 style={{ marginBottom: 'var(--space-2)' }}>How to Pay</h3>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                1. Transfer the total amount via UPI or Bank Transfer.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                <p style={{ fontSize: 'var(--fs-caption)' }}><strong>UPI ID:</strong> admin@luxelife</p>
                <p style={{ fontSize: 'var(--fs-caption)' }}><strong>Account:</strong> 9876543210 (IFSC: LUXE0001)</p>
              </div>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                2. Take a screenshot of the confirmation.
              </p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                3. Upload the screenshot/PDF from your device and submit for verification.
              </p>

              <FileUploadField
                label="Payment Receipt"
                hint="Accepted: JPG, PNG, PDF (max 10MB)"
                accept="image/*,.pdf"
                file={receiptFile}
                onFileSelect={setReceiptFile}
                buttonText="Upload Receipt"
              />
            </GlassCard>

            <PrimaryButton 
              fullWidth 
              onClick={handleUpload} 
              loading={processing}
              disabled={!receiptFile || !payment?.id}
            >
              Submit Receipt for Verification
            </PrimaryButton>
          </>
        )}
      </div>
    </PageShell>
  )
}

