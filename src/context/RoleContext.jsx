import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchMe,
  setFirstLoginPassword,
  getTokens,
  clearTokens,
} from '../services/api'

/**
 * RoleContext — Global context for authentication + user state.
 *
 * On mount, checks localStorage for existing tokens and auto-restores the session.
 * Provides real login/signup/logout backed by the FastAPI backend.
 */

const RoleContext = createContext(null)
const ROLE_ORDER = ['tenant', 'owner', 'provider', 'admin']
const RESET_REQUIRED_KEY = 'll_requires_password_reset'
const RESET_USER_SNAPSHOT_KEY = 'll_reset_user_snapshot'

function saveResetSession(user) {
  localStorage.setItem(RESET_REQUIRED_KEY, '1')
  if (user) localStorage.setItem(RESET_USER_SNAPSHOT_KEY, JSON.stringify(user))
}

function clearResetSession() {
  localStorage.removeItem(RESET_REQUIRED_KEY)
  localStorage.removeItem(RESET_USER_SNAPSHOT_KEY)
}

function readResetSession() {
  const required = localStorage.getItem(RESET_REQUIRED_KEY) === '1'
  if (!required) return { required: false, user: null }
  try {
    return {
      required: true,
      user: JSON.parse(localStorage.getItem(RESET_USER_SNAPSHOT_KEY) || 'null'),
    }
  } catch {
    return { required: true, user: null }
  }
}

export function RoleProvider({ children, defaultRole = 'tenant' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRoleRaw] = useState(defaultRole)
  const [currentUser, setCurrentUser] = useState(null)
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Auto-restore session on mount ──
  useEffect(() => {
    const restore = async () => {
      const { access_token } = getTokens()
      if (!access_token) { setLoading(false); return }

      const resetSession = readResetSession()
      if (resetSession.required) {
        setCurrentUser(resetSession.user)
        setRoleRaw(resetSession.user?.active_role || resetSession.user?.role || defaultRole)
        setRequiresPasswordReset(true)
        setIsAuthenticated(true)
        setLoading(false)
        return
      }

      try {
        const user = await fetchMe()
        setCurrentUser(user)
        setRoleRaw(user.active_role || user.role || defaultRole)
        setRequiresPasswordReset(!!user.must_reset_password)
        setIsAuthenticated(true)
        clearResetSession()
      } catch (err) {
        const message = (err?.message || '').toLowerCase()
        if (message.includes('password reset required')) {
          setCurrentUser(null)
          setRoleRaw(defaultRole)
          setRequiresPasswordReset(true)
          setIsAuthenticated(true)
          saveResetSession(null)
        } else {
          clearTokens()
          clearResetSession()
        }
      }
      setLoading(false)
    }
    restore()
  }, [])

  /**
   * Real login — calls POST /auth/login, stores tokens, fetches profile.
   */
  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password)
    if (res.success) {
      const loginUserData = res?.data?.user || null
      const mustReset = !!res?.data?.requires_password_reset || !!loginUserData?.must_reset_password

      if (mustReset) {
        setCurrentUser(loginUserData)
        setRoleRaw(loginUserData?.active_role || loginUserData?.role || defaultRole)
        setRequiresPasswordReset(true)
        setIsAuthenticated(true)
        saveResetSession(loginUserData)
        return res
      }

      const user = await fetchMe()
      setCurrentUser(user)
      setRoleRaw(user.active_role || user.role || defaultRole)
      setRequiresPasswordReset(false)
      setIsAuthenticated(true)
      clearResetSession()
    }
    return res
  }, [])

  /**
   * Real signup — calls POST /auth/register, stores tokens, sets user.
   */
  const signup = useCallback(async (name, email, phone, password, selectedRole) => {
    const res = await registerUser({ name, email, phone, password, role: selectedRole || 'tenant' })
    if (res.success) {
      const signupUserData = res?.data?.user || null
      const mustReset = !!res?.data?.requires_password_reset || !!signupUserData?.must_reset_password

      if (mustReset) {
        setCurrentUser(signupUserData)
        setRoleRaw(signupUserData?.active_role || signupUserData?.role || selectedRole || defaultRole)
        setRequiresPasswordReset(true)
        setIsAuthenticated(true)
        saveResetSession(signupUserData)
        return res
      }

      const user = await fetchMe()
      setCurrentUser(user)
      setRoleRaw(user.active_role || user.role || selectedRole || 'tenant')
      setRequiresPasswordReset(false)
      setIsAuthenticated(true)
      clearResetSession()
    }
    return res
  }, [])

  const completeFirstLoginPasswordReset = useCallback(async (newPassword) => {
    const res = await setFirstLoginPassword(newPassword)
    if (res.success) {
      const user = await fetchMe()
      setCurrentUser(user)
      setRoleRaw(user.active_role || user.role || defaultRole)
      setRequiresPasswordReset(false)
      clearResetSession()
    }
    return res
  }, [])

  /**
   * Real logout — calls POST /auth/logout (blacklists token), clears state.
   */
  const logout = useCallback(async () => {
    await logoutUser()
    setIsAuthenticated(false)
    setRoleRaw(defaultRole)
    setCurrentUser(null)
    setRequiresPasswordReset(false)
    clearResetSession()
  }, [])

  const setRole = useCallback((newRole) => {
    setRoleRaw(newRole)
  }, [])

  const switchToUser = useCallback(() => {
    // Not supported with real auth — single role per user
  }, [])

  const value = useMemo(() => ({
    isAuthenticated,
    role,
    setRole,
    user: currentUser,
    requiresPasswordReset,
    switchToUser,
    login,
    signup,
    completeFirstLoginPasswordReset,
    logout,
    roles: ROLE_ORDER,
    loading,
  }), [
    isAuthenticated,
    role,
    currentUser,
    requiresPasswordReset,
    setRole,
    switchToUser,
    login,
    signup,
    completeFirstLoginPasswordReset,
    logout,
    loading,
  ])

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within a RoleProvider')
  return ctx
}
