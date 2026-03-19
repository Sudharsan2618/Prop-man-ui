import './NotificationCard.css'

/**
 * NotificationCard — Notification item with icon, title, body, action, timestamp.
 *
 * @param {string}  props.icon       — Material Symbol name
 * @param {string}  props.iconBg     — Background color for icon circle
 * @param {string}  props.iconColor  — Icon color
 * @param {string}  props.title
 * @param {string}  [props.body]
 * @param {string}  props.timestamp  — e.g. "2h ago"
 * @param {boolean} [props.unread]   — Shows unread indicator
 * @param {React.ReactNode} [props.action] — Action button
 * @param {function} [props.onClick]
 */
export default function NotificationCard({
  icon,
  iconBg = 'var(--primary-subtle)',
  iconColor = 'var(--primary)',
  title,
  body,
  timestamp,
  unread = false,
  action,
  onClick,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`notification-card glass-card glass-card--interactive ${unread ? 'notification-card--unread' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      <div className="notification-card__icon" style={{ background: iconBg }}>
        <span className="material-symbols-outlined" style={{ color: iconColor, fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className="notification-card__content">
        <div className="notification-card__header">
          <p className="notification-card__title">{title}</p>
          <span className="notification-card__time">{timestamp}</span>
        </div>
        {body && <p className="notification-card__body">{body}</p>}
        {action && <div className="notification-card__action">{action}</div>}
      </div>
      {unread && <span className="notification-card__dot" />}
    </div>
  )
}
