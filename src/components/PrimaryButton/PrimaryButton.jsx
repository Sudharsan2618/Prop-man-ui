import './PrimaryButton.css'

/**
 * PrimaryButton — Teal CTA with glow shadow.
 *
 * Variants: full-width (default), with icon, with amount, loading, disabled.
 *
 * @param {string}  [props.icon]       — Material Symbol icon name (left of text)
 * @param {string}  [props.amount]     — Right-aligned amount text (e.g. "₹45,000")
 * @param {boolean} [props.loading]    — Shows shimmer overlay
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.fullWidth]  — Default true
 * @param {string}  [props.className]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export default function PrimaryButton({
  icon,
  amount,
  loading = false,
  disabled = false,
  fullWidth = true,
  className = '',
  onClick,
  children,
  ...rest
}) {
  const cls = [
    'btn-primary',
    loading && 'btn-primary--loading',
    !fullWidth && 'btn-primary--auto',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {icon && (
        <span className="material-symbols-outlined btn-primary__icon">
          {icon}
        </span>
      )}
      <span className="btn-primary__label">{children}</span>
      {amount && <span className="btn-primary__amount">{amount}</span>}
    </button>
  )
}
