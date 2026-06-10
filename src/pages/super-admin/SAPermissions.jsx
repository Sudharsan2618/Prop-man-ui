import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createPermission, createRole, createUserAsSuperAdmin,
  deletePermission, deleteRole,
  fetchPermissionMatrix, fetchPermissions, fetchRoles, fetchUsers, fetchUserRoles,
  updatePermission, updateRole, updateRolePermissions, updateUserRoles,
} from '../../services/api'
import { reportError } from '../../utils/errors'
import SALayout from './SALayout'
import './SAPermissions.css'

// Built-in roles can never be deleted (the backend enforces this too).
const BUILTIN_ROLES = new Set(['super_admin', 'manager', 'owner', 'tenant', 'service_provider', 'provider'])

const TABS = [
  { key: 'roles', label: 'Roles', icon: 'shield' },
  { key: 'permissions', label: 'Permissions', icon: 'key' },
  { key: 'users', label: 'Users', icon: 'group' },
  { key: 'matrix', label: 'Matrix', icon: 'grid_view' },
]

// Role IDs match the DB v2 role_enum (08_database_schema.md §4):
// SUPER_ADMIN, MANAGER, OWNER, TENANT, SERVICE_PROVIDER (wire alias: provider).
const ROLE_OPTIONS = ['tenant', 'owner', 'provider', 'manager', 'super_admin']

const ROLE_ICONS = {
  super_admin: 'star', admin: 'admin_panel_settings', manager: 'edit_note',
  owner: 'key', tenant: 'person', service_provider: 'build', provider: 'build',
  auditor: 'visibility',
}

const ACTION_BUTTONS = ['read', 'create', 'update', 'delete']

