import { useGoBack } from '../../hooks/useGoBack'
import './SubPageHeader.css'

/**
 * SubPageHeader — Back arrow + centered title + optional right action.
 *
 * When no `onBack` is provided, uses `useGoBack` which safely falls
 * back to the role home when there's no browser history (deep links).
 *
 * @param {string}  props.title          — Centered title text
 * @param {string}  [props.icon]         — Icon next to title (e.g. "lock")
 * @param {function} [props.onBack]      — Back button handler (defaults to useGoBack)
 * @param {string}  [props.fallbackRoute] — Fallback route when no history (used by useGoBack)
 * @param {React.ReactNode} [props.rightAction] — Optional right-side element
 */
export default function SubPageHeader({
  title,
  icon,
  onBack,
  fallbackRoute,
  rightAction,
  className = '',
  ...rest
}) {
  const goBack = useGoBack(fallbackRoute)
  const handleBack = onBack || goBack

  return (
    <header className={`sub-header ${className}`} {...rest}>
      <button
        className="sub-header__back"
        onClick={handleBack}
        aria-label="Go back"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="sub-header__center">
        {icon && (
          <span className="material-symbols-outlined sub-header__icon">
            {icon}
          </span>
        )}
        <h1 className="sub-header__title">{title}</h1>
      </div>

      <div className="sub-header__right">
        {rightAction || <span style={{ width: '40px' }} />}
      </div>
    </header>
  )
}
