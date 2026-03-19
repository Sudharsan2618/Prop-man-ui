import './FAB.css'

/**
 * FAB — Floating Action Button.
 *
 * @param {string}  [props.icon]    — Material Symbol name (default: "edit")
 * @param {function} props.onClick
 * @param {string}  [props.label]   — Extended FAB text
 * @param {'primary'|'gold'} [props.color]
 */
export default function FAB({
  icon = 'edit',
  onClick,
  label,
  color = 'primary',
  className = '',
  ...rest
}) {
  return (
    <button
      className={`fab fab--${color} ${label ? 'fab--extended' : ''} ${className}`}
      onClick={onClick}
      aria-label={label || icon}
      {...rest}
    >
      <span className="material-symbols-outlined fab__icon">{icon}</span>
      {label && <span className="fab__label">{label}</span>}
    </button>
  )
}
