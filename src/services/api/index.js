/**
 * services/api — Re-exports for the split API layer.
 *
 * Domain modules:
 *   client.js         — HTTP wrapper, tokens, cache primitives
 *   auth.js           — login/logout/signup/me/refresh
 *   users.js          — user CRUD, invitations, role-filtered lookups
 *   properties.js     — property CRUD, manager/tenant assignment, normalizer
 *   payments.js       — payment lifecycle (read/verify/upload/generate)
 *   dashboards.js     — role-specific aggregated dashboards
 *   rbac.js           — roles, permissions, matrix, user-role assignment
 *   jobs.js           — jobs + service categories + service icon map
 *   agreements.js     — agreement lifecycle (sign, verify, confirm-advance)
 *   workflows.js      — onboarding workflows (police/original-agreement review)
 *   visits.js         — calendar slots, blocks, visit completion
 *   inspections.js    — inspection list/detail/stats
 *   notifications.js  — notifications list + mark-read
 *   uploads.js        — image/document multipart upload
 *
 * Existing imports of `from '../../services/api'` keep working — the old
 * services/api.js is now a thin re-export of this index.
 */

export * from './client'
export * from './auth'
export * from './users'
export * from './properties'
export * from './payments'
export * from './dashboards'
export * from './rbac'
export * from './jobs'
export * from './agreements'
export * from './workflows'
export * from './visits'
export * from './inspections'
export * from './notifications'
export * from './uploads'

/* React Query hooks — preferred for components. */
export * from './hooks'
