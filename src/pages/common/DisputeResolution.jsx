import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, Avatar, BottomNav,
} from '../../components'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import './DisputeResolution.css'

export default function DisputeResolution() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const { role } = useRole()
  const [activeTab, setActiveTab] = useState('disputes')

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={<SubPageHeader title="Dispute Resolution" onBack={() => navigate(-1)} />}
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="dr animate-fade-in">
        {/* Case Info */}
        <GlassCard className="dr__alert-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="material-symbols-outlined" style={{ color: '#F59E0B', fontSize: '24px' }}>warning</span>
            <div>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Case ID: #84920</p>
              <StatusBadge status="pending">Under Review</StatusBadge>
            </div>
          </div>
        </GlassCard>

        {/* Owner's Claim */}
        <GlassCard className="dr__claim dr__claim--owner">
          <div className="dr__claim-header">
            <Avatar initials="RM" size="sm" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Rajesh Mehta</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Owner • March 1, 2026</p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The kitchen countertop has significant water damage and the bathroom tiles are cracked. Requesting full repair costs of ₹12,500 to be deducted from the security deposit.
          </p>
          <div className="dr__photos">
            {[1, 2].map((i) => (
              <div key={i} className="dr__photo-thumb">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>image</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Tenant's Response */}
        <GlassCard className="dr__claim dr__claim--tenant">
          <div className="dr__claim-header">
            <Avatar initials="PS" size="sm" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Priya Sharma</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Tenant • March 2, 2026</p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The countertop damage was pre-existing and was noted during move-in inspection. I have photographic evidence from the initial walkthrough.
          </p>
          <div className="dr__photos">
            <div className="dr__photo-thumb">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>image</span>
            </div>
          </div>
        </GlassCard>

        {/* Mediator */}
        <GlassCard className="dr__claim dr__claim--mediator">
          <p className="dr__mediator-overline">OFFICIAL MEDIATOR COMMUNICATION</p>
          <div className="dr__claim-header">
            <Avatar initials="AU" size="sm" verified />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>System Admin</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Mediator • March 3, 2026</p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            After reviewing both parties' evidence, the countertop damage appears in the move-in inspection photos. We recommend a partial settlement for the bathroom tile repair only.
          </p>
        </GlassCard>

        {/* Action Buttons */}
        <div className="dr__actions">
          <PrimaryButton icon="handshake" onClick={() => navigate('/settlement-proposal')}>Propose Settlement</PrimaryButton>
          <SecondaryButton variant="danger" icon="gavel">Escalate to Admin</SecondaryButton>
        </div>
      </div>
    </PageShell>
  )
}
