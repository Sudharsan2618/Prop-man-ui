/**
 * useGoBack — Conscious back navigation with role-aware fallback.
 *
 * On deep links or direct URL entry, navigate(-1) can fail or go
 * to an unexpected location. This hook checks navigation history
 * and falls back to the role-specific home route when needed.
 *
 * Adds a brief exit animation class before navigating for
 * smooth page transition choreography.
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

const ROLE_HOME = {
  tenant: '/',
  owner: '/',
  provider: '/',
  admin: '/',
}

export function useGoBack(fallbackRoute) {
  const navigate = useNavigate()
  const { role } = useRole()

  /**
   * Go back if there is history, otherwise navigate to fallback or role home.
   * Applies exit animation class briefly before navigating.
   */
  const goBack = useCallback(() => {
    const destination = fallbackRoute || ROLE_HOME[role] || '/'
    const shell = document.querySelector('.page-shell')

    let fired = false
    const doNavigate = () => {
      if (fired) return
      fired = true
      if (window.history.length > 2) {
        navigate(-1)
      } else {
        navigate(destination, { replace: true })
      }
    }

    if (shell) {
      shell.classList.remove('page-transition')
      shell.classList.add('page-transition--exit')
      shell.addEventListener('animationend', doNavigate, { once: true })
      // Safety timeout in case animationend doesn't fire (no animation, reduced motion, etc.)
      setTimeout(doNavigate, 250)
    } else {
      doNavigate()
    }
  }, [navigate, role, fallbackRoute])

  return goBack
}
