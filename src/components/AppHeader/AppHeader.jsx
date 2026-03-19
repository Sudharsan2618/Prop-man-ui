import './AppHeader.css'

/**
 * AppHeader — Top bar with logo, notification bell (with badge), and user avatar.
 *
 * @param {string}  [props.title]        — App title or greeting text
 * @param {string}  [props.subtitle]     — Subtitle below title
 * @param {string}  [props.avatarText]   — Initials for avatar (e.g. "JD")
 * @param {string}  [props.avatarSrc]    — Image URL for avatar
 * @param {boolean} [props.hasNotification] — Show red dot on bell
 * @param {function} [props.onNotificationClick]
 * @param {function} [props.onAvatarClick]
 */
export default function AppHeader({
  title = 'LuxeLife',
  subtitle,
  avatarText = '',
  avatarSrc,
  hasNotification = false,
  onNotificationClick,
  onAvatarClick,
  className = '',
  children,
  ...rest
}) {
  return (
    <header className={`app-header ${className}`} {...rest}>
      <div className="app-header__left">
        <span className="material-symbols-outlined app-header__logo-icon">
          apartment
        </span>
        <div>
          <h1 className="app-header__title">{title}</h1>
          {subtitle && <p className="app-header__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="app-header__right">
        {children}
        <button
          className="app-header__bell"
          onClick={onNotificationClick}
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasNotification && <span className="app-header__bell-dot" />}
        </button>
        <button
          className="app-header__avatar"
          onClick={onAvatarClick}
          aria-label="Profile"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="app-header__avatar-img" />
          ) : (
            <span className="app-header__avatar-text">{avatarText}</span>
          )}
        </button>
      </div>
    </header>
  )
}
