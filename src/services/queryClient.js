import { QueryClient } from '@tanstack/react-query'

/**
 * Shared QueryClient — mounted at the root of AppRouter via
 * <QueryClientProvider client={queryClient}>.
 *
 * Defaults:
 *  - staleTime 60s          fresh window before background refetch
 *  - gcTime    5min         keep unused data in memory
 *  - retry     2            transient network errors are retried twice
 *  - refetchOnWindowFocus  enabled in prod, disabled in dev (less noise)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: !import.meta.env.DEV,
    },
    mutations: {
      retry: 0,
    },
  },
})

/**
 * Centralized query keys.
 *
 * Each domain owns a function that returns a stable key. This avoids
 * stringly-typed keys scattered across pages and makes invalidation
 * targeted (e.g. queryClient.invalidateQueries({ queryKey: qk.properties.all() }))
 */
export const qk = {
  auth: {
    me: () => ['auth', 'me'],
  },
  users: {
    all: () => ['users'],
    list: (params = {}) => ['users', 'list', params],
    byId: (id) => ['users', 'byId', id],
    managedSummary: (id) => ['users', 'managedSummary', id],
    byRole: (role, search) => ['users', 'byRole', role, search],
  },
  properties: {
    all: () => ['properties'],
    list: (filters = {}) => ['properties', 'list', filters],
    byId: (id) => ['properties', 'byId', id],
    byOwner: () => ['properties', 'byOwner', 'me'],
    byTenant: () => ['properties', 'byTenant', 'me'],
    details: (id) => ['properties', 'details', id],
    occupancyHistory: (id) => ['properties', 'occupancyHistory', id],
  },
  payments: {
    all: () => ['payments'],
    list: (filters = {}) => ['payments', 'list', filters],
    byId: (id) => ['payments', 'byId', id],
    ownerEarnings: () => ['payments', 'ownerEarnings'],
    pendingVerifications: (params = {}) => ['payments', 'pendingVerifications', params],
  },
  jobs: {
    all: () => ['jobs'],
    list: (filters = {}) => ['jobs', 'list', filters],
    byId: (id) => ['jobs', 'byId', id],
    categories: () => ['jobs', 'categories'],
  },
  agreements: {
    all: () => ['agreements'],
    list: (params = {}) => ['agreements', 'list', params],
    byId: (id) => ['agreements', 'byId', id],
  },
  workflows: {
    all: () => ['workflows'],
    list: (params = {}) => ['workflows', 'list', params],
  },
  visits: {
    slots: (params = {}) => ['visits', 'slots', params],
    blocks: (params = {}) => ['visits', 'blocks', params],
    mine: () => ['visits', 'mine'],
  },
  inspections: {
    list: () => ['inspections', 'list'],
    byId: (id) => ['inspections', 'byId', id],
    stats: () => ['inspections', 'stats'],
  },
  notifications: {
    list: () => ['notifications', 'list'],
  },
  rbac: {
    roles: () => ['rbac', 'roles'],
    permissions: () => ['rbac', 'permissions'],
    matrix: () => ['rbac', 'matrix'],
    userRoles: (userId) => ['rbac', 'userRoles', userId],
  },
  dashboards: {
    owner: () => ['dashboards', 'owner'],
    admin: () => ['dashboards', 'admin'],
    superAdmin: () => ['dashboards', 'superAdmin'],
    provider: () => ['dashboards', 'provider'],
    providerStats: () => ['dashboards', 'providerStats'],
  },
}
