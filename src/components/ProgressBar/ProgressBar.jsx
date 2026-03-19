import './ProgressBar.css'

/**
 * ProgressBar — Linear bar with percentage label.
 *
 * @param {number}  props.value       — 0–100
 * @param {string}  [props.label]     — Text above bar
 * @param {boolean} [props.showPercent] — Show percentage text (default true)
 * @param {'primary'|'gold'} [props.color]
 */
export default function ProgressBar({
  value = 0,
  label,
  showPercent = true,
  color = 'primary',
  className = '',
  ...rest
}) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`progress-bar ${className}`} {...rest}>
      {(label || showPercent) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showPercent && <span className="progress-bar__percent">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill progress-bar__fill--${color}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
