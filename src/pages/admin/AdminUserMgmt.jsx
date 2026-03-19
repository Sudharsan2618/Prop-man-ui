import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'
import { useNavigation } from '../../hooks/useNavigation'
import {
  PageShell, AppHeader, BottomNav, GlassCard, PrimaryButton, SecondaryButton,
  StatusBadge, SearchBar, TabNav, Avatar, InputField, ConfirmModal, Skeleton,
} from '../../components'
import { fetchUsers, inviteOwner } from '../../services/api'
import './AdminUserMgmt.css'

export default function AdminUserMgmt() {
  const navigate = useNavigate()
  const { handleTabChange: _navTabChange } = useNavigation()
  const [activeTab, setActiveTab] = useState('users')
  const [statusTab, setStatusTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [tempPwdModalOpen, setTempPwdModalOpen] = useState(false)

  const isServiceUser = (u) => {
    const activeRole = (u?.active_role || '').toLowerCase()
    const roles = (u?.roles || []).map((r) => (r || '').toLowerCase())
    return activeRole === 'provider' || roles.includes('provider')
  }

  const isPendingVerification = (u) => {
    const status = (u?.status || '').toLowerCase()
    return isServiceUser(u) && (status === 'pending' || status === 'awaiting_review')
  }

  useEffect(() => {
    fetchUsers()
      .then((data) => { setUsers(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = users
    .filter((u) => {
      if (statusTab === 'pending') return isPendingVerification(u)
      if (statusTab === 'verified') return u.status === 'verified'
      if (statusTab === 'flagged') return u.status === 'flagged' || u.status === 'rejected'
      return true
    })
    .filter((u) => {
      const name = (u.name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const id = (u.id || '').toLowerCase()
      const q = search.toLowerCase()
      return name.includes(q) || email.includes(q) || id.includes(q)
    })

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    _navTabChange(tab)
  }

  const statusLabels = {
    pending: 'Awaiting Review',
    awaiting_review: 'Awaiting Review',
    verified: 'Verified',
    flagged: 'Documents Rejected',
    rejected: 'Documents Rejected',
  }
  const statusMap = {
    pending: 'pending',
    awaiting_review: 'pending',
    verified: 'verified',
    flagged: 'overdue',
    rejected: 'overdue',
  }

  const handleInviteOwner = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Enter owner name and email')
      return
    }
    setInviteError('')
    setInviteResult(null)
    setInviteLoading(true)
    try {
      const created = await inviteOwner({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
      })
      setInviteResult(created)
      if (created?.temporary_password) {
        setTempPwdModalOpen(true)
      }
      setUsers((prev) => [created, ...prev])
      setInviteName('')
      setInviteEmail('')
    } catch (err) {
      setInviteError(err.message || 'Failed to invite owner')
    }
    setInviteLoading(false)
  }

  return (
    <PageShell
      header={<AppHeader title="User Management" hasNotification onNotificationClick={() => navigate('/notifications')} />}
      bottomNav={<BottomNav role="admin" activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <div className="aum stagger-children">
        <GlassCard className="aum__card">
          <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-2)' }}>Create NRI Owner</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <InputField
              label="Owner Name"
              icon="person"
              placeholder="Ravi Nair"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <InputField
              label="Owner Email"
              icon="mail"
              type="email"
              placeholder="owner@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            {inviteError && <p style={{ color: 'var(--status-danger)', fontSize: 'var(--fs-caption)' }}>{inviteError}</p>}
            <PrimaryButton icon="person_add" loading={inviteLoading} disabled={inviteLoading} onClick={handleInviteOwner}>
              {inviteLoading ? 'Creating...' : 'Create Owner'}
            </PrimaryButton>
          </div>
        </GlassCard>

        <SearchBar placeholder="Search users by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <TabNav
          tabs={[
            { key: 'pending', label: 'Pending Verification', count: users.filter((u) => isPendingVerification(u)).length },
            { key: 'verified', label: 'Verified' },
            { key: 'flagged', label: 'Flagged' },
            { key: 'all', label: 'All' },
          ]}
          activeTab={statusTab}
          onTabChange={setStatusTab}
        />

        <div className="aum__list">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} height="140px" radius="var(--radius-xl)" />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-tertiary)', display: 'block', marginBottom: 'var(--space-2)' }}>person_off</span>
              No users found
            </div>
          ) : (
            filtered.map((u) => (
              <GlassCard key={u.id} className="aum__card animate-slide-up">
                <div className="aum__card-row">
                  <Avatar initials={u?.initials || ''} size="md" verified={u.status === 'verified'} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--fw-semibold)' }}>{u.name}</p>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{u.email}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px', flexWrap: 'wrap' }}>
                      <StatusBadge status={statusMap[u.status] || 'pending'}>
                        {statusLabels[u.status] || u.status || 'Unknown'}
                      </StatusBadge>
                      <span className="aum__role-chip">{u.active_role || (u.roles && u.roles[0]) || 'User'}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="aum__card-actions">
                  {isPendingVerification(u) ? (
                    <>
                      <SecondaryButton variant="danger" icon="close">Reject</SecondaryButton>
                      <PrimaryButton icon="check" onClick={() => navigate(`/kyc-review/${u.id}`)}>Verify</PrimaryButton>
                    </>
                  ) : u.status === 'verified' ? (
                    <SecondaryButton icon="visibility" onClick={() => navigate(`/kyc-review/${u.id}`)}>View Details</SecondaryButton>
                  ) : (
                    <SecondaryButton icon="refresh" onClick={() => navigate(`/kyc-review/${u.id}`)}>Request Resubmission</SecondaryButton>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
      <ConfirmModal
        open={tempPwdModalOpen}
        variant="warning"
        icon="key"
        title="Temporary Password"
        subtitle="Copy this now — it won't be shown again"
        description={inviteResult?.temporary_password || ''}
        confirmText="Copy Password"
        cancelText="Close"
        onConfirm={async () => {
          if (inviteResult?.temporary_password && navigator?.clipboard) {
            try {
              await navigator.clipboard.writeText(inviteResult.temporary_password)
            } catch {}
          }
          setTempPwdModalOpen(false)
          setInviteResult(null)
        }}
        onCancel={() => {
          setTempPwdModalOpen(false)
          setInviteResult(null)
        }}
      />
    </PageShell>
  )
}
