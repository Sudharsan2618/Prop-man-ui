import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { BottomNav } from '../../components'
import { fetchNotifications } from '../../services/api'
import { reportError } from '../../utils/errors'
import './SALayout.css'

const SIDEBAR_ITEMS = [
  { key: 'home', path: '/sa', icon: 'home', label: 'Home' },
  { key: 'users', path: '/sa/users', icon: 'group', label: 'Users' },
  { key: 'properties', path: '/sa/properties', icon: 'location_city', label: 'Properties' },
  { key: 'visits', path: '/sa/visits', icon: 'event_available', label: 'Visit Requests' },
  { key: 'onboarding', path: '/sa/onboarding', icon: 'checklist', label: 'Onboarding' },
  { key: 'permissions', path: '/sa/permissions', icon: 'admin_panel_settings', label: 'Permissions' },
]

const COLLAPSE_KEY = 'sa_sidebar_collapsed'

/** Close a popover when clicking/tapping outside its ref. */
function useClickOutside(ref, onClose, active) {
  useEffect(() => {
    if (!active) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [ref, onClose, active])
}

export default function SALayout({ activeKey, title, subtitle, actions, onBack, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useRole()

  const initials = user?.initials || user?.name?.slice(0, 2)?.toUpperCase() || 'SA'
  const currentKey =
    activeKey || SIDEBAR_ITEMS.find((i) => i.path === location.pathname)?.key || 'home'

  // ── Collapsible sidebar (persisted) ──
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  // ── Notifications ──
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen)

  useEffect(() => {
    fetchNotifications()
      .then((items) => setNotifications(items || []))
      .catch((err) => reportError(err, { context: 'SALayout.fetchNotifications', silent: true }))
  }, [])

  const unreadCount = notifications.filter((n) => n.unread).length
  const recentNotifications = notifications.slice(0, 5)

  // ── Account menu ──
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  useClickOutside(accountRef, () => setAccountOpen(false), accountOpen)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      reportError(err, { context: 'SALayout.logout', silent: true })
    } finally {
      navigate('/welcome', { replace: true })
    }
  }

  return (
    <div className="sa-layout">
      {/* ── Sidebar (desktop) ── */}
      <aside className={`sa-sidebar ${collapsed ? 'sa-sidebar--collapsed' : ''}`}>
        <div className="sa-sidebar__top">
          <div className="sa-sidebar__brand" onClick={() => navigate('/sa')}>
            <span className="material-symbols-outlined sa-sidebar__logo">apartment</span>
            {!collapsed && (
              <div className="sa-sidebar__brand-text">
                <span className="sa-sidebar__brand-name">LuxeLife</span>
                <span className="sa-sidebar__brand-role">Super Admin</span>
              </div>
            )}
          </div>
          <button
            className="sa-sidebar__collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <span className="material-symbols-outlined">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="sa-sidebar__nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`sa-sidebar__item ${currentKey === item.key ? 'sa-sidebar__item--active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <span className={`material-symbols-outlined ${currentKey === item.key ? 'icon-filled' : ''}`}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sa-sidebar__footer">
          <button
            className="sa-sidebar__item sa-sidebar__item--danger"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="sa-main">
        {/* Top bar */}
        <header className="sa-topbar">
          <div className="sa-topbar__left">
            {onBack && (
              <button
                type="button"
                className="sa-topbar__back-btn"
                onClick={onBack}
                aria-label="Go back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <div className="sa-topbar__left-text">
              {title && <h1 className="sa-topbar__title">{title}</h1>}
              {subtitle && <p className="sa-topbar__subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="sa-topbar__right">
            {actions}

            {/* Notification bell + dropdown */}
            <div className="sa-topbar__popover-wrap" ref={notifRef}>
              <button
                className={`sa-topbar__icon-btn ${notifOpen ? 'sa-topbar__icon-btn--active' : ''}`}
                onClick={() => { setNotifOpen((v) => !v); setAccountOpen(false) }}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={notifOpen}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="sa-topbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="sa-popover sa-popover--notif" role="menu">
                  <div className="sa-popover__header">
                    <span className="sa-popover__title">Notifications</span>
                    {unreadCount > 0 && <span className="sa-popover__count">{unreadCount} new</span>}
                  </div>
                  <div className="sa-popover__list">
                    {recentNotifications.length === 0 ? (
                      <div className="sa-popover__empty">
                        <span className="material-symbols-outlined">notifications_off</span>
                        <span>No notifications</span>
                      </div>
                    ) : (
                      recentNotifications.map((n) => (
                        <button
                          key={n.id}
                          className={`sa-popover__item ${n.unread ? 'sa-popover__item--unread' : ''}`}
                          onClick={() => { setNotifOpen(false); navigate('/notifications') }}
                        >
                          <span className="material-symbols-outlined sa-popover__item-icon">
                            {n.icon || 'notifications'}
                          </span>
                          <span className="sa-popover__item-text">
                            <span className="sa-popover__item-title">{n.title}</span>
                            <span className="sa-popover__item-body">{n.body}</span>
                            {n.timestamp && <span className="sa-popover__item-time">{n.timestamp}</span>}
                          </span>
                          {n.unread && <span className="sa-popover__dot" />}
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    className="sa-popover__footer-btn"
                    onClick={() => { setNotifOpen(false); navigate('/notifications') }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* Account menu */}
            <div className="sa-topbar__popover-wrap" ref={accountRef}>
              <button
                className="sa-topbar__avatar"
                onClick={() => { setAccountOpen((v) => !v); setNotifOpen(false) }}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={accountOpen}
              >
                <span>{initials}</span>
              </button>

              {accountOpen && (
                <div className="sa-popover sa-popover--account" role="menu">
                  <div className="sa-popover__account-head">
                    <div className="sa-popover__account-avatar">{initials}</div>
                    <div className="sa-popover__account-info">
                      <span className="sa-popover__account-name">{user?.name || 'Super Admin'}</span>
                      <span className="sa-popover__account-email">{user?.email || ''}</span>
                    </div>
                  </div>
                  <div className="sa-popover__divider" />
                  <button
                    className="sa-popover__action"
                    onClick={() => { setAccountOpen(false); navigate('/notification-settings') }}
                  >
                    <span className="material-symbols-outlined">tune</span>
                    <span>Notification preferences</span>
                  </button>
                  <button
                    className="sa-popover__action sa-popover__action--danger"
                    onClick={() => { setAccountOpen(false); handleLogout() }}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="sa-content">{children}</main>

        {/* Bottom nav — mobile only */}
        <div className="sa-bottom-nav-wrap">
          <BottomNav role="super_admin" activeTab={currentKey} onTabChange={(tab) => navigate(SIDEBAR_ITEMS.find((i) => i.key === tab)?.path || '/sa')} />
        </div>
      </div>
    </div>
  )
}
