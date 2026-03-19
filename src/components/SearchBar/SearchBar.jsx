import './SearchBar.css'

/**
 * SearchBar — Full-width search input with icon.
 *
 * @param {string}  [props.placeholder]
 * @param {string}  [props.value]
 * @param {function} [props.onChange]
 * @param {function} [props.onFilter]  — Filter icon click handler
 * @param {boolean} [props.showFilter] — Show filter icon on right
 */
export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onFilter,
  showFilter = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`search-bar ${className}`} {...rest}>
      <span className="material-symbols-outlined search-bar__icon">
        search
      </span>
      <input
        type="text"
        className="search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {showFilter && (
        <button className="search-bar__filter" onClick={onFilter} aria-label="Filter">
          <span className="material-symbols-outlined">tune</span>
        </button>
      )}
    </div>
  )
}
