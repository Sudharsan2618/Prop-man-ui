import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, StatusBadge,
} from '../../components'
import './KycVerification.css'

const DOCUMENTS = [
  { id: 'pan', label: 'PAN Card', status: 'verified', icon: 'credit_card' },
  { id: 'aadhaar', label: 'Aadhaar / Passport', status: 'pending', icon: 'badge' },
  { id: 'cheque', label: 'Bank Cheque', status: 'upload', icon: 'account_balance' },
]

export default function KycVerification() {
  const navigate = useNavigate()

  return (
    <PageShell
      header={
        <SubPageHeader
          title="Identity Verification"
          onBack={() => navigate(-1)}
          leftIcon="shield"
        />
      }
      stickyFooter={
        <PrimaryButton icon="verified_user">Submit Verification</PrimaryButton>
      }
    >
      <div className="kyc animate-fade-in">
        {/* Documents */}
        <div>
          <p className="kyc__overline">REQUIRED DOCUMENTS</p>
          <div className="kyc__doc-list">
            {DOCUMENTS.map((doc) => (
              <GlassCard key={doc.id} className={`kyc__doc-card ${doc.status === 'upload' ? 'kyc__doc-card--highlight' : ''}`}>
                <div className="kyc__doc-row">
                  <div className={`kyc__doc-icon kyc__doc-icon--${doc.status}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{doc.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--fw-semibold)' }}>{doc.label}</p>
                    <StatusBadge status={doc.status === 'verified' ? 'verified' : doc.status === 'pending' ? 'pending' : 'escrowed'}>
                      {doc.status === 'verified' ? '✓ VERIFIED' : doc.status === 'pending' ? '◐ PENDING' : 'Upload Required'}
                    </StatusBadge>
                  </div>
                  {doc.status === 'upload' && (
                    <PrimaryButton fullWidth={false} style={{ padding: '6px 14px', fontSize: '12px' }}>Upload</PrimaryButton>
                  )}
                  {doc.status === 'verified' && (
                    <span className="material-symbols-outlined" style={{ color: '#16A34A', fontSize: '22px' }}>check_circle</span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Live Selfie */}
        <div>
          <div className="kyc__selfie-header">
            <p className="kyc__overline" style={{ margin: 0 }}>LIVE SELFIE</p>
            <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Step 2 of 2</span>
          </div>
          <GlassCard className="kyc__selfie-card">
            <div className="kyc__camera-preview">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)' }}>person</span>
            </div>
            <p style={{ textAlign: 'center', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', margin: 'var(--space-3) 0' }}>
              Take a clear photo of your face
            </p>
            <PrimaryButton icon="photo_camera">Capture Selfie</PrimaryButton>
          </GlassCard>
        </div>

        {/* Trust Badges */}
        <div className="kyc__badges">
          <div className="kyc__badge">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>verified_user</span>
            <span>RBI Compliant</span>
          </div>
          <div className="kyc__badge">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>lock</span>
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
