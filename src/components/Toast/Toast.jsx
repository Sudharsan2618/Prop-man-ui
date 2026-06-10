import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { onError } from '../../utils/errors'
import './Toast.css'

const ToastContext = createContext(null)

let _nextId = 0
const TOAST_TTL = 5000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback((toast) => {
    const id = ++_nextId
    setToasts((prev) => [...prev, { id, ttl: TOAST_TTL, severity: 'info', ...toast }])
    const ttl = toast.ttl ?? TOAST_TTL
    if (ttl > 0) {
      const timer = setTimeout(() => dismiss(id), ttl)
      timers.current.set(id, timer)
    }
    return id
  }, [dismiss])

  // Bridge errors emitted via reportError() into toasts.
  useEffect(() => {
    return onError(({ message, severity, context }) => {
      push({ message, severity, context })
    })
  }, [push])

  useEffect(() => {
    const captured = timers.current
    return () => captured.forEach((t) => clearTimeout(t))
  }, [])

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.severity}`} role="alert">
            <span className="material-symbols-outlined toast__icon">
              {t.severity === 'error' ? 'error' : t.severity === 'warning' ? 'warning' : 'info'}
            </span>
            <div className="toast__body">
              <p className="toast__message">{t.message}</p>
              {t.context && <p className="toast__context">{t.context}</p>}
            </div>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export default ToastProvider
