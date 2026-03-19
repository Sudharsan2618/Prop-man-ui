import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, TabNav,
} from '../../components'
import { fetchOwnerEarnings } from '../../services/api'
import './EarningsAnalytics.css'

export default function EarningsAnalytics() {
  const navigate = useNavigate()
  const [periodTab, setPeriodTab] = useState('month')
  const [earnings, setEarnings] = useState(null)

  useEffect(() => {
    fetchOwnerEarnings().then(setEarnings)
  }, [])

  if (!earnings) return null

  const grossRent = earnings.totalRevenue || 0
  const commission = earnings.commission || 0
  const netPayout = earnings.netPayout || 0

  return (
    <PageShell header={<SubPageHeader title="Earnings Analytics" onBack={() => navigate(-1)} />}>
      <div className="ea animate-fade-in">
        {/* Period Tabs */}
        <TabNav
          tabs={[
            { key: 'month', label: 'This Month' },
            { key: '3months', label: 'Last 3 Months' },
            { key: 'year', label: 'Last Year' },
            { key: 'custom', label: 'Custom' },
          ]}
          activeTab={periodTab}
          onTabChange={setPeriodTab}
        />

        {/* Net Payout Hero */}
        <GlassCard variant="highlighted">
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Net Payout</p>
          <p className="ea__hero-amount">₹{netPayout.toLocaleString('en-IN')}</p>
          <span className="ea__trend-badge">↗ +5.2% vs last month</span>
        </GlassCard>

        {/* Breakdown */}
        <div className="ea__breakdown">
          <GlassCard className="ea__bk-card">
            <p className="ea__bk-label">GROSS RENT</p>
            <p className="ea__bk-value">₹{grossRent.toLocaleString('en-IN')}</p>
          </GlassCard>
          <GlassCard className="ea__bk-card">
            <p className="ea__bk-label">COMMISSION (10%)</p>
            <p className="ea__bk-value" style={{ color: '#EF4444' }}>-₹{commission.toLocaleString('en-IN')}</p>
          </GlassCard>
        </div>

        <GlassCard>
          <div style={{ textAlign: 'center', display: 'grid', gap: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '42px', color: 'var(--accent)' }}>query_stats</span>
            <p style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>Advanced Analytics Coming Soon</p>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              Property-level breakdowns, trend charts, and downloadable statements are being prepared.
            </p>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  )
}
