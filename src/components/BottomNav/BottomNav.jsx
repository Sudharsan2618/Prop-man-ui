import { useLocation, useNavigate } from 'react-router-dom'
import { useRbac } from '../../context/RbacContext'
import './BottomNav.css'

// Per-role tab route map — duplicates useNavigation TAB_ROUTES so BottomNav
// can resolve the active tab from the URL without importing a hook (this is a
// pure component). Keep in sync with hooks/useNavigation.js.
const TAB_ROUTES_BY_ROLE = {
  tenant: {
    home: '/', properties: '/browse', services: '/services',
    payments: '/payments', profile: '/profile', alerts: '/notifications',
  },
  owner: {
    dashboard: '/', properties: '/portfolio-hub', maintenance: '/maintenance-log',
    tax: '/tax-tds', profile: '/profile', alerts: '/notifications', inspections: '/inspection-hub',
  },
  provider: {
    home: '/', jobs: '/jobs', messages: '/messaging',
    earnings: '/provider-earnings', profile: '/profile', alerts: '/notifications',
  },
  manager: {
    home: '/', finance: '/manager-finance', properties: '/manager-properties',
    users: '/manager-users', profile: '/profile', settings: '/notification-settings',
    alerts: '/notifications',
  },
  super_admin: {
    home: '/sa', users: '/sa/users', properties: '/sa/properties',
    permissions: '/sa/permissions', profile: '/profile', alerts: '/notifications',
  },
}

/**
 * Resolve which tab should be highlighted given the current URL.
 * Picks the tab whose route is the longest prefix of `pathname`.
 */
function resolveActiveTab(role, pathname) {
  const routes = TAB_ROUTES_BY_ROLE[role] || TAB_ROUTES_BY_ROLE.tenant
  let best = { key: null, len: -1 }
  for (const [key, path] of Object.entries(routes)) {
    if (pathname === path || (path !== '/' && pathname.startsWith(path + '/')) || pathname === path) {
      if (path.length > best.len) best = { key, len: path.length }
    }
  }
  // Special-case "/" — must exactly match to avoid catching every URL.
  if (best.key === null) {
    for (const [key, path] of Object.entries(routes)) {
      if (path === '/' && pathname === '/') return key
    }
  }
  return best.key
}

/**
 * BottomNav — Fixed bottom navigation with role-specific tabs.
 *
 * Role variants (matches DB v2 RBAC — 08_database_schema.md §2):
 *   tenant:      Home, Properties, Services, Payments, Profile
 *   owner:       Dashboard, Properties, Maintenance, Tax, Profile
 *   provider:    Home, Jobs, Messages, Profile  (service_provider)
 *   manager:     Home, Finance, Properties, Users, Profile  (DB: MANAGER)
 *   super_admin: Home, Users, Properties, Permissions, Profile
 *
 * @param {'tenant'|'owner'|'provider'|'manager'|'super_admin'} [props.role]
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
  manager: [
    { key: 'home',       icon: 'home',          label: 'Home' },
    { key: 'finance',    icon: 'account_balance', label: 'Finance' },
    { key: 'properties', icon: 'location_city',   label: 'Properties' },
    { key: 'users',      icon: 'group',           label: 'Users' },
    { key: 'profile',    icon: 'person',           label: 'Profile' },
  ],
  super_admin: [
    { key: 'home',        icon: 'home',                 label: 'Home' },
    { key: 'users',       icon: 'group',                label: 'Users' },
    { key: 'properties',  icon: 'location_city',        label: 'Properties' },
    { key: 'permissions', icon: 'admin_panel_settings', label: 'Permissions' },
  ],
}

export default function BottomNav({
  role: roleProp,
  activeTab: activeTabProp,
  onTabChange,
  badges = {},
  className = '',
  ...rest
}) {
  const navigate = useNavigate()
  const location = useLocation()
  // RbacContext drives the role by default; explicit `role` prop is honored
  // for screens that want to preview another role's nav.
  let role = roleProp
  try {
    const rbac = useRbac()
    if (!role) role = rbac.role
  } catch {
    // Outside RbacProvider (e.g. unit tests) — fall back to tenant.
    if (!role) role = 'tenant'
  }

  const tabs = NAV_CONFIG[role] || NAV_CONFIG.tenant
  // Derive activeTab from the URL unless the caller explicitly overrides.
  const activeTab = activeTabProp ?? resolveActiveTab(role, location.pathname)

  const handleClick = (tabKey) => {
    if (onTabChange) { onTabChange(tabKey); return }
    const route = (TAB_ROUTES_BY_ROLE[role] || TAB_ROUTES_BY_ROLE.tenant)[tabKey]
    if (route) navigate(route)
  }

  return (
    <nav className={`bottom-nav safe-area-bottom ${className}`} {...rest}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            className={`bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''}`}
            onClick={() => handleClick(tab.key)}
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
