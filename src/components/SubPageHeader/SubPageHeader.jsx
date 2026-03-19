import './SubPageHeader.css'

/**
 * SubPageHeader — Back arrow + centered title + optional right action.
 *
 * @param {string}  props.title          — Centered title text
 * @param {string}  [props.icon]         — Icon next to title (e.g. "lock")
 * @param {function} [props.onBack]      — Back button handler
 * @param {React.ReactNode} [props.rightAction] — Optional right-side element
 */
export default function SubPageHeader({
  title,
  icon,
  onBack,
  rightAction,
  className = '',
  ...rest
}) {
  return (
    <header className={`sub-header ${className}`} {...rest}>
      <button
        className="sub-header__back"
        onClick={onBack}
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
