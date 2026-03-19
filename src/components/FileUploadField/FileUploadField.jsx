import { useRef } from 'react'
import './FileUploadField.css'

export default function FileUploadField({
  label,
  hint,
  accept = 'image/*,.pdf',
  disabled = false,
  file = null,
  onFileSelect,
  buttonText = 'Choose File',
  id,
  className = '',
}) {
  const inputRef = useRef(null)
  const fieldId = id || `file-${label?.toLowerCase().replace(/\s+/g, '-')}`

  const handleTrigger = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    const selected = e.target.files?.[0] || null
    if (onFileSelect) onFileSelect(selected)
  }

  return (
    <div className={`fupload ${disabled ? 'fupload--disabled' : ''} ${className}`}>
      {label && <p className="fupload__label">{label}</p>}
      {hint && <p className="fupload__hint">{hint}</p>}

      <input
        id={fieldId}
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="fupload__native"
      />

      <button
        type="button"
        className="fupload__control"
        disabled={disabled}
        onClick={handleTrigger}
      >
        <span className="material-symbols-outlined fupload__icon">upload_file</span>
        <span className="fupload__button">{buttonText}</span>
        <span className={`fupload__filename ${file ? 'fupload__filename--selected' : ''}`}>
          {file ? file.name : 'No file selected'}
        </span>
      </button>
    </div>
  )
}
