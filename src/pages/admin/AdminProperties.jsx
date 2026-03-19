import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, StatusBadge, TabNav,
} from '../../components'
import { fetchProperties, formatRent } from '../../services/api'
import './AdminProperties.css'

export default function AdminProperties() {
  const { user } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('properties')
  const [filter, setFilter] = useState('all')
  const [properties, setProperties] = useState([])

  useEffect(() => {
    fetchProperties().then(props => setProperties(props || [])).catch(() => {})
  }, [])

  const filtered = filter === 'all' ? properties
    : filter === 'occupied' ? properties.filter((p) => p.occupancy === 'occupied')
    : properties.filter((p) => p.occupancy !== 'occupied')

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Property Management"
          avatarText={user?.initials}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={
        <BottomNav role="admin" activeTab={activeTab} onTabChange={handleTabChange} />
      }
    >
      <div className="ap stagger-children">
        {/* ── Stats ── */}
        <div className="ap__stats-row">
          <GlassCard className="ap__stat">
            <p className="ap__stat-value">{properties.length}</p>
            <p className="ap__stat-label">Total</p>
          </GlassCard>
          <GlassCard className="ap__stat">
            <p className="ap__stat-value" style={{ color: 'var(--status-success)' }}>
              {properties.filter((p) => p.occupancy === 'occupied').length}
            </p>
            <p className="ap__stat-label">Occupied</p>
          </GlassCard>
          <GlassCard className="ap__stat">
            <p className="ap__stat-value" style={{ color: 'var(--status-warning)' }}>
              {properties.filter((p) => p.occupancy !== 'occupied').length}
            </p>
            <p className="ap__stat-label">Vacant</p>
          </GlassCard>
        </div>

        {/* ── Filter Tabs ── */}
        <TabNav
          tabs={[
            { key: 'all', label: 'All', count: properties.length },
            { key: 'occupied', label: 'Occupied', count: properties.filter((p) => p.occupancy === 'occupied').length },
            { key: 'vacant', label: 'Vacant', count: properties.filter((p) => p.occupancy !== 'occupied').length },
          ]}
          activeTab={filter}
          onTabChange={setFilter}
        />

        {/* ── Property List ── */}
        <div className="ap__list">
          {filtered.map((p) => {
            return (
              <GlassCard key={p.id} interactive className="ap__card" onClick={() => navigate(`/property/${p.id}`)}>
                <div className="ap__card-row">
                  <img src={p.image} alt={p.name} className="ap__card-thumb" />
                  <div className="ap__card-info">
                    <div className="ap__card-name-row">
                      <p className="ap__card-name">{p.name}</p>
                      <StatusBadge status={p.occupancy === 'occupied' ? 'active' : 'overdue'}>
                        {p.occupancy === 'occupied' ? 'Occupied' : 'Vacant'}
                      </StatusBadge>
                    </div>
                    <p className="ap__card-address">{p.address}</p>
                    {p.tenant_id && <p className="ap__card-tenant">Tenant: {p.tenant_name || 'Occupied'}</p>}
                    <div className="ap__card-bottom">
                      <span className="ap__card-rent">{formatRent(p.rent)}</span>
                      <span className="ap__card-bhk">{p.bhk} • {p.sqft} sqft</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
