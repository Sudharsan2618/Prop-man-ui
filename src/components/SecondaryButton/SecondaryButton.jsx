import './SecondaryButton.css'

/**
 * SecondaryButton — Outline button with neutral or danger variant.
 *
 * @param {'neutral'|'danger'} [props.variant]
 * @param {string}  [props.icon]       — Material Symbol icon name
 * @param {boolean} [props.fullWidth]  — Default true
 * @param {boolean} [props.disabled]
 * @param {string}  [props.className]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export default function SecondaryButton({
  variant = 'neutral',
  icon,
  fullWidth = true,
  disabled = false,
  className = '',
  onClick,
  children,
  ...rest
}) {
  const cls = [
    'btn-secondary',
    variant === 'danger' && 'btn-secondary--danger',
    !fullWidth && 'btn-secondary--auto',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={cls} disabled={disabled} onClick={onClick} {...rest}>
      {icon && (
        <span className="material-symbols-outlined btn-secondary__icon" style={{ color: 'inherit' }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}
