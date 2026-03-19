import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, PrimaryButton, Skeleton,
} from '../../components'
import { fetchPropertiesByOwner, formatRent } from '../../services/api'
import './PortfolioHub.css'

export default function PortfolioHub() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('portfolio')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  if (!user) return null

  useEffect(() => {
    if (!user?.id) return
    fetchPropertiesByOwner(user.id).then((data) => { setProperties(data); setLoading(false) }).catch(() => setLoading(false))
  }, [user.id])

  const occupied = properties.filter((p) => p.occupancy === 'occupied').length
  const occupancyPct = properties.length ? Math.round((occupied / properties.length) * 100) : 0

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader title="Portfolio Hub" subtitle={`${properties.length} Premium Properties`} hasNotification onNotificationClick={() => navigate('/notifications')} />
      }
      bottomNav={<BottomNav role="owner" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="phub stagger-children">
        {/* Summary Cards 2×2 */}
        <div className="phub__summary-grid">
          <GlassCard className="phub__summary-card">
            <div className="phub__donut" style={{ '--pct': occupancyPct }}>
              <span className="phub__donut-text">{occupancyPct}%</span>
            </div>
            <div>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Occupancy</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{occupied}/{properties.length || 0} occupied</p>
            </div>
          </GlassCard>
          <GlassCard className="phub__summary-card">
            <div className="phub__mini-bars">
              {[60, 80, 45, 90, 70].map((h, i) => (
                <div key={i} className="phub__mini-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Monthly Revenue</p>
              <p style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--primary)' }}>—</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Coming soon</p>
            </div>
          </GlassCard>
        </div>

        {/* Alerts */}
        <GlassCard interactive onClick={() => navigate('/maintenance-log')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Active Maintenance Alerts</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>View current job queue</p>
            </div>
            <PrimaryButton fullWidth={false}>Review</PrimaryButton>
          </div>
        </GlassCard>

        {/* Quick Nav Pills */}
        <div className="phub__pills-scroll">
          <button className="phub__nav-pill phub__nav-pill--active" onClick={() => navigate('/earnings-analytics')}>Earnings Analysis</button>
          <button className="phub__nav-pill" onClick={() => navigate('/tax-tds')}>Tax & TDS</button>
          <button className="phub__nav-pill" onClick={() => navigate('/list-property')}>Add Property</button>
        </div>

        {/* Properties */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 className="section-heading" style={{ margin: 0 }}>Premium Properties</h2>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)', cursor: 'pointer' }}>View All ›</button>
          </div>
          <div className="phub__prop-list">
            {loading ? (
              [1, 2].map((i) => <Skeleton key={i} height="90px" radius="var(--radius-xl)" />)
            ) : (
              properties.map((p) => (
                <GlassCard key={p.id} interactive onClick={() => navigate(`/property/${p.id}`)}>
                  <div className="phub__prop-row">
                    <img src={p.image} alt={p.name} className="phub__prop-thumb" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`phub__occ-dot ${p.occupancy === 'occupied' ? 'phub__occ-dot--green' : 'phub__occ-dot--red'}`} />
                        <p style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}>{p.name}</p>
                      </div>
                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{p.address}</p>
                      <p style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--primary)', marginTop: '4px' }}>{formatRent(p.rent)}</p>
                    </div>
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
