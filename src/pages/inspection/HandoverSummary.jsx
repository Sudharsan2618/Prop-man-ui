import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton,
} from '../../components'
import './HandoverSummary.css'

const ROOMS_SUMMARY = [
  { name: 'Living Room', status: 'good', flagged: 0, items: ['Walls: Good', 'Flooring: Fair (minor scratch)', 'Windows: Good'] },
  { name: 'Master Bedroom', status: 'flagged', flagged: 2, items: ['Walls: Good', 'Flooring: Good', 'Wardrobe: Damaged (broken hinge)', 'Windows: Fair (stain marks)'] },
  { name: 'Kitchen', status: 'good', flagged: 0, items: ['Walls: Good', 'Flooring: Good', 'Countertop: Good', 'Plumbing: Good'] },
  { name: 'Bathroom 1', status: 'flagged', flagged: 1, items: ['Tiles: Good', 'Plumbing: Fair', 'Mirror: Damaged (crack)'] },
  { name: 'Balcony', status: 'good', flagged: 0, items: ['Railing: Good', 'Flooring: Good'] },
]

export default function HandoverSummary() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)
  const [managerSigned, setManagerSigned] = useState(false)
  const [tenantSigned, setTenantSigned] = useState(false)
  const [managerConfirm, setManagerConfirm] = useState(false)
  const [tenantConfirm, setTenantConfirm] = useState(false)

  const toggleRoom = (idx) => setExpanded(expanded === idx ? null : idx)

  return (
    <PageShell
      header={
        <SubPageHeader
          title="Handover Summary"
          onBack={() => navigate(-1)}
          rightAction={
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '24px' }}>more_vert</span>
            </button>
          }
        />
      }
      stickyFooter={
        <PrimaryButton
          icon="sync"
          disabled={!managerConfirm || !tenantConfirm}
          onClick={() => navigate('/')}
        >
          🔄 Finalize & Sync
        </PrimaryButton>
      }
    >
      <div className="hs animate-fade-in">
        {/* Property Info */}
        <GlassCard>
          <div className="hs__prop-row">
            <div className="hs__prop-thumb">
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--text-tertiary)' }}>apartment</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>The Azure Horizon, Apt 4B</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Bandra West, Mumbai</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', marginTop: '2px' }}>March 5, 2026 • Final Inspection</p>
            </div>
          </div>
        </GlassCard>

        {/* Score Cards */}
        <div className="hs__scores">
          <GlassCard className="hs__score-card hs__score-card--hero">
            <p className="hs__score-value" style={{ color: 'var(--primary)' }}>8.5/10</p>
            <p className="hs__score-label">SCORE</p>
          </GlassCard>
          <GlassCard className="hs__score-card">
            <p className="hs__score-value" style={{ color: '#16A34A' }}>45</p>
            <p className="hs__score-label">Good</p>
          </GlassCard>
          <GlassCard className="hs__score-card">
            <p className="hs__score-value" style={{ color: '#F59E0B' }}>5</p>
            <p className="hs__score-label">Fair</p>
          </GlassCard>
          <GlassCard className="hs__score-card">
            <p className="hs__score-value" style={{ color: '#EF4444' }}>2</p>
            <p className="hs__score-label">Damaged</p>
          </GlassCard>
        </div>

        {/* Room-by-Room Summary */}
        <div>
          <h2 className="section-heading">Room-by-Room Summary</h2>
          <div className="hs__rooms">
            {ROOMS_SUMMARY.map((room, idx) => (
              <GlassCard key={room.name} interactive className="hs__room-card" onClick={() => toggleRoom(idx)}>
                <div className="hs__room-header">
                  <span className="material-symbols-outlined" style={{
                    fontSize: '20px',
                    color: room.status === 'flagged' ? '#F59E0B' : '#22C55E',
                  }}>
                    {room.status === 'flagged' ? 'warning' : 'check_circle'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--fw-medium)' }}>{room.name}</p>
                    {room.flagged > 0 && (
                      <p style={{ fontSize: 'var(--fs-caption)', color: '#F59E0B' }}>{room.flagged} items flagged</p>
                    )}
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)', fontSize: '20px', transition: 'transform 0.2s', transform: expanded === idx ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </div>
                {expanded === idx && (
                  <div className="hs__room-details animate-slide-up">
                    <ul className="hs__detail-list">
                      {room.items.map((item, i) => (
                        <li key={i} className="hs__detail-item">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Digital Signatures */}
        <div>
          <h2 className="section-heading">Digital Signatures</h2>

          {/* Property Manager */}
          <GlassCard className="hs__sig-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Property Manager</p>
              <button className="hs__clear-link" onClick={() => setManagerSigned(false)}>Clear</button>
            </div>
            <div
              className={`hs__sig-pad ${managerSigned ? 'hs__sig-pad--signed' : ''}`}
              onClick={() => setManagerSigned(true)}
            >
              {managerSigned
                ? <span style={{ fontFamily: "'Caveat', cursive", fontSize: '24px', color: 'var(--primary)' }}>Admin User</span>
                : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Tap to sign</span>
              }
            </div>
            <label className="hs__confirm-label">
              <input type="checkbox" checked={managerConfirm} onChange={() => setManagerConfirm(!managerConfirm)} className="hs__confirm-check" />
              <span>I confirm this inspection report is accurate</span>
            </label>
          </GlassCard>

          {/* Tenant */}
          <GlassCard className="hs__sig-card" style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Tenant</p>
              <button className="hs__clear-link" onClick={() => setTenantSigned(false)}>Clear</button>
            </div>
            <div
              className={`hs__sig-pad ${tenantSigned ? 'hs__sig-pad--signed' : ''}`}
              onClick={() => setTenantSigned(true)}
            >
              {tenantSigned
                ? <span style={{ fontFamily: "'Caveat', cursive", fontSize: '24px', color: 'var(--primary)' }}>Priya Sharma</span>
                : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Tap to sign</span>
              }
            </div>
            <label className="hs__confirm-label">
              <input type="checkbox" checked={tenantConfirm} onChange={() => setTenantConfirm(!tenantConfirm)} className="hs__confirm-check" />
              <span>I accept the inspection findings</span>
            </label>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
