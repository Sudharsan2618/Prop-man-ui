/**
 * AuthContext — Authentication state and credential operations only.
 *
 * Split from RoleContext per Phases 2.7-2.8 to separate concerns:
 *  - AuthContext   → user identity, session, login/logout/signup/passwordReset
 *  - RbacContext   → active role, permission codes, hasPermission helpers
 *
 * useRole() still works (it composes both contexts) to keep existing pages
 * working during the migration.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchMe,
  setFirstLoginPassword,
  getTokens,
  clearTokens,
} from '../services/api'

const AuthContext = createContext(null)

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

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false)
  const [loading, setLoading] = useState(true)

  // Auto-restore session on mount.
  useEffect(() => {
    const restore = async () => {
      const { access_token } = getTokens()
      if (!access_token) { setLoading(false); return }

      const resetSession = readResetSession()
      if (resetSession.required) {
        setUser(resetSession.user)
        setRequiresPasswordReset(true)
        setIsAuthenticated(true)
        setLoading(false)
        return
      }

      try {
        const me = await fetchMe()
        setUser(me)
        setRequiresPasswordReset(!!me.must_reset_password)
        setIsAuthenticated(true)
        clearResetSession()
      } catch (err) {
        const message = (err?.message || '').toLowerCase()
        if (message.includes('password reset required')) {
          setUser(null)
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

  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password)
    if (res.success) {
      const loginUserData = res?.data?.user || null
      const mustReset = !!res?.data?.requires_password_reset || !!loginUserData?.must_reset_password

      if (mustReset) {
        setUser(loginUserData)
        setRequiresPasswordReset(true)
        setIsAuthenticated(true)
        saveResetSession(loginUserData)
        return res
      }

      const me = await fetchMe()
      setUser(me)
      setRequiresPasswordReset(false)
      setIsAuthenticated(true)
      clearResetSession()
    }
    return res
  }, [])

  const signup = useCallback(async (name, email, phone, password, selectedRole) => {
    const res = await registerUser({ name, email, phone, password, role: selectedRole || 'tenant' })
    if (res.success) {
      const signupUserData = res?.data?.user || null
      const mustReset = !!res?.data?.requires_password_reset || !!signupUserData?.must_reset_password

      if (mustReset) {
        setUser(signupUserData)
        setRequiresPasswordReset(true)
        setIsAuthenticated(true)
        saveResetSession(signupUserData)
        return res
      }

      const me = await fetchMe()
      setUser(me)
      setRequiresPasswordReset(false)
      setIsAuthenticated(true)
      clearResetSession()
    }
    return res
  }, [])

  const completeFirstLoginPasswordReset = useCallback(async (newPassword) => {
    const res = await setFirstLoginPassword(newPassword)
    if (res.success) {
      const me = await fetchMe()
      setUser(me)
      setRequiresPasswordReset(false)
      clearResetSession()
    }
    return res
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setIsAuthenticated(false)
    setUser(null)
    setRequiresPasswordReset(false)
    clearResetSession()
  }, [])

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    requiresPasswordReset,
    login,
    signup,
    logout,
    completeFirstLoginPasswordReset,
  }), [isAuthenticated, user, loading, requiresPasswordReset, login, signup, logout, completeFirstLoginPasswordReset])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
