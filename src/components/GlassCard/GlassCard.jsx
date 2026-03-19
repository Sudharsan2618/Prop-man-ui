import './GlassCard.css'

/**
 * GlassCard — Primary container for all content sections.
 *
 * Variants:
 *   - default: Standard glassmorphism background
 *   - highlighted: Teal left-border accent
 *   - status-success / status-warning / status-danger / status-info: Colored left border
 *   - interactive: Hover bg + press scale
 *
 * @param {object} props
 * @param {'default'|'highlighted'|'success'|'warning'|'danger'|'info'} [props.variant]
 * @param {boolean} [props.interactive] — Adds hover/press effects
 * @param {string}  [props.className]
 * @param {object}  [props.style]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export default function GlassCard({
  variant = 'default',
  interactive = false,
  className = '',
  style,
  onClick,
  children,
  ...rest
}) {
  const cls = [
    'glass-card',
    variant === 'highlighted' && 'glass-card--highlighted',
    variant === 'success'    && 'glass-card--status-success',
    variant === 'warning'    && 'glass-card--status-warning',
    variant === 'danger'     && 'glass-card--status-danger',
    variant === 'info'       && 'glass-card--status-info',
    interactive              && 'glass-card--interactive',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} style={style} onClick={onClick} {...rest}>
      {children}
    </div>
  )
}
