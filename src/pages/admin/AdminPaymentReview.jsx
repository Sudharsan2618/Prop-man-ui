import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, AppHeader, BottomNav, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Avatar, TabNav, ConfirmModal, Skeleton
} from '../../components'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import { 
  fetchPendingVerifications, 
  verifyPayment, 
  fetchAgreements, 
  adminConfirmAdvance,
  generateMonthlyRent,
  fetchOnboardingWorkflows,
  reviewPoliceVerification,
  reviewOriginalAgreement,
} from '../../services/api'
import './AdminPaymentReview.css'

export default function AdminPaymentReview() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('rent')
  const [rentPayments, setRentPayments] = useState([])
  const [pendingAgreements, setPendingAgreements] = useState([])
  const [pendingChecklists, setPendingChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [modal, setModal] = useState({ open: false })

  const openModal = (config) => setModal({ open: true, ...config })
  const closeModal = () => { if (!processing) setModal({ open: false }) }

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'rent') {
        const data = await fetchPendingVerifications()
        setRentPayments(data)
      } else if (activeTab === 'advance') {
        const data = await fetchAgreements({ status: 'awaiting_payment' })
        setPendingAgreements(data)
      } else {
        const data = await fetchOnboardingWorkflows()
        const pending = (data || []).filter((wf) => (
          wf.police_verification_status?.toLowerCase() === 'submitted' ||
          wf.original_agreement_status?.toLowerCase() === 'submitted'
        ))
        setPendingChecklists(pending)
      }
    } catch (err) {
      setError('Failed to load data')
    }
    setLoading(false)
  }

  const handleVerifyRent = (paymentId, approve) => {
    openModal({
      variant: approve ? 'approve' : 'reject',
      title: approve ? 'Approve Payment' : 'Reject Payment',
      subtitle: approve ? 'Verify this receipt and mark as paid' : 'Send back to tenant with feedback',
      description: approve
        ? 'This will mark the payment as verified and notify the tenant.'
        : 'Please provide a reason so the tenant can re-submit.',
      showInput: true,
      inputLabel: approve ? 'Notes (optional)' : 'Rejection reason',
      inputPlaceholder: approve ? 'e.g. Verified via bank statement' : 'e.g. Screenshot is unclear, please re-upload',
      inputRequired: !approve,
      confirmText: approve ? 'Approve' : 'Reject',
      onConfirm: async (notes) => {
        setProcessing(true)
        try {
          await verifyPayment(paymentId, {
            approve,
            notes: approve ? notes : null,
            rejection_reason: approve ? null : notes,
          })
          setRentPayments(prev => prev.filter(p => p.id !== paymentId))
          setMessage(approve ? 'Payment approved' : 'Payment rejected')
          closeModal()
        } catch (err) {
          setError(err.message || 'Action failed')
        }
        setProcessing(false)
      },
    })
  }

  const handleChecklistReview = (workflowId, type, approve) => {
    const typeLabel = type === 'police' ? 'Police Verification' : 'Original Agreement'
    openModal({
      variant: approve ? 'approve' : 'reject',
      title: approve ? `Approve ${typeLabel}` : `Reject ${typeLabel}`,
      description: approve
        ? `This will mark the ${typeLabel.toLowerCase()} as approved.`
        : `Please provide a reason for rejecting this ${typeLabel.toLowerCase()}.`,
      showInput: !approve,
      inputLabel: 'Rejection reason',
      inputPlaceholder: 'e.g. Document is not legible',
      inputRequired: !approve,
      confirmText: approve ? 'Approve' : 'Reject',
      onConfirm: async (reason) => {
        setProcessing(true)
        try {
          if (type === 'police') {
            await reviewPoliceVerification(workflowId, { approve, rejection_reason: approve ? null : reason })
          } else {
            await reviewOriginalAgreement(workflowId, { approve, rejection_reason: approve ? null : reason })
          }
          setMessage(approve ? 'Checklist item approved' : 'Checklist item rejected')
          await loadData()
          closeModal()
        } catch (err) {
          setError(err.message || 'Checklist review failed')
        }
        setProcessing(false)
      },
    })
  }

  const handleConfirmAdvance = (agreementId) => {
    openModal({
      variant: 'confirm',
      title: 'Confirm Advance Payment',
      subtitle: 'Activate the rental agreement',
      description: 'This will mark the advance as received, activate the agreement, and assign the tenant to the property.',
      showInput: true,
      inputLabel: 'Notes (optional)',
      inputPlaceholder: 'e.g. Cash received on 15 Mar',
      inputRequired: false,
      confirmText: 'Confirm & Activate',
      onConfirm: async (notes) => {
        setProcessing(true)
        try {
          await adminConfirmAdvance(agreementId, notes)
          setPendingAgreements(prev => prev.filter(a => a.id !== agreementId))
          setMessage('Advance confirmed. Agreement is now ACTIVE.')
          closeModal()
        } catch (err) {
          setError(err.message || 'Confirmation failed')
        }
        setProcessing(false)
      },
    })
  }

  const handleGenerateRent = () => {
    openModal({
      variant: 'warning',
      icon: 'sync',
      title: 'Generate Monthly Rent',
      description: 'This will create rent payment records for all active agreements. Run this once at the start of each month.',
      confirmText: 'Generate',
      onConfirm: async () => {
        setProcessing(true)
        try {
          const res = await generateMonthlyRent()
          setMessage(res.message)
          if (activeTab === 'rent') loadData()
          closeModal()
        } catch (err) {
          setError(err.message || 'Failed to generate rent')
        }
        setProcessing(false)
      },
    })
  }

  const handleNavChange = (tab) => {
    setActiveTab('rent')
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Payment Console"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={<BottomNav role="admin" activeTab="finance" onTabChange={handleNavChange} />}
    >
      <div className="payment-review">
        {/* ── Hero Header ── */}
        <GlassCard className="payment-review__hero">
          <div className="payment-review__hero-left">
            <div className="payment-review__hero-icon">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <h1 className="payment-review__title">Payment Console</h1>
              <p className="payment-review__subtitle">Verify receipts, confirm advances & manage checklists</p>
            </div>
          </div>
          <button
            className="payment-review__generate-btn"
            onClick={handleGenerateRent}
            disabled={processing}
          >
            <span className="material-symbols-outlined">sync</span>
            <span>Generate Rent</span>
          </button>
        </GlassCard>

        {/* ── Tabs ── */}
        <TabNav
          tabs={[
            { key: 'rent', label: 'Rent Verifications', count: rentPayments.length },
            { key: 'advance', label: 'Pending Advance', count: pendingAgreements.length },
            { key: 'checklist', label: 'Checklist Reviews', count: pendingChecklists.length },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* ── Alerts ── */}
        {error && (
          <div className="payment-review__alert payment-review__alert--error">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="payment-review__alert payment-review__alert--success">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            <span>{message}</span>
          </div>
        )}

        {/* ── Content ── */}
        <div className="payment-review__content">
          {loading ? (
            <div className="payment-review__loading">
              {[1, 2].map(i => <Skeleton key={i} height="140px" radius="var(--radius-xl)" />)}
            </div>
          ) : activeTab === 'rent' ? (
            rentPayments.length === 0 ? (
              <div className="payment-review__empty">
                <span className="material-symbols-outlined payment-review__empty-icon">receipt_long</span>
                <p className="payment-review__empty-title">No pending receipts</p>
                <p className="payment-review__empty-desc">All rent receipts have been verified. New submissions will appear here.</p>
              </div>
            ) : (
              <div className="payment-review__grid">
                {rentPayments.map(payment => (
                  <GlassCard key={payment.id} className="payment-card">
                    <div className="payment-card__header">
                      <div className="payment-card__user">
                        <Avatar initials={payment.tenant_name?.split(' ').map(n=>n[0]).join('')} size="sm" />
                        <div>
                          <p className="payment-card__tenant">{payment.tenant_name}</p>
                          <p className="payment-card__label">{payment.label}</p>
                        </div>
                      </div>
                      <div className="payment-card__amount">₹{payment.amount.toLocaleString()}</div>
                    </div>

                    <div className="payment-card__visual">
                      {payment.screenshot_url ? (
                        <a href={payment.screenshot_url} target="_blank" rel="noreferrer">
                          <img src={payment.screenshot_url} alt="Receipt" className="payment-card__receipt-preview" />
                          <div className="payment-card__img-overlay">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                            View Full Receipt
                          </div>
                        </a>
                      ) : (
                        <div className="payment-card__no-img">
                          <span className="material-symbols-outlined" style={{ fontSize: '28px', opacity: 0.3 }}>image_not_supported</span>
                          <span>No receipt uploaded</span>
                        </div>
                      )}
                    </div>

                    <div className="payment-card__actions">
                      <SecondaryButton 
                        fullWidth
                        variant="danger"
                        onClick={() => handleVerifyRent(payment.id, false)}
                        disabled={processing}
                      >
                        Reject
                      </SecondaryButton>
                      <PrimaryButton 
                        fullWidth
                        icon="verified"
                        onClick={() => handleVerifyRent(payment.id, true)}
                        disabled={processing || !payment.screenshot_url}
                      >
                        Approve
                      </PrimaryButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )
          ) : activeTab === 'advance' ? (
            pendingAgreements.length === 0 ? (
              <div className="payment-review__empty">
                <span className="material-symbols-outlined payment-review__empty-icon">how_to_reg</span>
                <p className="payment-review__empty-title">No pending advances</p>
                <p className="payment-review__empty-desc">All advance payments have been confirmed. New tenant signings will appear here.</p>
              </div>
            ) : (
              <div className="payment-review__list">
                {pendingAgreements.map(ag => (
                  <GlassCard key={ag.id} className="ag-card">
                    <div className="ag-card__top">
                      <div className="ag-card__prop-icon">
                        <span className="material-symbols-outlined">apartment</span>
                      </div>
                      <div className="ag-card__info">
                        <h3 className="ag-card__title">{ag.property_name || 'Property'}</h3>
                        <div className="ag-card__meta">
                          <span>Tenant: <strong>{ag.tenant_name}</strong></span>
                          <span className="ag-card__dot" />
                          <span>Advance: <strong>₹{ag.security_deposit?.toLocaleString()}</strong></span>
                        </div>
                      </div>
                      <StatusBadge status="pending">AWAITING</StatusBadge>
                    </div>
                    <div className="ag-card__bottom">
                      <PrimaryButton fullWidth icon="check_circle" onClick={() => handleConfirmAdvance(ag.id)} disabled={processing}>
                        Confirm Payment & Activate
                      </PrimaryButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )
          ) : pendingChecklists.length === 0 ? (
            <div className="payment-review__empty">
              <span className="material-symbols-outlined payment-review__empty-icon">checklist</span>
              <p className="payment-review__empty-title">No pending reviews</p>
              <p className="payment-review__empty-desc">All checklist submissions have been reviewed.</p>
            </div>
          ) : (
            <div className="payment-review__list">
              {pendingChecklists.map((wf) => (
                <GlassCard key={wf.id} className="ag-card">
                  <div className="ag-card__top">
                    <div className="ag-card__prop-icon">
                      <span className="material-symbols-outlined">fact_check</span>
                    </div>
                    <div className="ag-card__info">
                      <h3 className="ag-card__title">Checklist #{wf.id.slice(0, 8)}</h3>
                      <div className="ag-card__badges">
                        {wf.police_verification_status?.toLowerCase() === 'submitted' && (
                          <StatusBadge status="pending">Police: Pending</StatusBadge>
                        )}
                        {wf.original_agreement_status?.toLowerCase() === 'submitted' && (
                          <StatusBadge status="pending">Agreement: Pending</StatusBadge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ag-card__checklist-actions">
                    {wf.police_verification_status?.toLowerCase() === 'submitted' && (
                      <div className="ag-card__review-row">
                        <p className="ag-card__review-label">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shield</span>
                          Police Verification
                          {wf.police_verification_doc_url && (
                            <a href={wf.police_verification_doc_url} target="_blank" rel="noreferrer" className="ag-card__doc-link">View Doc</a>
                          )}
                        </p>
                        <div className="ag-card__review-btns">
                          <SecondaryButton fullWidth variant="danger" onClick={() => handleChecklistReview(wf.id, 'police', false)} disabled={processing}>
                            Reject
                          </SecondaryButton>
                          <PrimaryButton fullWidth onClick={() => handleChecklistReview(wf.id, 'police', true)} disabled={processing}>
                            Approve
                          </PrimaryButton>
                        </div>
                      </div>
                    )}

                    {wf.original_agreement_status?.toLowerCase() === 'submitted' && (
                      <div className="ag-card__review-row">
                        <p className="ag-card__review-label">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                          Original Agreement
                          {wf.original_agreement_doc_url && (
                            <a href={wf.original_agreement_doc_url} target="_blank" rel="noreferrer" className="ag-card__doc-link">View Doc</a>
                          )}
                        </p>
                        <div className="ag-card__review-btns">
                          <SecondaryButton fullWidth variant="danger" onClick={() => handleChecklistReview(wf.id, 'original', false)} disabled={processing}>
                            Reject
                          </SecondaryButton>
                          <PrimaryButton fullWidth onClick={() => handleChecklistReview(wf.id, 'original', true)} disabled={processing}>
                            Approve
                          </PrimaryButton>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        subtitle={modal.subtitle}
        description={modal.description}
        variant={modal.variant}
        icon={modal.icon}
        showInput={modal.showInput}
        inputLabel={modal.inputLabel}
        inputPlaceholder={modal.inputPlaceholder}
        inputRequired={modal.inputRequired}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        loading={processing}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </PageShell>
  )
}
