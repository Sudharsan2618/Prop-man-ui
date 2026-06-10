/**
 * hooks.js — TanStack Query hooks over the api/ modules.
 *
 * Naming convention:
 *   - useXxx()        → query (read)
 *   - useXxxMutation() → mutation (write/update/delete) with invalidation
 *
 * Pages should prefer these hooks over the bare fetch* functions. The bare
 * functions remain available for one-shot needs (e.g. fetching inside a
 * non-React util) but the query hooks give automatic caching, dedup,
 * background refetch and devtools.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryClient'
import * as users from './users'
import * as properties from './properties'
import * as payments from './payments'
import * as jobs from './jobs'
import * as agreements from './agreements'
import * as workflows from './workflows'
import * as visits from './visits'
import * as inspections from './inspections'
import * as notifications from './notifications'
import * as rbac from './rbac'
import * as dashboards from './dashboards'
import * as auth from './auth'

/* ─── Auth ─── */
export const useMe = (opts = {}) =>
  useQuery({ queryKey: qk.auth.me(), queryFn: auth.fetchMe, ...opts })

/* ─── Users ─── */
export const useUsers = (params = {}, opts = {}) =>
  useQuery({ queryKey: qk.users.list(params), queryFn: () => users.fetchUsers(params), ...opts })

export const useUser = (id, opts = {}) =>
  useQuery({ queryKey: qk.users.byId(id), queryFn: () => users.fetchUserById(id), enabled: !!id, ...opts })

export const useUserManagedSummary = (id, opts = {}) =>
  useQuery({ queryKey: qk.users.managedSummary(id), queryFn: () => users.fetchUserManagedSummary(id), enabled: !!id, ...opts })

export const useUsersByRole = (role, search = '', opts = {}) =>
  useQuery({ queryKey: qk.users.byRole(role, search), queryFn: () => users.fetchUsersByRole(role, search), enabled: !!role, ...opts })

export function useInviteOwner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: users.inviteOwner,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users.all() }),
  })
}

export function useCreateUserAsSuperAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: users.createUserAsSuperAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all() })
      qc.invalidateQueries({ queryKey: qk.dashboards.superAdmin() })
    },
  })
}

/* ─── Properties ─── */
export const useProperties = (filters = {}, opts = {}) =>
  useQuery({ queryKey: qk.properties.list(filters), queryFn: () => properties.fetchProperties(filters), ...opts })

export const useProperty = (id, opts = {}) =>
  useQuery({ queryKey: qk.properties.byId(id), queryFn: () => properties.fetchPropertyById(id), enabled: !!id, ...opts })

export const useMyOwnerProperties = (opts = {}) =>
  useQuery({ queryKey: qk.properties.byOwner(), queryFn: properties.fetchPropertiesByOwner, ...opts })

export const useMyTenantProperties = (opts = {}) =>
  useQuery({ queryKey: qk.properties.byTenant(), queryFn: properties.fetchPropertiesByTenant, ...opts })

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: properties.createProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.properties.all() })
      qc.invalidateQueries({ queryKey: qk.dashboards.owner() })
    },
  })
}

export function useAssignPropertyManagers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ propertyId, managerIds, role }) => properties.assignPropertyManagers(propertyId, managerIds, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.properties.all() }),
  })
}

/* ─── Payments ─── */
export const usePayments = (filters = {}, opts = {}) =>
  useQuery({ queryKey: qk.payments.list(filters), queryFn: () => payments.fetchPayments(filters), ...opts })

export const usePayment = (id, opts = {}) =>
  useQuery({ queryKey: qk.payments.byId(id), queryFn: () => payments.fetchPaymentById(id), enabled: !!id, ...opts })

export const useOwnerEarnings = (opts = {}) =>
  useQuery({ queryKey: qk.payments.ownerEarnings(), queryFn: payments.fetchOwnerEarnings, ...opts })

export const usePendingVerifications = (params = {}, opts = {}) =>
  useQuery({ queryKey: qk.payments.pendingVerifications(params), queryFn: () => payments.fetchPendingVerifications(params), ...opts })

export function useVerifyPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, ...rest }) => payments.verifyPayment(paymentId, rest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.payments.all() })
      qc.invalidateQueries({ queryKey: qk.dashboards.admin() })
    },
  })
}

export function useGenerateMonthlyRent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payments.generateMonthlyRent,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.payments.all() }),
  })
}

/* ─── Jobs ─── */
export const useJobs = (filters = {}, opts = {}) =>
  useQuery({ queryKey: qk.jobs.list(filters), queryFn: () => jobs.fetchJobs(filters), ...opts })

