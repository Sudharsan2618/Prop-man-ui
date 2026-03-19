import './Avatar.css'

/**
 * Avatar — Circle with image or initials, optional status dot & verified badge.
 *
 * @param {string}  [props.src]       — Image URL
 * @param {string}  [props.initials]  — Fallback initials (e.g. "JD")
 * @param {'sm'|'md'|'lg'|'xl'} [props.size] — 32 / 40 / 56 / 96px
 * @param {'online'|'offline'|'away'|'busy'} [props.status] — Status dot
 * @param {boolean} [props.verified]  — Show verified badge
 */
export default function Avatar({
  src,
  initials = '',
  size = 'md',
  status,
  verified = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`avatar avatar--${size} ${className}`} {...rest}>
      {src ? (
        <img src={src} alt={initials || 'avatar'} className="avatar__img" />
      ) : (
        <span className="avatar__initials">{initials}</span>
      )}
      {status && (
        <span className={`avatar__status avatar__status--${status}`} />
      )}
      {verified && (
        <span className="avatar__verified">
          <span className="material-symbols-outlined icon-filled">verified</span>
        </span>
      )}
    </div>
  )
}
