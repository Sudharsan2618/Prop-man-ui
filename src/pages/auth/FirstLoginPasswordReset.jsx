import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { GlassCard, PrimaryButton, InputField } from '../../components'

export default function FirstLoginPasswordReset() {
  const navigate = useNavigate()
  const { completeFirstLoginPasswordReset, logout } = useRole()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!password.trim() || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)
    try {
      await completeFirstLoginPasswordReset(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '430px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: 'var(--space-6)',
      display: 'flex',
      alignItems: 'center',
    }}>
      <GlassCard style={{ width: '100%' }}>
        <h1 style={{
          fontSize: 'var(--fs-h2)',
          fontWeight: 'var(--fw-bold)',
          marginBottom: 'var(--space-2)',
        }}>
          Set New Password
        </h1>
        <p style={{
          fontSize: 'var(--fs-body)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-4)',
        }}>
          This is your first login. You must set a new password to continue.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <InputField
            label="New Password"
            icon="lock"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a secure password"
          />
          <InputField
            label="Confirm Password"
            icon="lock"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
          />

          {error && (
            <p style={{ color: 'var(--status-danger)', fontSize: 'var(--fs-caption)' }}>{error}</p>
          )}

          <PrimaryButton icon="check" loading={loading} disabled={loading} onClick={handleSubmit}>
            {loading ? 'Saving...' : 'Save New Password'}
          </PrimaryButton>
          <button
            onClick={logout}
            style={{
              marginTop: 'var(--space-2)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
