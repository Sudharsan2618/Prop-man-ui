import { useEffect, useState } from 'react'
import './OfflineBanner.css'

/**
 * OfflineBanner — Shows a persistent banner when the browser is offline.
 * Listens to window 'online'/'offline' events.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <span className="material-symbols-outlined">wifi_off</span>
      <span>You're offline — some features may not work</span>
    </div>
  )
}
