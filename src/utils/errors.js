/**
 * errors.js — Centralized error reporting.
 *
 * Replaces silent `.catch(() => {})` patterns. Routes errors to the toast UI
 * (via a global event bus that survives across the React tree) and logs to
 * the console in development.
 *
 * Usage:
 *   import { reportError } from '../utils/errors'
 *   fetchProperties().catch((err) => reportError(err, { context: 'fetchProperties' }))
 */

const ERROR_EVENT = 'll:error'

/**
 * Subscribe to error events. Returns an unsubscribe function.
 * @param {(detail: { message: string, severity: 'error' | 'warning', context?: string }) => void} listener
 */
export function onError(listener) {
  const handler = (e) => listener(e.detail)
  window.addEventListener(ERROR_EVENT, handler)
  return () => window.removeEventListener(ERROR_EVENT, handler)
}

function extractMessage(err) {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err.message) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

/**
 * Report an error to the toast surface and (in dev) the console.
 * Safe to call from anywhere — does nothing if no toast provider is mounted.
 *
 * @param {unknown} err
 * @param {{ context?: string, severity?: 'error' | 'warning', silent?: boolean }} [opts]
 */
export function reportError(err, opts = {}) {
  const { context, severity = 'error', silent = false } = opts
  const message = extractMessage(err)

  if (import.meta.env.DEV) {
    console.error(`[${context || 'app'}]`, err)
  }

  if (silent) return

  window.dispatchEvent(
    new CustomEvent(ERROR_EVENT, {
      detail: { message, severity, context },
    }),
  )
}
