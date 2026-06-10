import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard,
} from '../../components'
import './TaxTds.css'

export default function TaxTds() {
  const navigate = useNavigate()
  const { user } = useRole()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('tax')

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Tax"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/profile')}
        />
      }
      bottomNav={<BottomNav role="owner" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
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
