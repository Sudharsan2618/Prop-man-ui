import './Skeleton.css'

/**
 * Skeleton — reusable production-grade loading placeholder.
 *
 * @param {object} props
 * @param {string|number} [props.width='100%']
 * @param {string|number} [props.height='16px']
 * @param {string|number} [props.radius='var(--radius-md)']
 * @param {number} [props.lines=1] - render stacked lines
 * @param {string|number} [props.gap='8px'] - gap between lines
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export default function Skeleton({
  width = '100%',
  height = '16px',
  radius = 'var(--radius-md)',
  lines = 1,
  gap = '8px',
  className = '',
  style,
}) {
  if (lines > 1) {
    return (
      <div className="skeleton-stack" style={{ gap }}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`skeleton ${className}`.trim()}
            style={{ width, height, borderRadius: radius, ...style }}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}