/* ── Custom Select dropdown (mobile-friendly) ── */
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected ? selected.label : (placeholder || 'Select...')

  return (
    <div className="sapm__select" ref={ref}>
      <button type="button" className={`sapm__select-trigger ${open ? 'sapm__select-trigger--open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <span className={`sapm__select-value ${!selected ? 'sapm__select-value--placeholder' : ''}`}>{displayLabel}</span>
        <span className="material-symbols-outlined sapm__select-arrow">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="sapm__select-menu">
          {options.map((opt) => (
            <button key={opt.value} type="button" className={`sapm__select-option ${opt.value === value ? 'sapm__select-option--active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}>
              <span>{opt.label}</span>
              {opt.value === value && <span className="material-symbols-outlined sapm__select-check">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SAPermissions() {
  const [innerTab, setInnerTab] = useState('roles')

  /* ── Data ── */
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [users, setUsers] = useState([])
  const [matrix, setMatrix] = useState({ roles: [], permissions: [], matrix: [] })
  const [query, setQuery] = useState('')

  /* ── Load / async UI state ── */
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [roleFormError, setRoleFormError] = useState('')
  const [permFormError, setPermFormError] = useState('')
  const [userFormError, setUserFormError] = useState('')
  const [roleBusy, setRoleBusy] = useState(false)
  const [permBusy, setPermBusy] = useState(false)
  const [userBusy, setUserBusy] = useState(false)
  const [matrixSaving, setMatrixSaving] = useState(false)
  const [userRolesSaving, setUserRolesSaving] = useState(false)

  /* ── Create panels (mobile slide-in) ── */
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showCreatePerm, setShowCreatePerm] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)

  /* ── Role form ── */
  const [newRoleName, setNewRoleName] = useState('manager')
  const [newRoleDescription, setNewRoleDescription] = useState('')

  /* ── Permission form ── */
  const [newPermCode, setNewPermCode] = useState('')
  const [newPermEntity, setNewPermEntity] = useState('')
  const [newPermAction, setNewPermAction] = useState('read')
  const [newPermDescription, setNewPermDescription] = useState('')

  /* ── User form ── */
  const [createUserName, setCreateUserName] = useState('')
  const [createUserEmail, setCreateUserEmail] = useState('')
  const [createUserRole, setCreateUserRole] = useState('manager')

  /* ── Matrix & user-roles ── */
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState(null)
  const [selectedRolePermissionIds, setSelectedRolePermissionIds] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState([])

  /* ── Pagination (permissions tab) ── */
  const PERMS_PER_PAGE = 10
  const [permPage, setPermPage] = useState(1)

  /* ── Confirm modal state ── */
  const [confirmModal, setConfirmModal] = useState(null) // { title, message, onConfirm }
  const [confirmStep, setConfirmStep] = useState(1) // 1 = yes/no, 2 = type agree
  const [confirmInput, setConfirmInput] = useState('')

  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({ title, message, onConfirm })
    setConfirmStep(1)
    setConfirmInput('')
  }

  const closeConfirm = () => {
    setConfirmModal(null)
    setConfirmStep(1)
    setConfirmInput('')
  }

  const handleConfirmYes = () => setConfirmStep(2)

  const handleConfirmSubmit = async () => {
    if (confirmInput.trim().toLowerCase() !== 'agree') return
    if (confirmModal?.onConfirm) await confirmModal.onConfirm()
    closeConfirm()
    await load()
  }

  /* ── Load data ── */
  const load = async () => {
    setLoadError('')
    let anyFailed = false
    const [rolesData, permissionsData, usersData, matrixData] = await Promise.all([
      fetchRoles().catch((e) => { anyFailed = true; reportError(e, { context: 'SAPermissions.fetchRoles', silent: true }); return [] }),
      fetchPermissions().catch((e) => { anyFailed = true; reportError(e, { context: 'SAPermissions.fetchPermissions', silent: true }); return [] }),
      fetchUsers().catch((e) => { anyFailed = true; reportError(e, { context: 'SAPermissions.fetchUsers', silent: true }); return [] }),
      fetchPermissionMatrix().catch((e) => { anyFailed = true; reportError(e, { context: 'SAPermissions.fetchMatrix', silent: true }); return { roles: [], permissions: [], matrix: [] } }),
    ])
    setRoles(rolesData || [])
    setPermissions(permissionsData || [])
    setUsers(usersData || [])
    setMatrix(matrixData || { roles: [], permissions: [], matrix: [] })
    if (!selectedRoleForMatrix && (rolesData || []).length) {
      setSelectedRoleForMatrix(rolesData[0].id)
      setSelectedRolePermissionIds(rolesData[0].permission_ids || [])
    }
    if (anyFailed) setLoadError('Some data could not be loaded. Check your connection and retry.')
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedUserId) return
    fetchUserRoles(selectedUserId)
      .then((payload) => setSelectedUserRoleIds((payload?.roles || []).map((r) => r.id)))
      .catch(() => setSelectedUserRoleIds([]))
  }, [selectedUserId])

  const filteredPermissions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return permissions
    return (permissions || []).filter((p) =>
      (p.code || '').toLowerCase().includes(q) || (p.entity || '').toLowerCase().includes(q),
    )
  }, [permissions, query])

  const totalPermPages = Math.max(1, Math.ceil(filteredPermissions.length / PERMS_PER_PAGE))
  const paginatedPerms = useMemo(() => {
    const start = (permPage - 1) * PERMS_PER_PAGE
    return filteredPermissions.slice(start, start + PERMS_PER_PAGE)
  }, [filteredPermissions, permPage])

  useEffect(() => { setPermPage(1) }, [query])

  /* ── Handlers ── */
  const createRoleHandler = async () => {
    setRoleFormError('')
    if (!newRoleName) { setRoleFormError('Pick a role name.'); return }
    setRoleBusy(true)
    try {
      await createRole({ name: newRoleName, description: newRoleDescription || null })
      setNewRoleDescription('')
      setShowCreateRole(false)
      await load()
    } catch (e) {
      setRoleFormError(e?.message || 'Failed to create role.')
      reportError(e, { context: 'SAPermissions.createRole', silent: true })
    } finally {
      setRoleBusy(false)
    }
  }

  const createPermissionHandler = async () => {
    setPermFormError('')
    if (!newPermEntity.trim()) { setPermFormError('Entity is required.'); return }
    if (!newPermAction.trim()) { setPermFormError('Pick an action.'); return }
    const code = newPermCode.trim() || `${newPermEntity.trim().toLowerCase()}.${newPermAction.trim()}`
    if (!/^[a-z_]+\.[a-z_]+$/.test(code)) {
      setPermFormError('Code must look like "entity.action" (lowercase, e.g. agreement.create).')
      return
    }
    setPermBusy(true)
    try {
      await createPermission({ code, entity: newPermEntity.trim(), action: newPermAction.trim(), description: newPermDescription.trim() || null })
      setNewPermCode(''); setNewPermEntity(''); setNewPermAction('read'); setNewPermDescription('')
      setShowCreatePerm(false)
      await load()
    } catch (e) {
      setPermFormError(e?.message?.includes('exists') ? `Permission code "${code}" already exists.` : (e?.message || 'Failed to create permission.'))
      reportError(e, { context: 'SAPermissions.createPermission', silent: true })
    } finally {
      setPermBusy(false)
    }
  }

  const createUserHandler = async () => {
    setUserFormError('')
    if (!createUserName.trim()) { setUserFormError('Full name is required.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(createUserEmail.trim())) { setUserFormError('Enter a valid email address.'); return }
    setUserBusy(true)
    try {
      await createUserAsSuperAdmin({
        name: createUserName.trim(), email: createUserEmail.trim(),
        active_role: createUserRole, roles: [createUserRole],
        status: createUserRole === 'provider' ? 'pending' : 'verified',
      })
      setCreateUserName(''); setCreateUserEmail('')
      setShowCreateUser(false)
      await load()
    } catch (e) {
      setUserFormError(e?.message?.includes('exists') ? 'A user with this email already exists.' : (e?.message || 'Failed to create user.'))
      reportError(e, { context: 'SAPermissions.createUser', silent: true })
    } finally {
      setUserBusy(false)
    }
  }

  const saveRolePermissions = async () => {
    if (!selectedRoleForMatrix) return
    setMatrixSaving(true)
    try {
      await updateRolePermissions(selectedRoleForMatrix, selectedRolePermissionIds)
      await load()
    } catch (e) {
      reportError(e, { context: 'SAPermissions.updateRolePermissions' })
    } finally {
      setMatrixSaving(false)
    }
  }

  const saveUserRoles = async () => {
    if (!selectedUserId) return
    setUserRolesSaving(true)
    try {
      await updateUserRoles(selectedUserId, selectedUserRoleIds)
      await load()
    } catch (e) {
      reportError(e, { context: 'SAPermissions.updateUserRoles' })
    } finally {
      setUserRolesSaving(false)
    }
  }

  /* ── Shared create form builders ──
   * NOTE: these are plain render functions called as {roleForm()} — NOT
   * components rendered as <RoleForm/>. Rendering them as elements would give
   * them a fresh identity on every keystroke and remount the inputs, dropping
   * focus mid-typing. Calling them inline keeps a stable element tree.
   */
  const roleForm = () => (
    <div className="sapm__create-form">
      <p className="sapm__create-subtitle">Define security boundaries for your organization.</p>
      <div className="sapm__field">
        <label className="sapm__label">ROLE NAME</label>
        <CustomSelect value={newRoleName} onChange={setNewRoleName} options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))} />
      </div>
      <div className="sapm__field">
        <label className="sapm__label">DESCRIPTION</label>
        <textarea className="sapm__input sapm__textarea" placeholder="Briefly describe the responsibilities..." value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} rows={3} />
      </div>
      {roleFormError && <div className="sapm__form-error"><span className="material-symbols-outlined">error</span>{roleFormError}</div>}
      <button className="sapm__submit-btn" onClick={createRoleHandler} disabled={roleBusy}>
        {roleBusy ? 'Creating…' : 'Create New Role'}
      </button>
      <div className="sapm__form-note">
        <span className="material-symbols-outlined">info</span>
        <span>Roles are the foundation of your permission structure. Changes made here will affect all associated users.</span>
      </div>
    </div>
  )

  const permForm = () => (
    <div className="sapm__create-form">
      <div className="sapm__field">
        <label className="sapm__label">CODE</label>
        <input className="sapm__input" placeholder="e.g., agreement.create" value={newPermCode} onChange={(e) => setNewPermCode(e.target.value)} />
      </div>
      <div className="sapm__field">
        <label className="sapm__label">ENTITY</label>
        <input className="sapm__input" placeholder="e.g. agreement" value={newPermEntity} onChange={(e) => setNewPermEntity(e.target.value)} />
      </div>
      <div className="sapm__field">
        <label className="sapm__label">ACTION</label>
        <div className="sapm__action-btns">
          {ACTION_BUTTONS.map((a) => (
            <button key={a} type="button" className={`sapm__action-chip ${newPermAction === a ? 'sapm__action-chip--active' : ''}`} onClick={() => setNewPermAction(a)}>{a.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <div className="sapm__field">
        <label className="sapm__label">DESCRIPTION</label>
        <textarea className="sapm__input sapm__textarea" placeholder="Define the scope of this permission..." value={newPermDescription} onChange={(e) => setNewPermDescription(e.target.value)} rows={3} />
      </div>
      {permFormError && <div className="sapm__form-error"><span className="material-symbols-outlined">error</span>{permFormError}</div>}
      <button className="sapm__submit-btn" onClick={createPermissionHandler} disabled={permBusy}>
        {permBusy ? 'Creating…' : 'Create New Permission →'}
      </button>
    </div>
  )

  const userForm = () => (
    <div className="sapm__create-form">
      <div className="sapm__field">
        <label className="sapm__label">FULL NAME</label>
        <input className="sapm__input" placeholder="e.g. Julianne Moore" value={createUserName} onChange={(e) => setCreateUserName(e.target.value)} />
      </div>
      <div className="sapm__field">
        <label className="sapm__label">WORK EMAIL</label>
        <input className="sapm__input" type="email" placeholder="j.moore@example.com" value={createUserEmail} onChange={(e) => setCreateUserEmail(e.target.value)} />
      </div>
      <div className="sapm__field">
        <label className="sapm__label">INITIAL ROLE</label>
        <CustomSelect value={createUserRole} onChange={setCreateUserRole} placeholder="Select a role..." options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))} />
      </div>
      {userFormError && <div className="sapm__form-error"><span className="material-symbols-outlined">error</span>{userFormError}</div>}
      <button className="sapm__submit-btn" onClick={createUserHandler} disabled={userBusy}>
        {userBusy ? 'Registering…' : 'Register User'}
      </button>
      <div className="sapm__form-note">
        <span className="material-symbols-outlined">info</span>
        <span>New users receive a temporary password to complete their profile setup.</span>
      </div>
    </div>
  )

  if (loading) {
    return (
      <SALayout activeKey="permissions" title="Roles & Permissions" subtitle="Access control management">
        <div className="sapm__loading">
          <span className="material-symbols-outlined sapm__spin">progress_activity</span>
          Loading roles & permissions…
        </div>
      </SALayout>
    )
  }

  return (
    <SALayout activeKey="permissions" title="Roles & Permissions" subtitle="Access control management">
      <div className="sapm">
        {loadError && (
          <div className="sapm__load-error">
            <span className="material-symbols-outlined">cloud_off</span>
            <span>{loadError}</span>
            <button className="sapm__retry-btn" onClick={() => { setLoading(true); load() }}>Retry</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="sapm__tabs">
          {TABS.map((tab) => (
            <button key={tab.key} className={`sapm__tab ${innerTab === tab.key ? 'sapm__tab--active' : ''}`} onClick={() => { setInnerTab(tab.key); setQuery('') }}>
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════ ROLES TAB ══════ */}
        {innerTab === 'roles' && (
          <>
            {/* Mobile create button */}
            <button className="sapm__mobile-create-btn" onClick={() => setShowCreateRole(true)}>
              <span className="material-symbols-outlined">add</span> Create New Role
            </button>
            <div className="sapm__split">
              {/* Left — Form (desktop) */}
              <div className="sapm__split-left">
                <div className="sapm__card">
                  <div className="sapm__card-header"><h3 className="sapm__card-title">Create / Update Role</h3></div>
                  <div className="sapm__card-body">{roleForm()}</div>
                </div>
              </div>
              {/* Right — Active Roles */}
              <div className="sapm__split-right">
                <div className="sapm__card">
                  <div className="sapm__card-header">
                    <div>
                      <h3 className="sapm__card-title">Active Roles</h3>
                      <p className="sapm__card-sub">Currently managing {roles.length} primary entities</p>
                    </div>
                    <div className="sapm__header-actions">
                      <button className="sapm__icon-btn" title="Filter"><span className="material-symbols-outlined">tune</span></button>
                      <button className="sapm__icon-btn" title="Sort"><span className="material-symbols-outlined">sort</span></button>
                    </div>
                  </div>
                  <div className="sapm__card-body sapm__card-body--flush">
                    {(roles || []).map((role) => {
                      const isBuiltin = BUILTIN_ROLES.has(String(role.name).toLowerCase())
                      return (
                      <div key={role.id} className="sapm__role-row">
                        <div className="sapm__role-icon-wrap">
                          <span className="material-symbols-outlined">{ROLE_ICONS[role.name] || 'shield'}</span>
                        </div>
                        <div className="sapm__role-info">
                          <p className="sapm__role-name">
                            {role.name}
                            {isBuiltin && <span className="sapm__builtin-tag">Built-in</span>}
                          </p>
                          <p className="sapm__role-desc">{role.description || 'No description provided.'}</p>
                        </div>
                        <div className="sapm__row-actions">
                          <button className="sapm__icon-btn" title="Edit" onClick={() => { setNewRoleName(role.name); setNewRoleDescription(role.description || ''); setRoleFormError(''); setShowCreateRole(true) }}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="sapm__icon-btn sapm__icon-btn--danger"
                            title={isBuiltin ? 'Built-in roles cannot be deleted' : 'Delete'}
                            disabled={isBuiltin}
                            onClick={() => openConfirm('Delete Role', `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`, () => deleteRole(role.id))}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                      )
                    })}
                    {roles.length === 0 && <div className="sapm__empty">No roles defined yet.</div>}
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile slide-in panel */}
            {showCreateRole && (
              <div className="sapm__overlay" onClick={() => setShowCreateRole(false)}>
                <div className="sapm__drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="sapm__drawer-header">
                    <h3>Create / Update Role</h3>
                    <button className="sapm__icon-btn" onClick={() => setShowCreateRole(false)}><span className="material-symbols-outlined">close</span></button>
                  </div>
                  {roleForm()}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════ PERMISSIONS TAB ══════ */}
        {innerTab === 'permissions' && (
          <>
            <button className="sapm__mobile-create-btn" onClick={() => setShowCreatePerm(true)}>
              <span className="material-symbols-outlined">add</span> Create Permission
            </button>
            <div className="sapm__split">
              <div className="sapm__split-left">
                <div className="sapm__card">
                  <div className="sapm__card-header">
                    <h3 className="sapm__card-title"><span className="material-symbols-outlined">key</span> Create Permission</h3>
                  </div>
                  <div className="sapm__card-body">{permForm()}</div>
                </div>
              </div>
              <div className="sapm__split-right">
                <div className="sapm__card">
                  <div className="sapm__card-header">
                    <div className="sapm__search-wrap sapm__search-wrap--header">
                      <span className="material-symbols-outlined sapm__search-icon">search</span>
                      <input className="sapm__search" placeholder="Filter permissions by code or entity..." value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                  </div>
                  <div className="sapm__card-body sapm__card-body--flush">
                    {paginatedPerms.map((perm) => (
                      <div key={perm.id} className="sapm__perm-row">
                        <div className="sapm__perm-icon-wrap">
                          <span className="material-symbols-outlined">lock</span>
                        </div>
                        <div className="sapm__perm-info">
                          <div className="sapm__perm-title-row">
                            <span className="sapm__perm-code">{perm.code}</span>
                            <span className="sapm__entity-badge">{(perm.entity || '').toUpperCase()}</span>
                          </div>
                          <p className="sapm__perm-desc">{perm.description || `${perm.action} access for ${perm.entity}`}</p>
                        </div>
                        <div className="sapm__row-actions">
                          <button className="sapm__icon-btn" title="Edit" onClick={() => { setNewPermCode(perm.code || ''); setNewPermEntity(perm.entity || ''); setNewPermAction(perm.action || 'read'); setNewPermDescription(perm.description || ''); setShowCreatePerm(true) }}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="sapm__icon-btn sapm__icon-btn--danger" title="Delete" onClick={() => openConfirm('Delete Permission', `Are you sure you want to delete "${perm.code}"? This action cannot be undone.`, () => deletePermission(perm.id))}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredPermissions.length === 0 && <div className="sapm__empty">No permissions found.</div>}
                  </div>
                  <div className="sapm__list-footer">
                    <span>SHOWING {Math.min(permPage * PERMS_PER_PAGE, filteredPermissions.length)} OF {filteredPermissions.length} PERMISSIONS</span>
                    <div className="sapm__pagination">
                      <button className="sapm__page-btn" disabled={permPage <= 1} onClick={() => setPermPage((p) => p - 1)}>
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      {Array.from({ length: totalPermPages }, (_, i) => i + 1).map((pg) => (
                        <button key={pg} className={`sapm__page-num ${pg === permPage ? 'sapm__page-num--active' : ''}`} onClick={() => setPermPage(pg)}>{pg}</button>
                      ))}
                      <button className="sapm__page-btn" disabled={permPage >= totalPermPages} onClick={() => setPermPage((p) => p + 1)}>
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {showCreatePerm && (
              <div className="sapm__overlay" onClick={() => setShowCreatePerm(false)}>
                <div className="sapm__drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="sapm__drawer-header">
                    <h3>Create Permission</h3>
                    <button className="sapm__icon-btn" onClick={() => setShowCreatePerm(false)}><span className="material-symbols-outlined">close</span></button>
                  </div>
                  {permForm()}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════ USERS TAB ══════ */}
        {innerTab === 'users' && (
          <>
            <button className="sapm__mobile-create-btn" onClick={() => setShowCreateUser(true)}>
              <span className="material-symbols-outlined">person_add</span> Create User
            </button>
            <div className="sapm__split">
              <div className="sapm__split-left">
                <div className="sapm__card">
                  <div className="sapm__card-header">
                    <h3 className="sapm__card-title"><span className="material-symbols-outlined">person_add</span> Create User</h3>
                  </div>
                  <div className="sapm__card-body">{userForm()}</div>
                </div>
              </div>
              <div className="sapm__split-right">
                <div className="sapm__card">
                  <div className="sapm__card-header">
                    <div>
                      <h3 className="sapm__card-title">Assign User Roles</h3>
                      <p className="sapm__card-sub">Manage cross-functional access for existing users.</p>
                    </div>
                  </div>
                  <div className="sapm__card-body">
                    <div className="sapm__field">
                      <label className="sapm__label">TARGET USER</label>
                      <CustomSelect value={selectedUserId} onChange={setSelectedUserId} placeholder="— Choose a user —" options={(users || []).map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))} />
                    </div>
                    {selectedUserId && (
                      <>
                        <div className="sapm__role-grid">
                          {(roles || []).map((role) => {
                            const checked = selectedUserRoleIds.includes(role.id)
                            return (
                              <label key={role.id} className={`sapm__role-card ${checked ? 'sapm__role-card--active' : ''}`}>
                                <input type="checkbox" checked={checked} onChange={(e) => { setSelectedUserRoleIds((prev) => e.target.checked ? [...prev, role.id] : prev.filter((id) => id !== role.id)) }} className="sapm__role-card-check" />
                                <div className="sapm__role-card-body">
                                  <p className="sapm__role-card-name">{role.name}</p>
                                  <p className="sapm__role-card-desc">{role.description || 'No description'}</p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                        <div className="sapm__assign-actions">
                          <button className="sapm__btn-outline" onClick={() => setSelectedUserRoleIds([])}>Reset Selection</button>
                          <button className="sapm__submit-btn" onClick={saveUserRoles} disabled={userRolesSaving}>
                            {userRolesSaving ? 'Saving…' : 'Save User Roles'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {showCreateUser && (
              <div className="sapm__overlay" onClick={() => setShowCreateUser(false)}>
                <div className="sapm__drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="sapm__drawer-header">
                    <h3>Create User</h3>
                    <button className="sapm__icon-btn" onClick={() => setShowCreateUser(false)}><span className="material-symbols-outlined">close</span></button>
                  </div>
                  {userForm()}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════ MATRIX TAB ══════ */}
        {innerTab === 'matrix' && (
          <div className="sapm__matrix-wrap">
            {/* Overview table — at top */}
            <div className="sapm__card">
              <div className="sapm__card-header">
                <h3 className="sapm__card-title">Matrix Overview</h3>
              </div>
              <div className="sapm__card-body sapm__card-body--flush">
                <div className="sapm__table-wrap">
                  <table className="sapm__table">
                    <thead><tr><th>Role</th><th>Permissions Enabled</th><th>Coverage</th></tr></thead>
                    <tbody>
                      {(matrix.matrix || []).map((row) => {
                        const cnt = Object.values(row.permissions || {}).filter(Boolean).length
                        const pct = permissions.length ? Math.round((cnt / permissions.length) * 100) : 0
                        return (
                          <tr key={row.role_id}>
                            <td className="sapm__table-role">{row.role_name}</td>
                            <td><span className="sapm__table-count">{cnt}</span></td>
                            <td>
                              <div className="sapm__coverage-bar">
                                <div className="sapm__coverage-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="sapm__coverage-pct">{pct}%</span>
                            </td>
                          </tr>
                        )
                      })}
                      {(matrix.matrix || []).length === 0 && (
                        <tr><td colSpan={3} className="sapm__empty">No matrix data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="sapm__matrix-toolbar">
              <div className="sapm__field sapm__field--grow">
                <label className="sapm__label">SELECT ROLE</label>
                <CustomSelect value={selectedRoleForMatrix || ''} onChange={(val) => {
                  const roleId = Number(val)
                  setSelectedRoleForMatrix(roleId)
                  const found = (roles || []).find((role) => role.id === roleId)
                  setSelectedRolePermissionIds(found?.permission_ids || [])
                }} options={(roles || []).map((role) => ({ value: role.id, label: role.name }))} />
              </div>
              <button className="sapm__matrix-save-btn" onClick={saveRolePermissions} disabled={matrixSaving}>
                <span className="material-symbols-outlined">save</span> {matrixSaving ? 'Saving…' : 'Update Matrix'}
              </button>
            </div>

            {/* Permission toggle grid */}
            <div className="sapm__card">
              <div className="sapm__card-header">
                <h3 className="sapm__card-title">Permission Assignments</h3>
                <span className="sapm__badge">{selectedRolePermissionIds.length} / {permissions.length}</span>
              </div>
              <div className="sapm__card-body">
                <div className="sapm__perm-toggle-grid">
                  {(permissions || []).map((perm) => {
                    const checked = selectedRolePermissionIds.includes(perm.id)
                    return (
                      <label key={perm.id} className={`sapm__perm-toggle ${checked ? 'sapm__perm-toggle--on' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={(e) => { setSelectedRolePermissionIds((prev) => e.target.checked ? [...prev, perm.id] : prev.filter((id) => id !== perm.id)) }} />
                        <div className="sapm__perm-toggle-info">
                          <span className="sapm__perm-toggle-code">{perm.code}</span>
                          <span className="sapm__perm-toggle-entity">{perm.entity}</span>
                        </div>
                        <span className={`sapm__perm-toggle-dot ${checked ? 'sapm__perm-toggle-dot--on' : ''}`} />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ══════ CONFIRM MODAL ══════ */}
        {confirmModal && (
          <div className="sapm__confirm-overlay" onClick={closeConfirm}>
            <div className="sapm__confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sapm__confirm-icon-wrap">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="sapm__confirm-title">{confirmModal.title}</h3>
              <p className="sapm__confirm-message">{confirmModal.message}</p>

              {confirmStep === 1 && (
                <div className="sapm__confirm-actions">
                  <button className="sapm__confirm-btn sapm__confirm-btn--cancel" onClick={closeConfirm}>No, Cancel</button>
                  <button className="sapm__confirm-btn sapm__confirm-btn--danger" onClick={handleConfirmYes}>Yes, Proceed</button>
                </div>
              )}

              {confirmStep === 2 && (
                <div className="sapm__confirm-step2">
                  <p className="sapm__confirm-instruction">Type <strong>agree</strong> below to confirm this action.</p>
                  <input className="sapm__input sapm__confirm-input" placeholder='Type "agree" to confirm' value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} autoFocus />
                  <div className="sapm__confirm-actions">
                    <button className="sapm__confirm-btn sapm__confirm-btn--cancel" onClick={closeConfirm}>Cancel</button>
                    <button className="sapm__confirm-btn sapm__confirm-btn--danger" disabled={confirmInput.trim().toLowerCase() !== 'agree'} onClick={handleConfirmSubmit}>Confirm</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SALayout>
  )
}
