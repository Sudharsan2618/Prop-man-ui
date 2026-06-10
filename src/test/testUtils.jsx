import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * renderWithProviders — Mount a component under Router + QueryClient.
 *
 * Use `mockRbac` to inject a fake permission set for PermissionGate tests
 * without spinning up RbacProvider (which would hit the network for permissions).
 */
export function renderWithProviders(ui, { route = '/', queryClient } = {}) {
  window.history.pushState({}, '', route)
  const qc = queryClient || new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  )
}
