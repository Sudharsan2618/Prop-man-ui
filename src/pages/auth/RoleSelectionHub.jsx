import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { GlassCard } from '../../components'
import './RoleSelectionHub.css'

const ROLES = [
  {
    key: 'owner',
    icon: 'real_estate_agent',
    label: 'NRI Owner',
    desc: 'Manage your property portfolio, track earnings, oversee maintenance and inspections remotely.',
    color: '#D4A843',
    features: ['Portfolio Overview', 'Earnings Dashboard', 'Tax & TDS Management', 'Maintenance Tracking'],
  },
  {
    key: 'tenant',
    icon: 'home',
    label: 'Tenant',
    desc: 'Browse properties, pay rent securely, book services, and manage your tenancy.',
    color: '#1B2A4A',
    features: ['Rent Payment', 'Service Marketplace', 'Property Browse', 'Digital Agreements'],
  },
  {
    key: 'provider',
    icon: 'build',
    label: 'Service Provider',
    desc: 'View assigned jobs, submit completion reports, track payouts and manage your schedule.',
    color: '#16A34A',
    features: ['Job Management', 'Work Reports', 'Payout Ledger', 'Client Messaging'],
  },
]

export default function RoleSelectionHub() {
  const navigate = useNavigate()
  const { setRole, isAuthenticated } = useRole()

  const handleSelectRole = (roleKey) => {
    setRole(roleKey)
    if (isAuthenticated) {
      // Already logged in (e.g. switching roles from profile) → go to dashboard
      navigate('/', { replace: true })
    } else {
      // Not logged in yet → go to login with role pre-selected
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="rsh page-transition">
      <div className="rsh__bg" />

      <div className="rsh__content">
        {/* Header */}
        <div className="rsh__header animate-slide-down">
          <h1 className="rsh__title">Select Your Role</h1>
          <p className="rsh__subtitle">Choose how you'd like to access LuxeLife today</p>
        </div>

        {/* Role Cards */}
        <div className="rsh__roles stagger-children">
          {ROLES.map((r) => (
            <GlassCard
              key={r.key}
              interactive
              className="rsh__role-card animate-slide-up"
              onClick={() => handleSelectRole(r.key)}
            >
              <div className="rsh__role-icon" style={{ background: `${r.color}15`, borderColor: `${r.color}30` }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: r.color }}>{r.icon}</span>
              </div>
              <div className="rsh__role-info">
                <p className="rsh__role-label">{r.label}</p>
                <p className="rsh__role-desc">{r.desc}</p>
                {r.features && (
                  <div className="rsh__role-features">
                    {r.features.map((f) => (
                      <span key={f} className="rsh__role-feature">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: r.color }}>check_circle</span>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rsh__enter-btn" style={{ borderColor: `${r.color}40`, color: r.color }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                Enter as {r.label}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Admin Link */}
        <div className="rsh__admin-section animate-fade-in" style={{ animationDelay: '500ms' }}>
          <button className="rsh__admin-link" onClick={() => handleSelectRole('admin')}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>admin_panel_settings</span>
            Admin Login →
          </button>
        </div>
      </div>
    </div>
  )
}
