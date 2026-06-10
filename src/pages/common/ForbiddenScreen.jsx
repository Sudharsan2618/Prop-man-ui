import { useNavigate, useLocation } from 'react-router-dom'
import { PageShell, GlassCard, PrimaryButton, SecondaryButton } from '../../components'
import './ForbiddenScreen.css'

/**
 * ForbiddenScreen — Shown when RequirePermission denies access.
 *
 * Reads the required permission detail from location.state.required so the
 * user can see what they were missing (handy in support / dev).
 */
export default function ForbiddenScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const required = location.state?.required || {}
  const codes = [required.code, ...(required.anyOf || []), ...(required.allOf || [])].filter(Boolean)

  return (
    <PageShell>
      <div className="forbidden">
        <GlassCard className="forbidden__card">
          <span className="material-symbols-outlined forbidden__icon">lock</span>
          <h1 className="forbidden__title">Access Denied</h1>
          <p className="forbidden__message">
            You don't have permission to view this page.
          </p>
          {codes.length > 0 && import.meta.env.DEV && (
            <p className="forbidden__detail">
              Required: <code>{codes.join(', ')}</code>
            </p>
          )}
          <div className="forbidden__actions">
            <SecondaryButton onClick={() => navigate(-1)}>Go Back</SecondaryButton>
            <PrimaryButton onClick={() => navigate('/')}>Go Home</PrimaryButton>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  )
}
