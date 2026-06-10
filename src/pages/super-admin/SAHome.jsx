import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSuperAdminDashboard } from '../../services/api'
import { reportError } from '../../utils/errors'
import SALayout from './SALayout'
import './SAHome.css'

export default function SAHome() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    user_count: 0,
    manager_count: 0,
    property_count: 0,
    service_provider_count: 0,
    pending_actions_count: 0,
  })

  useEffect(() => {
    fetchSuperAdminDashboard()
      .then((payload) => {
        if (payload?.stats) setStats(payload.stats)
      })
      .catch((err) => reportError(err, { context: 'SAHome.fetchSuperAdminDashboard', silent: true }))
  }, [])

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.user_count, icon: 'group', color: 'var(--primary)' },
    { label: 'Managers', value: stats.manager_count, icon: 'manage_accounts', color: 'var(--status-info)' },
    { label: 'Properties', value: stats.property_count, icon: 'location_city', color: 'var(--status-success)' },
    { label: 'Providers', value: stats.service_provider_count, icon: 'engineering', color: 'var(--accent)' },
  ]

  const QUICK_NAV = [
    {
      icon: 'group', title: 'User Management',
      desc: 'Manage managers, owners, tenants, and service providers across the platform.',
      stat: `${stats.user_count || 0} Active Users`, path: '/sa/users',
    },
    {
      icon: 'location_city', title: 'Property Ledger',
      desc: 'Oversee property listings, occupancy status, and manager assignments.',
      stat: `${stats.property_count || 0} Properties`, path: '/sa/properties',
    },
    {
      icon: 'admin_panel_settings', title: 'Roles & Permissions',
      desc: 'Configure roles, permission matrix, and user-role assignments.',
      stat: 'Access Control', path: '/sa/permissions',
    },
  ]

  return (
    <SALayout activeKey="home" title="Dashboard" subtitle="Platform overview and quick actions">
      <div className="sah">
        {/* Stat Cards */}
        <div className="sah__stats">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="sah__stat-card">
              <div className="sah__stat-icon-wrap" style={{ background: `${s.color}12`, color: s.color }}>
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div className="sah__stat-body">
                <p className="sah__stat-value">{s.value || 0}</p>
                <p className="sah__stat-label">{s.label}</p>
              </div>
            </div>
          ))}
          {/* Pending Actions - highlighted */}
          <div className="sah__stat-card sah__stat-card--alert">
            <div className="sah__stat-icon-wrap sah__stat-icon-wrap--alert">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <div className="sah__stat-body">
              <p className="sah__stat-value">{stats.pending_actions_count || 0}</p>
              <p className="sah__stat-label">Pending Actions</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <section>
          <h2 className="sah__section-title">Quick Navigation</h2>
          <div className="sah__nav-grid">
            {QUICK_NAV.map((item) => (
              <div key={item.title} className="sah__nav-card" onClick={() => navigate(item.path)}>
                <div className="sah__nav-icon-wrap">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h3 className="sah__nav-title">{item.title}</h3>
                <p className="sah__nav-desc">{item.desc}</p>
                <div className="sah__nav-footer">
                  <span className="sah__nav-stat">{item.stat}</span>
                  <span className="material-symbols-outlined sah__nav-arrow">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SALayout>
  )
}
