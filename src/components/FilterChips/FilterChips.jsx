import './FilterChips.css'

/**
 * FilterChips — Scrollable row of pill-shaped filter buttons.
 *
 * @param {Array<{key: string, label: string, removable?: boolean}>} props.chips
 * @param {string|string[]} props.activeChips — Key(s) of active chips
 * @param {function} props.onChipClick — (chipKey) => void
 * @param {function} [props.onChipRemove] — (chipKey) => void
 */
export default function FilterChips({
  chips = [],
  activeChips = [],
  onChipClick,
  onChipRemove,
  className = '',
  ...rest
}) {
  const activeSet = new Set(Array.isArray(activeChips) ? activeChips : [activeChips])

  return (
    <div className={`filter-chips ${className}`} {...rest}>
      <div className="filter-chips__scroll">
        {chips.map((chip) => {
          const isActive = activeSet.has(chip.key)
          return (
            <button
              key={chip.key}
              className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
              onClick={() => onChipClick?.(chip.key)}
            >
              {chip.label}
              {chip.removable && isActive && (
                <span
                  className="material-symbols-outlined filter-chip__remove"
                  onClick={(e) => { e.stopPropagation(); onChipRemove?.(chip.key) }}
                >
                  close
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
