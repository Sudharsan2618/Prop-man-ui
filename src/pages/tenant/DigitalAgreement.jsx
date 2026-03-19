import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Avatar, TabNav, FileUploadField, Skeleton,
} from '../../components'
import {
  fetchAgreementById,
  signAgreement,
  fetchOnboardingWorkflows,
  submitPoliceVerification,
  submitOriginalAgreement,
  uploadDocument,
} from '../../services/api'
import { useRole } from '../../context/RoleContext'
import './DigitalAgreement.css'

function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DigitalAgreement() {
  const { id: agreementId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useRole()
  const [signTab, setSignTab] = useState('type')
  const [typedSignature, setTypedSignature] = useState('')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')
  const [agreement, setAgreement] = useState(location.state?.agreement || null)
  const [loading, setLoading] = useState(!agreement)
  const [workflow, setWorkflow] = useState(null)
  const [submittingPolice, setSubmittingPolice] = useState(false)
  const [submittingOriginal, setSubmittingOriginal] = useState(false)
  const [policeFile, setPoliceFile] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)

  useEffect(() => {
    if (!agreement && agreementId) {
      fetchAgreementById(agreementId)
        .then((data) => { setAgreement(data); setLoading(false) })
        .catch((err) => { setError(err.message); setLoading(false) })
    }
  }, [agreementId])

  useEffect(() => {
    if (!agreement?.property_id) return
    fetchOnboardingWorkflows({ property_id: agreement.property_id })
      .then((items) => setWorkflow(items?.[0] || null))
      .catch(() => {})
  }, [agreement?.property_id])

  const handleChecklistSubmit = async (type) => {
    const file = type === 'police' ? policeFile : originalFile
    if (!workflow?.id || !file) return
    setError('')
    const setSubmitting = type === 'police' ? setSubmittingPolice : setSubmittingOriginal
    setSubmitting(true)
    try {
      const url = await uploadDocument(file, 'onboarding-checklists')
      if (type === 'police') {
        await submitPoliceVerification(workflow.id, url)
        setPoliceFile(null)
      } else {
        await submitOriginalAgreement(workflow.id, url)
        setOriginalFile(null)
      }
      const items = await fetchOnboardingWorkflows({ property_id: agreement.property_id })
      setWorkflow(items?.[0] || null)
    } catch (err) {
      setError(err.message || 'Failed to upload checklist document')
    }
    setSubmitting(false)
  }

  const handleSign = async () => {
    const sig = signTab === 'type' ? typedSignature.trim() : 'drawn-signature'
    if (!sig) { setError('Please provide your signature'); return }
    setError('')
    setSigning(true)
    try {
      const result = await signAgreement(agreementId, sig)
      setAgreement(result.data)
      // After signing, it will show the "Awaiting Payment confirmation" state
    } catch (err) {
      setError(err.message || 'Failed to sign agreement')
    }
    setSigning(false)
  }

  if (loading) return (
    <PageShell header={<SubPageHeader title="Rental Agreement" onBack={() => navigate(-1)} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
        {[1, 2, 3].map(i => <Skeleton key={i} height="120px" radius="var(--radius-xl)" />)}
      </div>
    </PageShell>
  )

  if (!agreement) return (
    <PageShell header={<SubPageHeader title="Rental Agreement" onBack={() => navigate(-1)} />}>
      <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
        <p>{error || 'Agreement not found'}</p>
        <PrimaryButton onClick={() => navigate(-1)} style={{ marginTop: 'var(--space-4)' }}>Go Back</PrimaryButton>
      </div>
    </PageShell>
  )

  const statusMap = {
    awaiting_signature: { label: 'AWAITING SIGNATURE', type: 'pending' },
    awaiting_payment: { label: 'AWAITING ADVANCE CONFIRMATION', type: 'pending' },
    active: { label: 'ACTIVE', type: 'verified' },
    cancelled: { label: 'CANCELLED', type: 'overdue' },
  }
  const statusInfo = statusMap[agreement.status] || { label: agreement.status?.toUpperCase(), type: 'pending' }

  const alreadySigned = !!agreement.tenant_signature

  return (
    <PageShell
      header={
        <SubPageHeader
          title="Rental Agreement"
          onBack={() => navigate(-1)}
          rightAction={
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>more_vert</span>
            </button>
          }
        />
      }
    >
      <div className="agreement animate-fade-in">
        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          <StatusBadge status={statusInfo.type}>{statusInfo.label}</StatusBadge>
        </div>

        {/* Error */}
        {error && (
          <div className="agreement__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Instructions */}
        <p className="agreement__instructions">
          {agreement.status === 'active'
            ? 'This agreement is active and confirmed.'
            : agreement.status === 'awaiting_payment'
              ? 'Signature captured! Please pay the advance amount offline. The administrator will confirm once received.'
              : 'Please review the system-generated residential lease agreement. Once you sign, the administrator will verify your advance payment to activate the agreement.'}
        </p>

        {/* Contracting Parties */}
        <div>
          <p className="agreement__overline">PARTIES</p>
          <div className="agreement__parties">
            <GlassCard className="agreement__party">
              <div className="agreement__party-row">
                <Avatar initials={getInitials(agreement.tenant_name)} size="md" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'var(--fw-semibold)' }}>{agreement.tenant_name || 'Tenant'}</p>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                    {agreement.tenant_signature ? '✅ Signed' : 'Pending signature'}
                  </p>
                </div>
              </div>
              <span className="agreement__role-label">Tenant</span>
            </GlassCard>
            <GlassCard className="agreement__party">
              <div className="agreement__party-row">
                <Avatar initials={getInitials(agreement.owner_name)} size="md" verified />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'var(--fw-semibold)' }}>{agreement.owner_name || 'Landlord'}</p>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                    {agreement.status === 'active' ? '✅ Finalized' : 'System Generated'}
                  </p>
                </div>
              </div>
              <span className="agreement__role-label">Landlord</span>
            </GlassCard>
          </div>
        </div>

        {/* Document Preview */}
        <div>
          <div className="agreement__doc-header">
            <p className="agreement__overline">DOCUMENT CONTENT</p>
          </div>
          <GlassCard className="agreement__document">
            <h3 className="agreement__doc-title">RESIDENTIAL LEASE AGREEMENT</h3>
            <div className="agreement__doc-summary">
              <p className="agreement__doc-text">
                <strong>Property:</strong>{' '}
                <span className="agreement__highlight">{agreement.property_name || agreement.property_id}</span>
              </p>
              <p className="agreement__doc-text">
                <strong>Monthly Rent:</strong>{' '}
                <span className="agreement__highlight">₹{(agreement.rent_amount || 0).toLocaleString('en-IN')}</span>
              </p>
              <p className="agreement__doc-text">
                <strong>Security Deposit:</strong>{' '}
                <span className="agreement__highlight">₹{(agreement.security_deposit || 0).toLocaleString('en-IN')}</span>
              </p>
              <p className="agreement__doc-text">
                <strong>Lease Period:</strong>{' '}
                <span className="agreement__highlight">{formatDate(agreement.lease_start)}</span> to{' '}
                <span className="agreement__highlight">{formatDate(agreement.lease_end)}</span>
              </p>
            </div>
            
            {agreement.terms_text && (
              <div className="agreement__full-text-container">
                <p className="agreement__overline" style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>FULL TERMS</p>
                <pre className="agreement__full-text">{agreement.terms_text}</pre>
              </div>
            )}
          </GlassCard>
        </div>

        {/* E-Signature (only show if not yet signed) */}
        {agreement.status === 'awaiting_signature' && (
          <>
            <div>
              <p className="agreement__overline">E-SIGNATURE</p>
              <GlassCard>
                <TabNav
                  tabs={[
                    { key: 'draw', label: 'DRAW' },
                    { key: 'type', label: 'TYPE' },
                  ]}
                  activeTab={signTab}
                  onTabChange={setSignTab}
                />
                <div className="agreement__sign-area">
                  {signTab === 'draw' && (
                    <div className="agreement__sign-canvas">
                      <p className="agreement__sign-placeholder">Sign here</p>
                      <div className="agreement__sign-baseline" />
                    </div>
                  )}
                  {signTab === 'type' && (
                    <input
                      type="text"
                      className="agreement__sign-input"
                      placeholder="Type your full name"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      style={{ fontFamily: "'Caveat', cursive", fontSize: '24px' }}
                    />
                  )}
                </div>
              </GlassCard>
            </div>

            <PrimaryButton icon="check" loading={signing} disabled={signing} onClick={handleSign}>
              Digitally Sign Agreement
            </PrimaryButton>
          </>
        )}

        {/* Awaiting Payment State */}
        {agreement.status === 'awaiting_payment' && (
          <GlassCard>
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)' }}>pending_actions</span>
              <p style={{ fontWeight: 'var(--fw-semibold)', marginTop: 'var(--space-2)' }}>Awaiting Advance Payment</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                Your signature has been recorded. Please pay the security deposit of ₹{agreement.security_deposit?.toLocaleString('en-IN')} offline. 
                The administrator will update the status once confirmed.
              </p>
            </div>
          </GlassCard>
        )}

        {/* Active State */}
        {agreement.status === 'active' && (
          <GlassCard>
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--status-success)' }}>verified</span>
              <p style={{ fontWeight: 'var(--fw-semibold)', marginTop: 'var(--space-2)' }}>Agreement is Active</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                The agreement is fully executed. You can now proceed with move-in on {formatDate(agreement.lease_start)}.
              </p>
              <PrimaryButton icon="download" style={{ marginTop: 'var(--space-4)' }} onClick={() => window.print()}>
                Download Copy
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {workflow && (
          <GlassCard>
            <p className="agreement__overline">TENANT CHECKLIST DOCUMENTS</p>
            <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <p style={{ fontWeight: 'var(--fw-semibold)' }}>Police Verification Document</p>
                <StatusBadge status={workflow.police_verification_status === 'approved' ? 'verified' : workflow.police_verification_status === 'rejected' ? 'overdue' : 'pending'}>
                  {(workflow.police_verification_status || 'not_submitted').replace(/_/g, ' ').toUpperCase()}
                </StatusBadge>
                {workflow.police_verification_rejection_reason && (
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--status-danger)' }}>
                    Rejected: {workflow.police_verification_rejection_reason}
                  </p>
                )}
                <FileUploadField
                  label="Police Verification"
                  hint="Upload PDF, JPG, or PNG"
                  accept="image/*,.pdf"
                  file={policeFile}
                  onFileSelect={setPoliceFile}
                  disabled={submittingPolice || workflow.police_verification_status === 'approved'}
                  buttonText={workflow.police_verification_status === 'approved' ? 'Already Approved' : 'Upload Police Doc'}
                />
                {policeFile && workflow.police_verification_status !== 'approved' && (
                  <PrimaryButton
                    fullWidth
                    icon="cloud_upload"
                    loading={submittingPolice}
                    disabled={submittingPolice}
                    onClick={() => handleChecklistSubmit('police')}
                  >
                    Submit Police Verification
                  </PrimaryButton>
                )}
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <p style={{ fontWeight: 'var(--fw-semibold)' }}>Original Agreement Copy</p>
                <StatusBadge status={workflow.original_agreement_status === 'approved' ? 'verified' : workflow.original_agreement_status === 'rejected' ? 'overdue' : 'pending'}>
                  {(workflow.original_agreement_status || 'not_submitted').replace(/_/g, ' ').toUpperCase()}
                </StatusBadge>
                {workflow.original_agreement_rejection_reason && (
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--status-danger)' }}>
                    Rejected: {workflow.original_agreement_rejection_reason}
                  </p>
                )}
                <FileUploadField
                  label="Original Agreement"
                  hint="Upload signed copy (PDF/JPG/PNG)"
                  accept="image/*,.pdf"
                  file={originalFile}
                  onFileSelect={setOriginalFile}
                  disabled={submittingOriginal || workflow.original_agreement_status === 'approved'}
                  buttonText={workflow.original_agreement_status === 'approved' ? 'Already Approved' : 'Upload Original Doc'}
                />
                {originalFile && workflow.original_agreement_status !== 'approved' && (
                  <PrimaryButton
                    fullWidth
                    icon="cloud_upload"
                    loading={submittingOriginal}
                    disabled={submittingOriginal}
                    onClick={() => handleChecklistSubmit('original')}
                  >
                    Submit Original Agreement
                  </PrimaryButton>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Terms Note */}
        <p className="agreement__terms-note">
          By signing, you agree to the LuxeLife property management <a href="#" style={{ color: 'var(--primary)' }}>Terms & Conditions</a>.
        </p>
      </div>
    </PageShell>
  )
}

