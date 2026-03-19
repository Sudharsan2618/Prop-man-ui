import './UserCard.css'
import Avatar from '../Avatar/Avatar'

/**
 * UserCard — User profile card with avatar, name, role, status, actions.
 *
 * @param {string}  [props.avatarSrc]
 * @param {string}  [props.initials]
 * @param {string}  props.name
 * @param {string}  [props.email]
 * @param {string}  [props.role]      — e.g. "NRI Owner", "Tenant"
 * @param {React.ReactNode} [props.statusBadge]
 * @param {string}  [props.subtitle]  — Extra info (e.g. signup date)
 * @param {boolean} [props.verified]
 * @param {React.ReactNode} [props.actions] — Button row
 * @param {function} [props.onClick]
 */
export default function UserCard({
  avatarSrc,
  initials,
  name,
  email,
  role,
  statusBadge,
  subtitle,
  verified = false,
  actions,
  onClick,
  className = '',
  ...rest
}) {
  return (
    <div className={`user-card glass-card ${className}`} onClick={onClick} {...rest}>
      <div className="user-card__top">
        <Avatar src={avatarSrc} initials={initials || name?.charAt(0)} size="md" verified={verified} />
        <div className="user-card__info">
          <p className="user-card__name">{name}</p>
          {email && <p className="user-card__email">{email}</p>}
          {role && <span className="user-card__role">{role}</span>}
        </div>
        {statusBadge && <div className="user-card__status">{statusBadge}</div>}
      </div>
      {subtitle && <p className="user-card__subtitle">{subtitle}</p>}
      {actions && <div className="user-card__actions">{actions}</div>}
    </div>
  )
}
