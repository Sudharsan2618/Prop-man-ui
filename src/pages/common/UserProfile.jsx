import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, SecondaryButton,
  Avatar, ProgressBar,
} from '../../components'
import './UserProfile.css'

const MENU_ITEMS = [
  { icon: 'person', label: 'Personal Information', sub: null, route: '/profile' },
  { icon: 'verified_user', label: 'KYC Documents', sub: 'Pending verification', subColor: 'var(--status-warning)', route: '/kyc-verification' },
  { icon: 'account_balance', label: 'Bank Account Details', sub: null, route: '/bank-accounts' },
  { icon: 'bookmark', label: 'Saved Addresses', sub: null, route: '/profile' },
  { icon: 'lock', label: 'Security & Password', sub: null, route: '/profile' },
]

export default function UserProfile() {
  const { user, role, logout } = useRole()
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('profile')

  const roleLabels = { tenant: 'Tenant', owner: 'NRI Owner', provider: 'Service Provider', admin: 'Admin' }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  return (
    <PageShell
      header={
        <AppHeader
          title="LuxeLife"
          subtitle="Profile"
          avatarText={user?.initials || ''}
          hasNotification={true}
          onNotificationClick={() => navigate('/notifications')}
          onAvatarClick={() => navigate('/notification-settings')}
        />
      }
      bottomNav={<BottomNav role={role} activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="up stagger-children">
        {/* ── Profile Information Card ── */}
        <GlassCard className="up__profile-card animate-slide-up">
          <h2 className="up__card-heading">Profile Information</h2>

          <div className="up__profile-row">
            <div className="up__avatar-ring">
              <Avatar initials={user?.initials || ''} size="lg" verified={user?.status === 'verified'} />
            </div>
            <div className="up__profile-info">
              <p className="up__name">{user.name}</p>
              <p className="up__email">{user.email}</p>
              <span className="up__role-badge">{roleLabels[role]}</span>
            </div>
            <button className="up__edit-btn" onClick={() => navigate('/profile')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            </button>
          </div>

          <div className="up__contact-grid">
            <div className="up__contact-row">
              <span className="up__contact-label">Phone</span>
              <span className="up__contact-value">{user.phone || '+91 98765 43210'}</span>
            </div>
            <div className="up__contact-row">
              <span className="up__contact-label">Location</span>
              <span className="up__contact-value">{user.location || 'India'}</span>
            </div>
          </div>
        </GlassCard>

        {/* ── KYC Progress ── */}
        <GlassCard className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <p style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)' }}>KYC Verification Progress</p>
            <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--primary)' }}>{user.kycProgress}%</span>
          </div>
          <ProgressBar value={user.kycProgress} />
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
            Complete your profile to unlock premium features
          </p>
        </GlassCard>

        {/* ── Account Settings ── */}
        <div>
          <p className="up__overline">ACCOUNT SETTINGS</p>
          <div className="up__menu-list">
            {MENU_ITEMS.map((item) => (
              <GlassCard key={item.label} interactive className="up__menu-item" onClick={() => navigate(item.route)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="up__menu-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{item.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--fw-medium)' }}>{item.label}</p>
                    {item.sub && <p style={{ fontSize: 'var(--fs-caption)', color: item.subColor }}>{item.sub}</p>}
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>chevron_right</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Logout ── */}
        <SecondaryButton variant="danger" icon="logout" onClick={() => { logout(); navigate('/welcome', { replace: true }) }}>Logout</SecondaryButton>
      </div>
    </PageShell>
  )
}
