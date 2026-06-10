import { useEffect, useState } from 'react'
import { onError } from '../../utils/errors'
import './GlobalErrorBanner.css'

/**
 * GlobalErrorBanner — Sticky banner shown when an app-level (non-toast) error
 * needs to persist until acknowledged. Listens to reportError events where
 * severity === 'fatal' (a higher level than error).
 *
 * Toasts auto-dismiss; this banner does not.
 */
export default function GlobalErrorBanner() {
  const [error, setError] = useState(null)

  useEffect(() => {
    return onError((detail) => {
      if (detail.severity === 'fatal') setError(detail)
    })
  }, [])

  if (!error) return null

  return (
    <div className="global-error-banner" role="alert">
      <span className="material-symbols-outlined">error</span>
      <span className="global-error-banner__message">{error.message}</span>
      <button className="global-error-banner__dismiss" onClick={() => setError(null)} aria-label="Dismiss">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  )
}
