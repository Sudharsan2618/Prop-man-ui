import './QuickActionCard.css'

/**
 * QuickActionCard — Icon + label grid card for quick actions.
 *
 * @param {string}  props.icon   — Material Symbol icon name
 * @param {string}  props.label
 * @param {function} [props.onClick]
 * @param {string}  [props.iconColor] — Override icon color
 */
export default function QuickActionCard({
  icon,
  label,
  onClick,
  iconColor,
  className = '',
  ...rest
}) {
  return (
    <button className={`quick-action-card glass-card glass-card--interactive ${className}`} onClick={onClick} {...rest}>
      <div className="quick-action-card__icon-wrap" style={iconColor ? { background: `${iconColor}15` } : undefined}>
        <span className="material-symbols-outlined" style={iconColor ? { color: iconColor } : undefined}>
          {icon}
        </span>
      </div>
      <span className="quick-action-card__label">{label}</span>
    </button>
  )
}
