import './InputField.css'

/**
 * InputField — Text, number, textarea with optional icon, label, and error state.
 *
 * @param {string}  props.label
 * @param {string}  [props.type]       — 'text' | 'number' | 'email' | 'password' | 'textarea'
 * @param {string}  [props.icon]       — Material Symbol name (left icon)
 * @param {string}  [props.placeholder]
 * @param {string}  [props.value]
 * @param {string}  [props.error]      — Error message (shows red border + text)
 * @param {boolean} [props.disabled]
 * @param {function} [props.onChange]
 * @param {string}  [props.id]
 */
export default function InputField({
  label,
  type = 'text',
  icon,
  placeholder,
  value,
  error,
  disabled = false,
  onChange,
  id,
  className = '',
  ...rest
}) {
  const fieldId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`input-field ${error ? 'input-field--error' : ''} ${disabled ? 'input-field--disabled' : ''} ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="input-field__label">
          {label}
        </label>
      )}
      <div className="input-field__wrapper">
        {icon && (
          <span className="material-symbols-outlined input-field__icon">
            {icon}
          </span>
        )}
        {type === 'textarea' ? (
          <textarea
            id={fieldId}
            className="input-field__input input-field__textarea"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            rows={4}
            {...rest}
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            className="input-field__input"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...rest}
          />
        )}
      </div>
      {error && <p className="input-field__error">{error}</p>}
    </div>
  )
}
