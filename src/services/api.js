/**
 * services/api — Back-compat re-export.
 *
 * The real implementation now lives in `services/api/`, split into focused
 * domain modules (auth, users, properties, payments, dashboards, rbac, jobs,
 * agreements, workflows, visits, inspections, notifications, uploads). This
 * file exists solely so existing `import { … } from '../../services/api'`
 * keeps working. New code should import from the per-domain files directly,
 * e.g. `from '../../services/api/payments'`.
 *
 * See services/api/index.js for the full export catalog.
 */

export * from './api/index'
