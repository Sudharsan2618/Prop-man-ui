import './ToggleSwitch.css'

/**
 * ToggleSwitch — On/off toggle with label and optional description.
 *
 * @param {boolean} props.checked
 * @param {function} props.onChange
 * @param {string}  [props.label]
 * @param {string}  [props.description]
 * @param {boolean} [props.disabled]
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <label className={`toggle-switch ${disabled ? 'toggle-switch--disabled' : ''} ${className}`} {...rest}>
      <div className="toggle-switch__text">
        {label && <span className="toggle-switch__label">{label}</span>}
        {description && <span className="toggle-switch__desc">{description}</span>}
      </div>
      <div className={`toggle-switch__track ${checked ? 'toggle-switch__track--on' : ''}`}>
        <input
          type="checkbox"
          className="toggle-switch__input"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="toggle-switch__thumb" />
      </div>
    </label>
  )
}