export const useJob = (id, opts = {}) =>
  useQuery({ queryKey: qk.jobs.byId(id), queryFn: () => jobs.fetchJobById(id), enabled: !!id, ...opts })

export const useServiceCategories = (opts = {}) =>
  useQuery({ queryKey: qk.jobs.categories(), queryFn: jobs.fetchServiceCategories, staleTime: 10 * 60_000, ...opts })

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobs.createJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.jobs.all() }),
  })
}

/* ─── Agreements ─── */
export const useAgreement = (id, opts = {}) =>
  useQuery({ queryKey: qk.agreements.byId(id), queryFn: () => agreements.fetchAgreementById(id), enabled: !!id, ...opts })

export const useAgreements = (params = {}, opts = {}) =>
  useQuery({ queryKey: qk.agreements.list(params), queryFn: () => agreements.fetchAgreements(params), ...opts })

export function useSignAgreement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agreementId, signature }) => agreements.signAgreement(agreementId, signature),
    onSuccess: (_, { agreementId }) => {
      qc.invalidateQueries({ queryKey: qk.agreements.byId(agreementId) })
      qc.invalidateQueries({ queryKey: qk.workflows.all() })
    },
  })
}

/* ─── Workflows ─── */
export const useOnboardingWorkflows = (params = {}, opts = {}) =>
  useQuery({ queryKey: qk.workflows.list(params), queryFn: () => workflows.fetchOnboardingWorkflows(params), ...opts })

/* ─── Visits ─── */
export const useCalendarSlots = (params = {}, opts = {}) =>
  useQuery({ queryKey: qk.visits.slots(params), queryFn: () => visits.fetchCalendarSlots(params), ...opts })

export const useMyVisits = (opts = {}) =>
  useQuery({ queryKey: qk.visits.mine(), queryFn: visits.fetchMyVisits, ...opts })

/* ─── Inspections ─── */
export const useInspections = (opts = {}) =>
  useQuery({ queryKey: qk.inspections.list(), queryFn: inspections.fetchInspections, ...opts })

export const useInspection = (id, opts = {}) =>
  useQuery({ queryKey: qk.inspections.byId(id), queryFn: () => inspections.fetchInspectionById(id), enabled: !!id, ...opts })

/* ─── Notifications ─── */
export const useNotifications = (opts = {}) =>
  useQuery({ queryKey: qk.notifications.list(), queryFn: notifications.fetchNotifications, ...opts })

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notifications.markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.list() }),
  })
}

/* ─── RBAC ─── */
export const useRoles = (opts = {}) =>
  useQuery({ queryKey: qk.rbac.roles(), queryFn: rbac.fetchRoles, ...opts })

export const usePermissionsList = (opts = {}) =>
  useQuery({ queryKey: qk.rbac.permissions(), queryFn: rbac.fetchPermissions, ...opts })

export const usePermissionMatrix = (opts = {}) =>
  useQuery({ queryKey: qk.rbac.matrix(), queryFn: rbac.fetchPermissionMatrix, ...opts })

export const useUserRoles = (userId, opts = {}) =>
  useQuery({ queryKey: qk.rbac.userRoles(userId), queryFn: () => rbac.fetchUserRoles(userId), enabled: !!userId, ...opts })

export function useUpdateUserRoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleIds }) => rbac.updateUserRoles(userId, roleIds),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: qk.rbac.userRoles(userId) })
      qc.invalidateQueries({ queryKey: qk.rbac.matrix() })
      qc.invalidateQueries({ queryKey: qk.users.all() })
    },
  })
}

/* ─── Dashboards ─── */
export const useOwnerDashboard = (opts = {}) =>
  useQuery({ queryKey: qk.dashboards.owner(), queryFn: dashboards.fetchOwnerDashboard, staleTime: 2 * 60_000, ...opts })

export const useAdminDashboard = (opts = {}) =>
  useQuery({ queryKey: qk.dashboards.admin(), queryFn: dashboards.fetchAdminDashboard, staleTime: 3 * 60_000, ...opts })

export const useSuperAdminDashboard = (opts = {}) =>
  useQuery({ queryKey: qk.dashboards.superAdmin(), queryFn: dashboards.fetchSuperAdminDashboard, staleTime: 2 * 60_000, ...opts })

export const useProviderDashboard = (opts = {}) =>
  useQuery({ queryKey: qk.dashboards.provider(), queryFn: dashboards.fetchProviderDashboard, staleTime: 2 * 60_000, ...opts })

export const useProviderStats = (opts = {}) =>
  useQuery({ queryKey: qk.dashboards.providerStats(), queryFn: dashboards.fetchProviderStats, staleTime: 2 * 60_000, ...opts })
