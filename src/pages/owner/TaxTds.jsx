import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard,
} from '../../components'
import './TaxTds.css'

export default function TaxTds() {
  const navigate = useNavigate()

  return (
    <PageShell header={<SubPageHeader title="Tax & TDS" onBack={() => navigate(-1)} />}>
      <div className="tax animate-fade-in">
        <GlassCard className="tax__hero">
          <div style={{ textAlign: 'center', display: 'grid', gap: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'var(--accent)' }}>receipt_long</span>
            <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>Tax & TDS Statements</p>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              Coming soon. We are preparing owner tax summaries and downloadable TDS statements.
            </p>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  )
}
