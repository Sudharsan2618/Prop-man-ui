import { describe, it, expect } from 'vitest'
import { normalizeRole } from './RbacContext'

describe('normalizeRole', () => {
  it('returns null for falsy input', () => {
    expect(normalizeRole(null)).toBe(null)
    expect(normalizeRole('')).toBe(null)
    expect(normalizeRole(undefined)).toBe(null)
  })

  it('lower-cases canonical roles', () => {
    expect(normalizeRole('TENANT')).toBe('tenant')
    expect(normalizeRole('OWNER')).toBe('owner')
    expect(normalizeRole('Manager')).toBe('manager')
    expect(normalizeRole('SUPER_ADMIN')).toBe('super_admin')
  })

  it('maps SERVICE_PROVIDER → provider (wire alias)', () => {
    expect(normalizeRole('SERVICE_PROVIDER')).toBe('provider')
    expect(normalizeRole('service_provider')).toBe('provider')
  })

  it('maps legacy admin → manager', () => {
    expect(normalizeRole('admin')).toBe('manager')
    expect(normalizeRole('ADMIN')).toBe('manager')
  })

  it('passes through unknown roles lowercased (forward-compat)', () => {
    expect(normalizeRole('moderator')).toBe('moderator')
  })
})
