import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ConfirmModal,
} from '../../components'
import {
  createUserAsSuperAdmin,
  fetchProperties,
  fetchRoles,
  fetchUserManagedSummary,
  fetchUsers,
  fetchUserRoles,
  updateUserRoles,
} from '../../services/api'
import { reportError } from '../../utils/errors'
import SALayout from './SALayout'
import './SAUsers.css'

const CATEGORIES = [
  { key: 'manager', label: 'Managers', icon: 'manage_accounts', desc: 'Coordinate internal operations and manage property admins.' },
  { key: 'owner', label: 'Owners', icon: 'real_estate_agent', desc: 'Property owners with portfolio and tenant oversight.' },
  { key: 'provider', label: 'Service Providers', icon: 'engineering', desc: 'External vendors, maintenance crews, and specialists.' },
  { key: 'tenant', label: 'Tenants', icon: 'person', desc: 'Active tenants with property leases and payments.' },
]

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'provider', label: 'Service Provider' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'super_admin', label: 'Super Admin' },
]

function getUserPrimaryRole(user) {
  return (user?.active_role || user?.roles?.[0] || '').toLowerCase()
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SAUsers() {
  const navigate = useNavigate()

  const [view, setView] = useState('categories') // 'categories' | 'registry'
  const [category, setCategory] = useState('manager')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [detailSummary, setDetailSummary] = useState(null)
  const [roleEditUser, setRoleEditUser] = useState(null)
  const [selectedUserRoles, setSelectedUserRoles] = useState([])

  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createRole, setCreateRole] = useState('manager')
  const [createBusy, setCreateBusy] = useState(false)
  const [createResult, setCreateResult] = useState(null)
  const [createError, setCreateError] = useState('')
  const [showTempPwdModal, setShowTempPwdModal] = useState(false)

  // Manager property assignment
  const [allProperties, setAllProperties] = useState([])
  const [createPropertyIds, setCreatePropertyIds] = useState([])

  useEffect(() => {
    fetchUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => reportError(err, { context: 'SAUsers.fetchUsers', silent: true }))
    fetchRoles()
      .then((data) => setRoles(data || []))
      .catch((err) => reportError(err, { context: 'SAUsers.fetchRoles', silent: true }))
    fetchProperties()
      .then((data) => setAllProperties(data || []))
      .catch((err) => reportError(err, { context: 'SAUsers.fetchProperties', silent: true }))
  }, [])

  const filteredUsers = useMemo(() => {
    return (users || [])
      .filter((u) => getUserPrimaryRole(u) === category)
      .filter((u) => {
        const q = query.toLowerCase().trim()
        if (!q) return true
        return (
          (u?.name || '').toLowerCase().includes(q) ||
          (u?.email || '').toLowerCase().includes(q) ||
          (u?.phone || '').toLowerCase().includes(q)
        )
      })
  }, [users, category, query])

  const categoryCounts = useMemo(() => {
    const counts = {}
    ;(users || []).forEach((u) => {
      const r = getUserPrimaryRole(u)
      counts[r] = (counts[r] || 0) + 1
    })
    return counts
  }, [users])

  const selectCategory = (key) => {
    setCategory(key)
    setView('registry')
    setDetailUser(null)
    setRoleEditUser(null)
    setQuery('')
  }

  const openDetail = async (u) => {
    setDetailUser(u)
    setRoleEditUser(null)
    try {
      const summary = await fetchUserManagedSummary(u.id)
      setDetailSummary(summary)
    } catch {
      setDetailSummary(null)
    }
  }

  const openRoleEditor = async (u) => {
    setRoleEditUser(u)
    setDetailUser(null)
    try {
      const payload = await fetchUserRoles(u.id)
      setSelectedUserRoles((payload?.roles || []).map((r) => r.id))
    } catch {
      setSelectedUserRoles([])
    }
  }

  const saveRoles = async () => {
    if (!roleEditUser) return
    try {
      await updateUserRoles(roleEditUser.id, selectedUserRoles)
      const updated = await fetchUsers()
      setUsers(updated || [])
      setRoleEditUser(null)
    } catch (err) { reportError(err, { context: 'SAUsers.saveRoles' }) }
  }

  const createUser = async () => {
    if (!createName.trim() || !createEmail.trim()) {
      setCreateError('Name and email are required')
      return
    }
    setCreateBusy(true)
    setCreateError('')
    setCreateResult(null)
    try {
      const payload = {
        name: createName.trim(),
        email: createEmail.trim(),
        phone: createPhone.trim() || null,
        active_role: createRole,
        roles: [createRole],
        status: createRole === 'provider' ? 'pending' : 'verified',
      }
      if (createRole === 'manager' && createPropertyIds.length > 0) {
        payload.property_ids = createPropertyIds
      }
      const created = await createUserAsSuperAdmin(payload)
      setCreateResult(created)
      if (created?.temporary_password) setShowTempPwdModal(true)
      const updated = await fetchUsers()
      setUsers(updated || [])
      setCreateName('')
      setCreateEmail('')
      setCreatePhone('')
      setCreatePropertyIds([])
      setShowCreate(false)
    } catch (err) {
      setCreateError(err?.message || 'Failed to create user')
    }
    setCreateBusy(false)
  }

  const roleRows = roles.length ? roles : ROLE_OPTIONS.map((r, i) => ({ id: -(i + 1), name: r.value }))
  const activeCategory = CATEGORIES.find((c) => c.key === category)

  const addUserBtn = (
    <button className="sau__add-btn" onClick={() => setShowCreate(true)}>
      <span className="material-symbols-outlined">person_add</span>
      <span>Add User</span>
    </button>
  )

  return (
    <SALayout activeKey="users" title="User Management" subtitle="Manage platform users across all roles" actions={addUserBtn}>
      <div className="sau">
        {/* ── Category Selection View ── */}
        {view === 'categories' && (
          <div className="sau__categories">
            <div className="sau__cat-header">
              <h2 className="sau__cat-title">Select a user category</h2>
              <p className="sau__cat-subtitle">Choose a vertical to view and manage users.</p>
            </div>
            <div className="sau__cat-grid">
              {CATEGORIES.map((cat) => (
                <div key={cat.key} className="sau__cat-card" onClick={() => selectCategory(cat.key)}>
                  <div className="sau__cat-icon-wrap">
                    <span className="material-symbols-outlined">{cat.icon}</span>
                  </div>
                  <h3 className="sau__cat-name">{cat.label}</h3>
                  <p className="sau__cat-desc">{cat.desc}</p>
                  <div className="sau__cat-footer">
                    <span className="sau__cat-count">{categoryCounts[cat.key] || 0} Accounts</span>
                    <span className="material-symbols-outlined sau__cat-arrow">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Registry View ── */}
        {view === 'registry' && (
          <div className="sau__registry">
            {/* Breadcrumb */}
            <div className="sau__breadcrumb">
              <button className="sau__breadcrumb-link" onClick={() => setView('categories')}>Users</button>
              <span className="material-symbols-outlined sau__breadcrumb-sep">chevron_right</span>
              <span className="sau__breadcrumb-current">{activeCategory?.label}</span>
            </div>

            {/* Stats Row */}
            <div className="sau__reg-stats">
              <div className="sau__reg-stat">
                <p className="sau__reg-stat-val">{filteredUsers.length}</p>
                <p className="sau__reg-stat-lbl">Total {activeCategory?.label}</p>
              </div>
              <div className="sau__reg-stat">
                <p className="sau__reg-stat-val">
                  {filteredUsers.filter((u) => (u.status || '').toLowerCase() === 'verified').length}
                </p>
                <p className="sau__reg-stat-lbl">Active</p>
              </div>
              <div className="sau__reg-stat">
                <p className="sau__reg-stat-val">
                  {filteredUsers.filter((u) => (u.status || '').toLowerCase() !== 'verified').length}
                </p>
                <p className="sau__reg-stat-lbl">Pending</p>
              </div>
            </div>

            {/* Search */}
            <div className="sau__search-row">
              <div className="sau__search-wrap">
                <span className="material-symbols-outlined sau__search-icon">search</span>
                <input
                  className="sau__search-input"
                  placeholder="Search by name, email, or phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button className="sau__search-clear" onClick={() => setQuery('')}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <span className="sau__result-count">
                {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* User Table / Cards */}
            <div className="sau__table-wrap">
              {/* Desktop table header */}
              <div className="sau__table-header">
                <span className="sau__th sau__th--name">User</span>
                <span className="sau__th sau__th--contact">Contact</span>
                <span className="sau__th sau__th--status">Status</span>
                <span className="sau__th sau__th--actions">Actions</span>
              </div>

              {filteredUsers.length === 0 && (
                <div className="sau__empty">
                  <span className="material-symbols-outlined">search_off</span>
                  <p>No users found{query ? ` for "${query}"` : ''}.</p>
                </div>
              )}

              {filteredUsers.map((u) => {
                const isVerified = (u.status || '').toLowerCase() === 'verified'
                return (
                  <div key={u.id} className="sau__table-row">
                    <div className="sau__td sau__td--name">
                      <div className="sau__avatar">{getInitials(u.name)}</div>
                      <div className="sau__user-info">
                        <p className="sau__user-name">{u.name}</p>
                        <p className="sau__user-id">{u.id?.slice(0, 12)}</p>
                      </div>
                    </div>
                    <div className="sau__td sau__td--contact">
                      <p className="sau__user-email">{u.email}</p>
                      {u.phone && <p className="sau__user-phone">{u.phone}</p>}
                    </div>
                    <div className="sau__td sau__td--status">
                      <span className={`sau__status-pill ${isVerified ? 'sau__status-pill--active' : 'sau__status-pill--pending'}`}>
                        {isVerified ? 'Active' : 'Pending'}
                      </span>
                    </div>
                    <div className="sau__td sau__td--actions">
                      <button className="sau__action-btn" onClick={() => openDetail(u)} title="View Details">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button className="sau__action-btn" onClick={() => openRoleEditor(u)} title="Manage Roles">
                        <span className="material-symbols-outlined">admin_panel_settings</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Detail Panel ── */}
        {detailUser && (
          <div className="sau__panel-overlay" onClick={() => setDetailUser(null)}>
            <div className="sau__panel" onClick={(e) => e.stopPropagation()}>
              <div className="sau__panel-header">
                <h3 className="sau__panel-title">User Details</h3>
                <button className="sau__panel-close" onClick={() => setDetailUser(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="sau__panel-body">
                <div className="sau__profile-header">
                  <div className="sau__avatar sau__avatar--lg">{getInitials(detailUser.name)}</div>
                  <div>
                    <p className="sau__profile-name">{detailUser.name}</p>
                    <p className="sau__profile-role">{getUserPrimaryRole(detailUser).replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
                <div className="sau__profile-grid">
                  <div className="sau__profile-field">
                    <span className="sau__profile-label">Email</span>
                    <span className="sau__profile-value">{detailUser.email}</span>
                  </div>
                  <div className="sau__profile-field">
                    <span className="sau__profile-label">Phone</span>
                    <span className="sau__profile-value">{detailUser.phone || '—'}</span>
                  </div>
                  <div className="sau__profile-field">
                    <span className="sau__profile-label">Status</span>
                    <span className="sau__profile-value">{detailUser.status || 'pending'}</span>
                  </div>
                  <div className="sau__profile-field">
                    <span className="sau__profile-label">ID</span>
                    <span className="sau__profile-value sau__mono">{detailUser.id}</span>
                  </div>
                </div>
                {detailSummary?.counts && (
                  <div className="sau__summary-stats">
                    <h4 className="sau__summary-heading">Managed Resources</h4>
                    <div className="sau__summary-grid">
                      <div className="sau__summary-item">
                        <span className="sau__summary-val">{detailSummary.counts.managed_properties || 0}</span>
                        <span className="sau__summary-lbl">Managed</span>
                      </div>
                      <div className="sau__summary-item">
                        <span className="sau__summary-val">{detailSummary.counts.owned_properties || 0}</span>
                        <span className="sau__summary-lbl">Owned</span>
                      </div>
                      <div className="sau__summary-item">
                        <span className="sau__summary-val">{detailSummary.counts.tenant_properties || 0}</span>
                        <span className="sau__summary-lbl">Tenancies</span>
                      </div>
                      <div className="sau__summary-item">
                        <span className="sau__summary-val">{detailSummary.counts.provider_jobs || 0}</span>
                        <span className="sau__summary-lbl">Jobs</span>
                      </div>
                      <div className="sau__summary-item">
                        <span className="sau__summary-val">{detailSummary.counts.invited_users || 0}</span>
                        <span className="sau__summary-lbl">Invited</span>
                      </div>
                    </div>
                  </div>
                )}
                <button className="sau__panel-action-btn" onClick={() => { setDetailUser(null); navigate(`/sa/users/${detailUser.id}`) }}>
                  <span className="material-symbols-outlined">open_in_new</span>
                  View Full Profile
                </button>
                <button className="sau__panel-action-btn" onClick={() => { setDetailUser(null); openRoleEditor(detailUser) }}>
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                  Manage Roles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Role Editor Panel ── */}
        {roleEditUser && (
          <div className="sau__panel-overlay" onClick={() => setRoleEditUser(null)}>
            <div className="sau__panel" onClick={(e) => e.stopPropagation()}>
              <div className="sau__panel-header">
                <h3 className="sau__panel-title">Role Assignment — {roleEditUser.name}</h3>
                <button className="sau__panel-close" onClick={() => setRoleEditUser(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="sau__panel-body">
                <div className="sau__role-list">
                  {roleRows.map((roleItem) => {
                    const checked = selectedUserRoles.includes(roleItem.id)
                    return (
                      <label key={roleItem.id} className={`sau__role-item ${checked ? 'sau__role-item--checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedUserRoles((prev) =>
                              e.target.checked ? [...prev, roleItem.id] : prev.filter((id) => id !== roleItem.id)
                            )
                          }}
                        />
                        <span className="sau__role-name">{roleItem.name.replace('_', ' ')}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="sau__panel-actions">
                  <button className="sau__btn sau__btn--secondary" onClick={() => setRoleEditUser(null)}>Cancel</button>
                  <button className="sau__btn sau__btn--primary" onClick={saveRoles}>Save Roles</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Create User Drawer ── */}
        {showCreate && (
          <div className="sau__panel-overlay" onClick={() => setShowCreate(false)}>
            <div className="sau__panel" onClick={(e) => e.stopPropagation()}>
              <div className="sau__panel-header">
                <h3 className="sau__panel-title">Create New User</h3>
                <button className="sau__panel-close" onClick={() => setShowCreate(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="sau__panel-body">
                <div className="sau__form-group">
                  <label className="sau__form-label">Full Name</label>
                  <input className="sau__form-input" placeholder="Enter full name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                </div>
                <div className="sau__form-group">
                  <label className="sau__form-label">Email Address</label>
                  <input className="sau__form-input" type="email" placeholder="user@example.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
                </div>
                <div className="sau__form-group">
                  <label className="sau__form-label">Phone Number</label>
                  <input className="sau__form-input" placeholder="+91 XXXXX XXXXX" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
                </div>
                <div className="sau__form-group">
                  <label className="sau__form-label">Role</label>
                  <select className="sau__form-select" value={createRole} onChange={(e) => { setCreateRole(e.target.value); setCreatePropertyIds([]) }}>
                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {createRole === 'manager' && allProperties.length > 0 && (
                  <div className="sau__form-group">
                    <label className="sau__form-label">Assign Properties (optional)</label>
                    <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {allProperties.map(p => {
                        const checked = createPropertyIds.includes(p.id)
                        return (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-caption)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setCreatePropertyIds(prev => checked ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            <span>{p.name} — {p.city}</span>
                          </label>
                        )
                      })}
                    </div>
                    {createPropertyIds.length > 0 && (
                      <p style={{ fontSize: 'var(--fs-overline)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {createPropertyIds.length} propert{createPropertyIds.length === 1 ? 'y' : 'ies'} selected
                      </p>
                    )}
                  </div>
                )}
                {createError && <p className="sau__form-error">{createError}</p>}
                <div className="sau__panel-actions">
                  <button className="sau__btn sau__btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button className="sau__btn sau__btn--primary" disabled={createBusy} onClick={createUser}>
                    {createBusy ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showTempPwdModal}
        variant="warning"
        icon="key"
        title="Temporary Password"
        subtitle="Copy this now — it will not be shown again"
        description={createResult?.temporary_password || ''}
        confirmText="Copy"
        cancelText="Close"
        onConfirm={async () => {
          if (createResult?.temporary_password && navigator?.clipboard) {
            try { await navigator.clipboard.writeText(createResult.temporary_password) } catch {}
          }
          setShowTempPwdModal(false)
        }}
        onCancel={() => setShowTempPwdModal(false)}
      />
    </SALayout>
  )
}
