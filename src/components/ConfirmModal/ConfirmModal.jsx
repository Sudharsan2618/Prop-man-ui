import { useState, useEffect, useCallback } from 'react'
import { PrimaryButton, SecondaryButton } from '../index'
import './ConfirmModal.css'

/**
 * ConfirmModal — Reusable confirmation/prompt modal.
 *
 * @param {boolean}  props.open          — Whether the modal is visible
 * @param {string}   props.title         — Modal title
 * @param {string}   [props.subtitle]    — Optional subtitle under the title
 * @param {string}   [props.description] — Body description text
 * @param {'approve'|'reject'|'confirm'|'warning'} [props.variant] — Icon style
 * @param {string}   [props.icon]        — Material Symbol icon name
 * @param {boolean}  [props.showInput]   — Show a text input/textarea
 * @param {string}   [props.inputLabel]  — Label for the input
 * @param {string}   [props.inputPlaceholder] — Placeholder for the input
 * @param {boolean}  [props.inputRequired] — Whether input is required to confirm
 * @param {string}   [props.confirmText] — Confirm button label (default: 'Confirm')
 * @param {string}   [props.cancelText]  — Cancel button label (default: 'Cancel')
 * @param {boolean}  [props.loading]     — Show loading state on confirm button
 * @param {boolean}  [props.hideCancelButton] — Hide the cancel button
 * @param {function} props.onConfirm     — Called with (inputValue) on confirm
 * @param {function} props.onCancel      — Called on cancel / overlay click
 */
export default function ConfirmModal({
  open = false,
  title = 'Confirm',
  subtitle,
  description,
  variant = 'confirm',
  icon,
  showInput = false,
  inputLabel,
  inputPlaceholder = '',
  inputRequired = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  hideCancelButton = false,
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (open) setInputValue('')
  }, [open])

  const handleConfirm = useCallback(() => {
    if (showInput && inputRequired && !inputValue.trim()) return
    onConfirm?.(inputValue.trim())
  }, [inputValue, showInput, inputRequired, onConfirm])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onCancel?.()
    if (e.key === 'Enter' && !showInput) handleConfirm()
  }, [onCancel, handleConfirm, showInput])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  if (!open) return null

  const iconMap = {
    approve: 'check_circle',
    reject: 'cancel',
    confirm: 'info',
    warning: 'warning',
  }
  const resolvedIcon = icon || iconMap[variant] || 'info'

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel__header">
          <div className={`modal-panel__icon modal-panel__icon--${variant}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              {resolvedIcon}
            </span>
          </div>
          <div>
            <p className="modal-panel__title">{title}</p>
            {subtitle && <p className="modal-panel__subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="modal-panel__body">
          {description && <p className="modal-panel__description">{description}</p>}

          {showInput && (
            <>
              {inputLabel && <label className="modal-panel__input-label">{inputLabel}</label>}
              <textarea
                className="modal-panel__input"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={3}
                autoFocus
              />
            </>
          )}
        </div>

        <div className={`modal-panel__footer ${hideCancelButton ? 'modal-panel__footer--single' : ''}`}>
          {!hideCancelButton && (
            <SecondaryButton fullWidth onClick={onCancel}>
              {cancelText}
            </SecondaryButton>
          )}
          <PrimaryButton
            fullWidth
            onClick={handleConfirm}
            loading={loading}
            disabled={loading || (showInput && inputRequired && !inputValue.trim())}
          >
            {confirmText}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
