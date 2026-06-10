import { useEffect } from 'react'
import './Drawer.css'

/**
 * Drawer — Mobile slide-in / desktop side panel.
 *
 * Replaces the bespoke `sapm__overlay + sapm__drawer` markup duplicated across
 * Super Admin screens (SAUsers, SAPermissions). Handles backdrop click,
 * Escape key, and body-scroll lock.
 *
 * Usage:
 *   <Drawer open={open} onClose={() => setOpen(false)} title="Create Role">
 *     <RoleForm />
 *   </Drawer>
 *
 * @param {object} props
 * @param {boolean}  props.open
 * @param {() => void} props.onClose
 * @param {string}   [props.title]
 * @param {'right'|'bottom'} [props.side]   default: 'right' on desktop, 'bottom' on mobile
 * @param {React.ReactNode} props.children
 */
export default function Drawer({ open, onClose, title, side = 'right', children, className = '' }) {
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
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <div
        className={`drawer drawer--${side} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
      >
        {(title || onClose) && (
          <div className="drawer__header">
            {title && <h3 className="drawer__title">{title}</h3>}
            <button className="drawer__close" onClick={onClose} aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  )
}
