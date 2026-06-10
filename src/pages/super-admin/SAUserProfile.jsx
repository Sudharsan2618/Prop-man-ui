import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchUserManagedSummary } from '../../services/api'
import SALayout from './SALayout'
import './SAUserProfile.css'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatRent(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`
}

export default function SAUserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchUserManagedSummary(userId)
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  const user = data?.user
  const counts = data?.counts || {}

  const statusClass = user?.status === 'verified' ? 'saup__header-status--active' : 'saup__header-status--pending'

  const backAction = (
    <button
      className="sap__add-btn"
      style={{ background: 'var(--surface-darker)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
      onClick={() => navigate('/sa/users')}
    >
      <span className="material-symbols-outlined">arrow_back</span>
      Back
    </button>
  )

  if (loading) {
    return (
      <SALayout activeKey="users" title="User Profile" actions={backAction}>
        <div className="saup__loading">Loading user profile...</div>
      </SALayout>
    )
  }

  if (!data || !user) {
    return (
      <SALayout activeKey="users" title="User Profile" actions={backAction}>
        <div className="saup__loading">User not found.</div>
      </SALayout>
    )
  }

  return (
    <SALayout activeKey="users" title="User Profile" actions={backAction}>
      <div className="saup">
        {/* Profile Header */}
        <div className="saup__header">
          <div className="saup__avatar">{getInitials(user.name)}</div>
          <div className="saup__header-info">
            <h2 className="saup__header-name">{user.name}</h2>
            <p className="saup__header-role">{(user.active_role || '').replace(/_/g, ' ')}</p>
          </div>
          <span className={`saup__header-status ${statusClass}`}>{user.status}</span>
        </div>

        {/* Contact Info */}
        <div className="saup__contact">
          <div className="saup__contact-item">
            <span className="material-symbols-outlined">email</span>
            <div>
              <p className="saup__contact-label">Email</p>
              <p className="saup__contact-value">{user.email || '—'}</p>
            </div>
          </div>
          <div className="saup__contact-item">
            <span className="material-symbols-outlined">phone</span>
            <div>
              <p className="saup__contact-label">Phone</p>
              <p className="saup__contact-value">{user.phone || '—'}</p>
            </div>
          </div>
          <div className="saup__contact-item">
            <span className="material-symbols-outlined">location_on</span>
            <div>
              <p className="saup__contact-label">Location</p>
              <p className="saup__contact-value">{user.location || '—'}</p>
            </div>
          </div>
          <div className="saup__contact-item">
            <span className="material-symbols-outlined">calendar_today</span>
            <div>
              <p className="saup__contact-label">Joined</p>
              <p className="saup__contact-value">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="saup__stats">
          <div className="saup__stat">
            <div className="saup__stat-icon" style={{ background: 'rgba(27,42,74,0.06)', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <p className="saup__stat-val">{counts.managed_properties || 0}</p>
              <p className="saup__stat-lbl">Managed</p>
            </div>
          </div>
          <div className="saup__stat">
            <div className="saup__stat-icon" style={{ background: 'rgba(22,163,74,0.06)', color: 'var(--status-success)' }}>
              <span className="material-symbols-outlined">home</span>
            </div>
            <div>
              <p className="saup__stat-val">{counts.owned_properties || 0}</p>
              <p className="saup__stat-lbl">Owned</p>
            </div>
          </div>
          <div className="saup__stat">
            <div className="saup__stat-icon" style={{ background: 'rgba(217,119,6,0.06)', color: 'var(--status-warning)' }}>
              <span className="material-symbols-outlined">key</span>
            </div>
            <div>
              <p className="saup__stat-val">{counts.tenant_properties || 0}</p>
              <p className="saup__stat-lbl">Renting</p>
            </div>
          </div>
          <div className="saup__stat">
            <div className="saup__stat-icon" style={{ background: 'rgba(139,92,246,0.06)', color: '#8b5cf6' }}>
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div>
              <p className="saup__stat-val">{counts.invited_users || 0}</p>
              <p className="saup__stat-lbl">Invited</p>
            </div>
          </div>
        </div>

        {/* Managed Properties */}
        {(data.managed_properties?.length > 0) && (
          <div className="saup__section">
            <p className="saup__section-title">
              <span className="material-symbols-outlined">apartment</span>
              Managed Properties
            </p>
            <div className="saup__prop-grid">
              {data.managed_properties.map(p => (
                <div key={p.id} className="saup__prop-card" onClick={() => navigate('/sa/properties', { state: { selectProperty: p.id } })}>
                  <div className="saup__prop-icon"><span className="material-symbols-outlined">location_city</span></div>
                  <div className="saup__prop-info">
                    <p className="saup__prop-name">{p.name}</p>
                    <p className="saup__prop-city">{p.city}</p>
                  </div>
                  <div className="saup__prop-meta">
                    <p className="saup__prop-rent">{formatRent(p.rent)}/mo</p>
                    <span className={`saup__prop-status saup__prop-status--${p.occupancy}`}>{p.occupancy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owned Properties */}
        {(data.owned_properties?.length > 0) && (
          <div className="saup__section">
            <p className="saup__section-title">
              <span className="material-symbols-outlined">home</span>
              Owned Properties
            </p>
            <div className="saup__prop-grid">
              {data.owned_properties.map(p => (
                <div key={p.id} className="saup__prop-card" onClick={() => navigate('/sa/properties', { state: { selectProperty: p.id } })}>
                  <div className="saup__prop-icon"><span className="material-symbols-outlined">location_city</span></div>
                  <div className="saup__prop-info">
                    <p className="saup__prop-name">{p.name}</p>
                    <p className="saup__prop-city">{p.city}</p>
                  </div>
                  <div className="saup__prop-meta">
                    <p className="saup__prop-rent">{formatRent(p.rent)}/mo</p>
                    <span className={`saup__prop-status saup__prop-status--${p.occupancy}`}>{p.occupancy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tenant Properties */}
        {(data.tenant_properties?.length > 0) && (
          <div className="saup__section">
            <p className="saup__section-title">
              <span className="material-symbols-outlined">key</span>
              Rented Properties
            </p>
            <div className="saup__prop-grid">
              {data.tenant_properties.map(p => (
                <div key={p.id} className="saup__prop-card" onClick={() => navigate('/sa/properties', { state: { selectProperty: p.id } })}>
                  <div className="saup__prop-icon"><span className="material-symbols-outlined">location_city</span></div>
                  <div className="saup__prop-info">
                    <p className="saup__prop-name">{p.name}</p>
                    <p className="saup__prop-city">{p.city}</p>
                  </div>
                  <div className="saup__prop-meta">
                    <p className="saup__prop-rent">{formatRent(p.rent)}/mo</p>
                    <span className={`saup__prop-status saup__prop-status--${p.occupancy}`}>{p.occupancy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Jobs */}
        {(data.provider_jobs?.length > 0) && (
          <div className="saup__section">
            <p className="saup__section-title">
              <span className="material-symbols-outlined">work</span>
              Service Jobs
            </p>
            <div className="saup__prop-grid">
              {data.provider_jobs.map(j => (
                <div key={j.id} className="saup__prop-card">
                  <div className="saup__prop-icon"><span className="material-symbols-outlined">handyman</span></div>
                  <div className="saup__prop-info">
                    <p className="saup__prop-name">{j.service_type}</p>
                    <p className="saup__prop-city">{j.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invited Users */}
        {(data.invited_users?.length > 0) && (
          <div className="saup__section">
            <p className="saup__section-title">
              <span className="material-symbols-outlined">person_add</span>
              Invited Users
            </p>
            <div className="saup__prop-grid">
              {data.invited_users.map(u => (
                <div key={u.id} className="saup__prop-card" onClick={() => navigate(`/sa/users/${u.id}`)}>
                  <div className="saup__prop-icon" style={{ background: 'rgba(139,92,246,0.06)', color: '#8b5cf6' }}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="saup__prop-info">
                    <p className="saup__prop-name">{u.name}</p>
                    <p className="saup__prop-city">{u.email}</p>
                  </div>
                  <div className="saup__prop-meta">
                    <span className={`saup__prop-status ${u.status === 'verified' ? 'saup__prop-status--occupied' : 'saup__prop-status--vacant'}`}>{u.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!data.managed_properties?.length && !data.owned_properties?.length && !data.tenant_properties?.length && !data.provider_jobs?.length && !data.invited_users?.length && (
          <div className="saup__empty">
            <span className="material-symbols-outlined">inbox</span>
            No related data found for this user.
          </div>
        )}
      </div>
    </SALayout>
  )
}
