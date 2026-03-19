import './BottomNav.css'

/**
 * BottomNav — Fixed bottom navigation with role-specific tabs.
 *
 * Role variants:
 *   tenant:   Home, Properties, Services, Payments, Profile
 *   owner:    Dashboard, Properties, Maintenance, Tax, Profile
 *   provider: Home, Jobs, Messages, Profile
 *   admin:    Home, Finance, Properties, Users
 *
 * @param {'tenant'|'owner'|'provider'|'admin'} [props.role]
 * @param {string} [props.activeTab] — Tab key to highlight
 * @param {function} [props.onTabChange] — (tabKey) => void
 * @param {object} [props.badges] — { tabKey: number } for badge dots/counts
 */

const NAV_CONFIG = {
  tenant: [
    { key: 'home',       icon: 'home',                label: 'Home' },
    { key: 'properties', icon: 'location_city',       label: 'Properties' },
    { key: 'services',   icon: 'home_repair_service', label: 'Services' },
    { key: 'payments',   icon: 'payments',            label: 'Payments' },
    { key: 'profile',    icon: 'person',              label: 'Profile' },
  ],
  owner: [
    { key: 'dashboard',   icon: 'dashboard',           label: 'Dashboard' },
    { key: 'properties',  icon: 'location_city',       label: 'Properties' },
    { key: 'maintenance', icon: 'build',               label: 'Maintenance' },
    { key: 'tax',         icon: 'receipt_long',        label: 'Tax' },
    { key: 'profile',     icon: 'person',              label: 'Profile' },
  ],
  provider: [
    { key: 'home',     icon: 'home',      label: 'Home' },
    { key: 'jobs',     icon: 'work',      label: 'Jobs' },
    { key: 'messages', icon: 'chat',      label: 'Messages' },
    { key: 'profile',  icon: 'person',    label: 'Profile' },
  ],
  admin: [
    { key: 'home',       icon: 'home',          label: 'Home' },
    { key: 'finance',    icon: 'account_balance', label: 'Finance' },
    { key: 'properties', icon: 'location_city',   label: 'Properties' },
    { key: 'users',      icon: 'group',           label: 'Users' },
    { key: 'profile',    icon: 'person',           label: 'Profile' },
  ],
}

export default function BottomNav({
  role = 'tenant',
  activeTab = 'home',
  onTabChange,
  badges = {},
  className = '',
  ...rest
}) {
  const tabs = NAV_CONFIG[role] || NAV_CONFIG.tenant

  return (
    <nav className={`bottom-nav safe-area-bottom ${className}`} {...rest}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            className={`bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''}`}
            onClick={() => onTabChange?.(tab.key)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav__icon-wrap">
              <span className={`material-symbols-outlined ${isActive ? 'icon-filled' : ''}`}>
                {tab.icon}
              </span>
              {badges[tab.key] && (
                <span className="bottom-nav__badge">
                  {badges[tab.key] > 9 ? '9+' : badges[tab.key]}
                </span>
              )}
            </span>
            <span className="bottom-nav__label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
