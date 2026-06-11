import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GlassCard, PrimaryButton, SecondaryButton, Modal, InputField, StatusBadge,
} from '../../components'
import {
  reviewPoliceVerification,
  reviewOriginalAgreement,
  cancelOnboardingWorkflow,
  verifyPayment,
} from '../../services/api'
import './OnboardingActions.css'

/**
 * Shared action panel for SA and Manager onboarding detail pages.
 *
 * Renders:
 *   - Visit-stage CTA (link to negotiation inbox) when the workflow is still
 *     in a visit-related state.
 *   - Police verification approve/reject when the tenant has submitted.
 *   - Original agreement approve/reject when the tenant has submitted.
 *   - Cancel-onboarding destructive action (excluded once tenant is activated
 *     or already cancelled).
 *
 * Props:
 *   workflow    — the enriched workflow dict from the API
 *   visitsPath  — '/sa/visits' for SA, '/manager-visits' for manager. The
 *                 visit-stage CTA navigates here so the user lands on the
 *                 inbox where they can negotiate.
 *   onChanged   — async callback invoked after any mutation succeeds, so the
 *                 parent can re-fetch the workflow.
 */
export default function OnboardingActions({ workflow, visitsPath, onChanged }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rejectModal, setRejectModal] = useState(null) // { kind: 'police'|'agreement', reason: '' }
  const [cancelModal, setCancelModal] = useState({ open: false, reason: '' })

  const policeStatus = workflow.police_verification_status
  const agreementStatus = workflow.original_agreement_status
  const advance = workflow.advance_payment || null
  const advanceStatus = advance?.status || null
  const state = workflow.state

  const inVisitStage = ['visit_requested', 'visit_scheduled', 'visit_approved', 'visit_rejected'].includes(state)
  const isClosed = state === 'tenant_activated' || state === 'cancelled'

  const refresh = async () => { if (onChanged) await onChanged() }

  const onApprovePolice = async () => {
    setBusy(true); setError('')
    try {
      await reviewPoliceVerification(workflow.id, { approve: true })
      await refresh()
    } catch (e) { setError(e.message || 'Failed to approve') }
    setBusy(false)
  }

  const onApproveAgreement = async () => {
    setBusy(true); setError('')
    try {
      await reviewOriginalAgreement(workflow.id, { approve: true })
      await refresh()
    } catch (e) { setError(e.message || 'Failed to approve') }
    setBusy(false)
  }

  const onApproveAdvance = async () => {
    if (!advance?.id) return
    setBusy(true); setError('')
    try {
      await verifyPayment(advance.id, { approve: true })
      await refresh()
    } catch (e) { setError(e.message || 'Failed to approve advance') }
    setBusy(false)
  }

  const submitReject = async () => {
    if (!rejectModal?.reason?.trim()) { setError('Please provide a reason'); return }
    setBusy(true); setError('')
    try {
      const reason = rejectModal.reason.trim()
      if (rejectModal.kind === 'police') {
        await reviewPoliceVerification(workflow.id, { approve: false, rejection_reason: reason })
      } else if (rejectModal.kind === 'agreement') {
        await reviewOriginalAgreement(workflow.id, { approve: false, rejection_reason: reason })
      } else if (rejectModal.kind === 'advance' && advance?.id) {
        await verifyPayment(advance.id, { approve: false, rejection_reason: reason })
      }
      setRejectModal(null)
      await refresh()
    } catch (e) { setError(e.message || 'Failed to reject') }
    setBusy(false)
  }

  const submitCancel = async () => {
    if (!cancelModal.reason.trim()) { setError('Please provide a reason'); return }
    setBusy(true); setError('')
    try {
      await cancelOnboardingWorkflow(workflow.id, { reason: cancelModal.reason.trim() })
      setCancelModal({ open: false, reason: '' })
      await refresh()
    } catch (e) { setError(e.message || 'Failed to cancel') }
    setBusy(false)
  }

  return (
    <>
      <GlassCard className="oba">
        <p className="oba__section-title">Actions</p>

        {error && (
          <div className="oba__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        {isClosed && (
          <div className="oba__closed">
            {state === 'tenant_activated' ? 'Onboarding completed — no further actions.' : 'Onboarding cancelled — no further actions.'}
          </div>
        )}

        {!isClosed && (
          <>
            {/* Visit stage */}
            {inVisitStage && (
              <div className="oba__row">
                <div className="oba__row-text">
                  <p className="oba__row-title">Visit negotiation</p>
                  <p className="oba__row-sub">Accept / counter-propose / reschedule the visit.</p>
                </div>
                <SecondaryButton fullWidth={false} icon="arrow_forward" onClick={() => navigate(visitsPath)}>
                  Open Inbox
                </SecondaryButton>
              </div>
            )}

            {/* Advance / security deposit payment */}
            {advance && (
              <div className="oba__row">
                <div className="oba__row-text">
                  <p className="oba__row-title">Advance / security deposit</p>
                  <p className="oba__row-sub">
                    <StatusBadge status={advanceStatus === 'paid' ? 'verified' : advanceStatus === 'rejected' ? 'overdue' : 'pending'}>
                      {(advanceStatus || 'pending').replace(/_/g, ' ')}
                    </StatusBadge>
                    {' '}₹{(advance.amount || 0).toLocaleString('en-IN')}
                    {advance.screenshot_url && (
                      <>
                        {' '}
                        <a href={advance.screenshot_url} target="_blank" rel="noopener noreferrer" className="oba__doc-link">
                          view receipt
                        </a>
                      </>
                    )}
                  </p>
                  {advance.rejection_reason && advanceStatus === 'rejected' && (
                    <p className="oba__row-sub" style={{ color: 'var(--status-danger)' }}>
                      Rejected: {advance.rejection_reason}
                    </p>
                  )}
                </div>
                {advanceStatus === 'awaiting_verification' && (
                  <div className="oba__row-actions">
                    <SecondaryButton fullWidth={false} variant="danger" icon="close" disabled={busy} onClick={() => setRejectModal({ kind: 'advance', reason: '' })}>
                      Reject
                    </SecondaryButton>
                    <PrimaryButton fullWidth={false} icon="check" loading={busy} disabled={busy} onClick={onApproveAdvance}>
                      Approve
                    </PrimaryButton>
                  </div>
                )}
              </div>
            )}

            {/* Police verification */}
            <div className="oba__row">
              <div className="oba__row-text">
                <p className="oba__row-title">Police verification</p>
                <p className="oba__row-sub">
                  <StatusBadge status={policeStatus === 'approved' ? 'verified' : policeStatus === 'rejected' ? 'overdue' : 'pending'}>
                    {policeStatus || 'not_submitted'}
                  </StatusBadge>
                  {workflow.police_verification_doc_url && (
                    <>
                      {' '}
                      <a href={workflow.police_verification_doc_url} target="_blank" rel="noopener noreferrer" className="oba__doc-link">
                        view document
                      </a>
                    </>
                  )}
                </p>
              </div>
              {policeStatus === 'submitted' && (
                <div className="oba__row-actions">
                  <SecondaryButton fullWidth={false} variant="danger" icon="close" disabled={busy} onClick={() => setRejectModal({ kind: 'police', reason: '' })}>
                    Reject
                  </SecondaryButton>
                  <PrimaryButton fullWidth={false} icon="check" loading={busy} disabled={busy} onClick={onApprovePolice}>
                    Approve
                  </PrimaryButton>
                </div>
              )}
            </div>

            {/* Original agreement */}
            <div className="oba__row">
              <div className="oba__row-text">
                <p className="oba__row-title">Original rental agreement</p>
                <p className="oba__row-sub">
                  <StatusBadge status={agreementStatus === 'approved' ? 'verified' : agreementStatus === 'rejected' ? 'overdue' : 'pending'}>
                    {agreementStatus || 'not_submitted'}
                  </StatusBadge>
                  {workflow.original_agreement_doc_url && (
                    <>
                      {' '}
                      <a href={workflow.original_agreement_doc_url} target="_blank" rel="noopener noreferrer" className="oba__doc-link">
                        view document
                      </a>
                    </>
                  )}
                </p>
              </div>
              {agreementStatus === 'submitted' && (
                <div className="oba__row-actions">
                  <SecondaryButton fullWidth={false} variant="danger" icon="close" disabled={busy} onClick={() => setRejectModal({ kind: 'agreement', reason: '' })}>
                    Reject
                  </SecondaryButton>
                  <PrimaryButton fullWidth={false} icon="check" loading={busy} disabled={busy} onClick={onApproveAgreement}>
                    Approve
                  </PrimaryButton>
                </div>
              )}
            </div>

            {/* Cancel entire onboarding */}
            <div className="oba__row oba__row--danger">
              <div className="oba__row-text">
                <p className="oba__row-title">Cancel onboarding</p>
                <p className="oba__row-sub">Stops the workflow for this property + tenant. This is final.</p>
              </div>
              <SecondaryButton fullWidth={false} variant="danger" icon="cancel" disabled={busy} onClick={() => setCancelModal({ open: true, reason: '' })}>
                Cancel
              </SecondaryButton>
            </div>
          </>
        )}
      </GlassCard>

      {/* Reject modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => { if (!busy) { setRejectModal(null); setError('') } }}
        title={
          rejectModal?.kind === 'police' ? 'Reject police verification'
            : rejectModal?.kind === 'advance' ? 'Reject advance payment'
              : 'Reject original agreement'
        }
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <InputField
            label="Rejection reason"
            placeholder="Why is this document being rejected?"
            value={rejectModal?.reason || ''}
            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
          />
          <PrimaryButton icon="send" loading={busy} disabled={busy} onClick={submitReject}>
            Submit rejection
          </PrimaryButton>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelModal.open}
        onClose={() => { if (!busy) { setCancelModal({ open: false, reason: '' }); setError('') } }}
        title="Cancel onboarding"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <InputField
            label="Reason for cancelling"
            placeholder="Tenant backed out / fraud detected / etc."
            value={cancelModal.reason}
            onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
          />
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--status-danger)' }}>
            This sets the workflow to CANCELLED and cannot be undone.
          </p>
          <PrimaryButton icon="cancel" loading={busy} disabled={busy} onClick={submitCancel}>
            Cancel onboarding
          </PrimaryButton>
        </div>
      </Modal>
    </>
  )
}
