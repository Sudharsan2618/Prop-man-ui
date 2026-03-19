import './TabNav.css'

/**
 * TabNav — Horizontal tabs with animated underline indicator.
 *
 * @param {Array<{key: string, label: string, count?: number}>} props.tabs
 * @param {string}  props.activeTab — Active tab key
 * @param {function} props.onTabChange — (tabKey) => void
 */
export default function TabNav({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
  ...rest
}) {
  return (
    <div className={`tab-nav ${className}`} role="tablist" {...rest}>
      <div className="tab-nav__scroll">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              className={`tab-nav__tab ${isActive ? 'tab-nav__tab--active' : ''}`}
              onClick={() => onTabChange?.(tab.key)}
              role="tab"
              aria-selected={isActive}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`tab-nav__count ${isActive ? 'tab-nav__count--active' : ''}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
