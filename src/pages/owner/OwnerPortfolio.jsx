import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge,
  Skeleton,
} from '../../components'
import {
  fetchOwnerDashboard,
  fetchPropertiesByOwner,
  fetchOwnerEarnings,
  fetchOnboardingWorkflows,
  formatRent,
} from '../../services/api'
import './OwnerPortfolio.css'

export default function OwnerPortfolio() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [properties, setProperties] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  if (!user) return null

  useEffect(() => {
    if (!user) return
    fetchOwnerDashboard().then((payload) => {
      const props = payload?.properties || []
      const earn = payload?.earnings || null
      const wf = payload?.workflows || []

      setProperties(props)
      setWorkflows(wf)
      // Normalize snake_case → camelCase + defaults
      setEarnings(earn ? {
        totalRevenue: earn.total_revenue ?? 0,
        commission: earn.commission ?? 0,
        commissionRate: earn.commission_rate ?? 10,
        netPayout: earn.net_payout ?? 0,
        tdsDeducted: earn.tds_deducted ?? 0,
        tdsFYTotal: earn.tds_fy_total ?? 0,
        tdsRate: earn.tds_rate ?? 10,
        monthlyTrend: earn.monthly_trend?.length ? earn.monthly_trend : [],
      } : null)
      setLoading(false)
    }).catch(() => {
      Promise.allSettled([
        fetchPropertiesByOwner(),
        fetchOwnerEarnings(),
        fetchOnboardingWorkflows(),
      ]).then(([propsRes, earnRes, wfRes]) => {
        const props = propsRes.status === 'fulfilled' ? (propsRes.value || []) : []
        const earn = earnRes.status === 'fulfilled' ? earnRes.value : null
        const wf = wfRes.status === 'fulfilled' ? (wfRes.value || []) : []

        setProperties(props)
        setWorkflows(wf)
        setEarnings(earn ? {
          totalRevenue: earn.total_revenue ?? 0,
          commission: earn.commission ?? 0,
          commissionRate: earn.commission_rate ?? 10,
          netPayout: earn.net_payout ?? 0,
          tdsDeducted: earn.tds_deducted ?? 0,
          tdsFYTotal: earn.tds_fy_total ?? 0,
          tdsRate: earn.tds_rate ?? 10,
          monthlyTrend: earn.monthly_trend?.length ? earn.monthly_trend : [],
        } : null)
        setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [user?.id])

  const onTabChange = (tab) => {
    setActiveTab(tab)
    handleTabChange(tab)
  }

  const workflowSteps = [
    'visit_booked_at',
    'visit_approved_at',
    'agreement_generated_at',
    'tenant_signed_at',
    'advance_submitted_at',
    'advance_approved_at',
    'police_verification_completed_at',
    'original_agreement_uploaded_at',
    'tenant_activated_at',
  ]

  const getWorkflowProgress = (wf) => {
    const done = workflowSteps.filter((k) => !!wf[k]).length
    return Math.round((done / workflowSteps.length) * 100)
  }

  const stateLabel = (state) => (state || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle={`Hello, ${user?.name?.split(' ')[0] || ''}`}
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav role="owner" activeTab={activeTab} onTabChange={onTabChange} />
      }
    >
      <div className="op stagger-children">
        {/* ── Welcome ── */}
        <div className="op__welcome animate-slide-down">
          <h1 className="op__welcome-title">Welcome Back</h1>
          <p className="op__welcome-sub">Manage your property portfolio</p>
          <div className="op__portfolio-pill">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
            Portfolio Value: {user.portfolioValue || '—'}
          </div>
        </div>

        {/* ── Earnings Overview ── */}
        {earnings && (earnings.totalRevenue > 0 || earnings.netPayout > 0) && (
          <GlassCard className="op__earnings-card animate-slide-up">
            <div className="op__earnings-header">
              <div className="op__earnings-heading">
                <span className="material-symbols-outlined op__earnings-icon">account_balance_wallet</span>
                <h2 className="op__earnings-title">Earnings Overview</h2>
              </div>
              <button className="op__view-link" onClick={() => navigate('/earnings-analytics')}>Details →</button>
            </div>

            <div className="op__earnings-grid">
              <div className="op__earn-item">
                <p className="op__earn-label">Total Revenue</p>
                <p className="op__earn-value op__earn-value--primary">₹{(earnings.totalRevenue || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="op__earn-item">
                <p className="op__earn-label">Commission (10%)</p>
                <p className="op__earn-value op__earn-value--danger">-₹{(earnings.commission || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="op__earn-item op__earn-item--highlight">
                <p className="op__earn-label">Net Payout</p>
                <p className="op__earn-value op__earn-value--success">₹{(earnings.netPayout || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── 6-Month Trend ── */}
        {earnings && earnings.monthlyTrend?.length > 0 && (
          <GlassCard className="op__trend-card animate-slide-up">
            <div className="op__trend-header">
              <p className="op__trend-title">6-Month Trend</p>
              <button className="op__view-link" onClick={() => navigate('/earnings-analytics')}>View Details →</button>
            </div>
            <div className="op__chart">
              {earnings.monthlyTrend.map((m) => {
                const max = Math.max(...earnings.monthlyTrend.map((x) => x.gross))
                const h = (m.gross / max) * 100
                return (
                  <div key={m.month} className="op__chart-col">
                    <div className="op__chart-bar-wrap">
                      <div className="op__chart-bar" style={{ height: `${h}%` }} />
                    </div>
                    <span className="op__chart-label">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}

        {/* ── My Properties ── */}
        <div>
          <div className="section-heading-row">
            <h2 className="section-heading">My Properties</h2>
            <button className="section-link" onClick={() => navigate('/portfolio-hub')}>View All →</button>
          </div>
          <div className="op__property-list">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} height="100px" radius="var(--radius-xl)" />)
            ) : properties.length === 0 ? (
              <GlassCard>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>
                  No properties yet. Add your first property to get started.
                </p>
              </GlassCard>
            ) : (
              properties.map((p) => {
                return (
                  <GlassCard key={p.id} interactive className="op__prop-card" onClick={() => navigate(`/property/${p.id}`)}>
                    <div className="op__prop-row">
                      <img src={p.image} alt={p.name} className="op__prop-thumb" />
                      <div className="op__prop-info">
                        <div className="op__prop-name-row">
                          <p className="op__prop-name">{p.name}</p>
                          <StatusBadge status={p.occupancy === 'occupied' ? 'active' : 'overdue'}>
                            {p.occupancy === 'occupied' ? 'Occupied' : 'Vacant'}
                          </StatusBadge>
                        </div>
                        <p className="op__prop-address">{p.address}</p>
                        {p.tenant_id && <p className="op__prop-tenant">Tenant: {p.tenant_name || 'Occupied'}</p>}
                        <p className="op__prop-rent">{formatRent(p.rent)}</p>
                      </div>
                    </div>
                  </GlassCard>
                )
              })
            )}
          </div>
        </div>

        {/* ── Owner Oversight: Onboarding Timeline ── */}
        <div>
          <div className="section-heading-row">
            <h2 className="section-heading">Tenant Onboarding Progress</h2>
          </div>
          <div className="op__property-list">
            {workflows.length === 0 ? (
              <GlassCard>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>
                  No active onboarding workflows yet.
                </p>
              </GlassCard>
            ) : workflows.slice(0, 4).map((wf) => (
              <GlassCard key={wf.id} className="op__onb-card">
                <div className="op__onb-top">
                  <div>
                    <p className="op__onb-title">{properties.find((p) => p.id === wf.property_id)?.name || 'Property Onboarding'}</p>
                    <p className="op__onb-sub">Tenant: {properties.find((p) => p.id === wf.property_id)?.tenant_name || 'Assigned Tenant'}</p>
                  </div>
                  <StatusBadge status={wf.state === 'tenant_activated' ? 'verified' : wf.state.includes('rejected') ? 'overdue' : 'pending'}>
                    {stateLabel(wf.state)}
                  </StatusBadge>
                </div>
                <div className="op__onb-progress">
                  <div className="op__onb-progress-fill" style={{ width: `${getWorkflowProgress(wf)}%` }} />
                </div>
                <p className="op__onb-meta">{getWorkflowProgress(wf)}% complete</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Tax & TDS Card ── */}
        {earnings && (
          <GlassCard className="op__tax-card animate-slide-up">
            <div className="op__tax-header">
              <div className="op__tax-icon-wrap">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent)' }}>account_balance</span>
              </div>
              <div style={{ flex: 1 }}>
                <p className="op__tax-title">Tax & TDS Summary</p>
                <p className="op__tax-sub">TDS Deducted: ₹{earnings.tdsDeducted.toLocaleString('en-IN')}</p>
                <p className="op__tax-detail">FY Total: ₹{earnings.tdsFYTotal.toLocaleString('en-IN')} @ {earnings.tdsRate}%</p>
              </div>
            </div>
            <button className="op__tax-btn" onClick={() => navigate('/tax-tds')}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              View Tax Details
            </button>
          </GlassCard>
        )}

        {/* ── Quick Action Cards ── */}
        <div className="op__action-grid">
          <GlassCard interactive className="op__action-card" onClick={() => navigate('/list-property')}>
            <span className="material-symbols-outlined op__action-icon">add_home</span>
            <span className="op__action-label">Add Property</span>
          </GlassCard>
          <GlassCard interactive className="op__action-card" onClick={() => navigate('/maintenance-log')}>
            <span className="material-symbols-outlined op__action-icon">build</span>
            <span className="op__action-label">Repair Logs</span>
          </GlassCard>
          <GlassCard interactive className="op__action-card" onClick={() => navigate('/portfolio-hub')}>
            <span className="material-symbols-outlined op__action-icon">dashboard</span>
            <span className="op__action-label">Portfolio Hub</span>
          </GlassCard>
          <GlassCard interactive className="op__action-card" onClick={() => navigate('/inspection-hub')}>
            <span className="material-symbols-outlined op__action-icon">fact_check</span>
            <span className="op__action-label">Inspections</span>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
