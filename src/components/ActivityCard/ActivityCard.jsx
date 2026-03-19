import './ActivityCard.css'

/**
 * ActivityCard — Activity/list item with icon, title, subtitle, amount or badge.
 *
 * @param {string}  props.icon        — Material Symbol name
 * @param {string}  props.iconBg      — Background color for icon circle
 * @param {string}  props.iconColor   — Icon color
 * @param {string}  props.title
 * @param {string}  props.subtitle
 * @param {string}  [props.amount]    — Right-side amount text
 * @param {string}  [props.amountColor]
 * @param {React.ReactNode} [props.badge] — Right-side badge element
 * @param {function} [props.onClick]
 */
export default function ActivityCard({
  icon,
  iconBg = 'var(--primary-subtle)',
  iconColor = 'var(--primary)',
  title,
  subtitle,
  amount,
  amountColor,
  badge,
  onClick,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`activity-card glass-card glass-card--interactive ${className}`}
      onClick={onClick}
      {...rest}
    >
      <div className="activity-card__left">
        <div className="activity-card__icon" style={{ background: iconBg }}>
          <span className="material-symbols-outlined" style={{ color: iconColor, fontSize: '20px' }}>
            {icon}
          </span>
        </div>
        <div className="activity-card__text">
          <p className="activity-card__title">{title}</p>
          <p className="activity-card__subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="activity-card__right">
        {amount && (
          <span className="activity-card__amount" style={amountColor ? { color: amountColor } : undefined}>
            {amount}
          </span>
        )}
        {badge}
      </div>
    </div>
  )
}
