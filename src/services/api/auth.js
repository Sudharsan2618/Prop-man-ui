import { get, post, setTokens, clearTokens } from './client'

export async function loginUser(email, password) {
  const res = await post('/auth/login', { body: { email, password }, auth: false })
  if (res.success) setTokens(res.data.tokens)
  return res
}

export async function registerUser({ name, email, phone, password, role }) {
  const res = await post('/auth/register', { body: { name, email, phone, password, role }, auth: false })
  if (res.success) setTokens(res.data.tokens)
  return res
}

export async function logoutUser() {
  try { await post('/auth/logout') } catch { /* ignore */ }
  clearTokens()
}

export async function setFirstLoginPassword(newPassword) {
  return post('/auth/set-password-first-login', { body: { new_password: newPassword } })
}

export async function fetchMe() {
  const res = await get('/users/me')
  return res.data
}

/**
 * fetchMyPermissions — optional flat-list endpoint.
 *
 * If the backend implements GET /auth/me/permissions returning
 *   { codes: ['payment.update', 'user.read', ...] }
 * this is the single round-trip resolver. If the endpoint is not yet
 * implemented (404), RbacContext falls back to the multi-call path.
 *
 * Backend should back this endpoint with the `user_permissions_view`
 * created in DB/migrations/v2_0_to_v2_1.sql §12.
 */
export async function fetchMyPermissions() {
  const res = await get('/auth/me/permissions')
  return res?.data || res
}
