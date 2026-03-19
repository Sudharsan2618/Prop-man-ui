import './Dropdown.css'

/**
 * Dropdown — Select with chevron icon.
 *
 * @param {string}  props.label
 * @param {Array<{value: string, label: string}>} props.options
 * @param {string}  [props.value]
 * @param {string}  [props.placeholder] — e.g. "Select Type"
 * @param {string}  [props.error]
 * @param {boolean} [props.disabled]
 * @param {function} [props.onChange]
 * @param {string}  [props.id]
 */
export default function Dropdown({
  label,
  options = [],
  value,
  placeholder = 'Select...',
  error,
  disabled = false,
  onChange,
  id,
  className = '',
  ...rest
}) {
  const fieldId = id || `dropdown-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`dropdown ${error ? 'dropdown--error' : ''} ${disabled ? 'dropdown--disabled' : ''} ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="dropdown__label">
          {label}
        </label>
      )}
      <div className="dropdown__wrapper">
        <select
          id={fieldId}
          className="dropdown__select"
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined dropdown__chevron">
          expand_more
        </span>
      </div>
      {error && <p className="dropdown__error">{error}</p>}
    </div>
  )
}
