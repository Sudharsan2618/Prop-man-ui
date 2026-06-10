import { useEffect } from 'react'
import './Modal.css'

/**
 * Modal — Centered dialog with backdrop. Sibling of Drawer for non-anchored
 * overlays. Use ConfirmModal for yes/no flows; use Modal for arbitrary inline
 * content.
 *
 * Usage:
 *   <Modal open={open} onClose={close} title="Edit User">
 *     <UserForm />
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, className = '', size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal modal--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        {(title || onClose) && (
          <div className="modal__header">
            {title && <h3 className="modal__title">{title}</h3>}
            <button className="modal__close" onClick={onClose} aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
