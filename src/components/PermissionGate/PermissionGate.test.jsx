import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PermissionGate from './PermissionGate'

// Mock RbacContext so we control hasPermission/hasAny/hasAll deterministically.
vi.mock('../../context/RbacContext', () => ({
  usePermissions: () => ({
    permissions: new Set(['payment.update', 'job.read']),
    loading: false,
    has: (code) => ['payment.update', 'job.read'].includes(code),
    hasAny: (codes) => codes.some((c) => ['payment.update', 'job.read'].includes(c)),
    hasAll: (codes) => codes.every((c) => ['payment.update', 'job.read'].includes(c)),
  }),
}))

describe('PermissionGate', () => {
  it('renders children when user has the code', () => {
    render(<PermissionGate code="payment.update"><span>visible</span></PermissionGate>)
    expect(screen.getByText('visible')).toBeInTheDocument()
  })

  it('hides children when user lacks the code', () => {
    render(<PermissionGate code="user.delete"><span>secret</span></PermissionGate>)
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('renders fallback when access is denied', () => {
    render(
      <PermissionGate code="user.delete" fallback={<span>nope</span>}>
        <span>secret</span>
      </PermissionGate>,
    )
    expect(screen.getByText('nope')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it('honors anyOf — visible when at least one matches', () => {
    render(
      <PermissionGate anyOf={['user.delete', 'payment.update']}>
        <span>shown</span>
      </PermissionGate>,
    )
    expect(screen.getByText('shown')).toBeInTheDocument()
  })

  it('honors allOf — hidden when one is missing', () => {
    render(
      <PermissionGate allOf={['payment.update', 'user.delete']}>
        <span>hidden</span>
      </PermissionGate>,
    )
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })

  it('passes when no code is specified (no-op gate)', () => {
    render(<PermissionGate><span>always</span></PermissionGate>)
    expect(screen.getByText('always')).toBeInTheDocument()
  })
})
