import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, Skeleton,
} from '../../components'
import { fetchAdminFinancials, fetchJobs } from '../../services/api'
import './AdminFinancial.css'

export default function AdminFinancial() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('finance')
  const [financials, setFinancials] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAdminFinancials(), fetchJobs()]).then(([fin, jobs]) => {
      setFinancials(fin)
      setInvoices(jobs.filter((j) => j.status === 'completed' || j.status === 'active'))
      setLoading(false)
    })
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Financial Console"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={<BottomNav role="admin" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="af stagger-children">
        {/* ── Overview Cards ── */}
        {financials && (
          <div className="af__overview-grid">
            <GlassCard className="af__ov-card animate-slide-up">
              <div className="af__ov-icon-wrap" style={{ background: 'rgba(27,42,74,0.08)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>savings</span>
              </div>
              <div>
                <p className="af__ov-label">Escrowed Funds</p>
                <p className="af__ov-value">₹{(financials.escrowedFunds / 100).toLocaleString('en-IN')}</p>
                <span className="af__ov-trend af__ov-trend--up">{financials.escrowedTrend}</span>
              </div>
            </GlassCard>
            <GlassCard className="af__ov-card animate-slide-up">
              <div className="af__ov-icon-wrap" style={{ background: 'rgba(212,168,67,0.1)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--accent)' }}>receipt_long</span>
              </div>
              <div>
                <p className="af__ov-label">Pending Invoices</p>
                <p className="af__ov-value">₹{(financials.pendingInvoices / 100).toLocaleString('en-IN')}</p>
                <span className="af__ov-trend af__ov-trend--warn">{financials.pendingInvoiceCount} invoices</span>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Rent Splits ── */}
        {financials && (
          <div>
            <div className="section-heading-row">
              <h2 className="section-heading">Rent Splits</h2>
              <button className="section-link">View All →</button>
            </div>
            <div className="af__split-list">
              {financials.rentSplits.map((split) => (
                <GlassCard key={split.propertyId} className="af__split-card animate-slide-up">
                  <div className="af__split-header">
                    <p className="af__split-name">{split.propertyName}</p>
                    <StatusBadge status={split.status === 'ready' ? 'active' : 'pending'}>
                      {split.status === 'ready' ? 'Ready' : 'Pending'}
                    </StatusBadge>
                  </div>
                  <div className="af__split-details">
                    <div className="af__split-row">
                      <span>Gross Rent</span>
                      <span className="af__split-amount">₹{split.grossRent.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="af__split-row">
                      <span>Commission (10%)</span>
                      <span style={{ color: 'var(--status-danger)' }}>-₹{split.commission.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="af__split-row af__split-row--total">
                      <span>Owner Payout</span>
                      <span className="af__split-total">₹{split.ownerPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <button className="af__split-btn">
                    {split.status === 'ready' ? 'Process Split' : 'Review Details'}
                  </button>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Service Invoices ── */}
        <div>
          <div className="section-heading-row">
            <h2 className="section-heading">Service Invoices</h2>
            <span className="af__new-badge">3 New</span>
          </div>
          <div className="af__invoice-list">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} height="120px" radius="var(--radius-xl)" />)
            ) : (
              invoices.slice(0, 3).map((inv) => (
                <GlassCard key={inv.id} className="af__inv-card animate-slide-up">
                  <div className="af__inv-top">
                    <div className="af__inv-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{inv.icon}</span>
                    </div>
                    <div className="af__inv-info">
                      <p className="af__inv-name">{inv.providerName || 'John Doe'}</p>
                      <p className="af__inv-desc">{inv.serviceType} — {inv.description}</p>
                    </div>
                    <p className="af__inv-amount">₹{inv.estimatedCost.max}</p>
                  </div>
                  <div className="af__inv-actions">
                    <button className="af__inv-btn af__inv-btn--reject">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                      Reject
                    </button>
                    <button className="af__inv-btn af__inv-btn--approve">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                      Approve
                    </button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
