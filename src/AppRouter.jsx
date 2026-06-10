import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './services/queryClient'
import { RoleProvider, useRole } from './context/RoleContext'
import { ErrorBoundary, ToastProvider, OfflineBanner, GlobalErrorBanner, RequirePermission } from './components'

/**
 * Route components are lazy-loaded to enable per-route code-splitting.
 * Without this, the entire 40+-screen surface ships in the initial JS chunk.
 */

/* ── Auth pages (kept eager — small + always reachable first) ── */
import WelcomeScreen from './pages/auth/WelcomeScreen'
import LoginScreen from './pages/auth/LoginScreen'
import SignupScreen from './pages/auth/SignupScreen'
import RoleSelectionHub from './pages/auth/RoleSelectionHub'
import FirstLoginPasswordReset from './pages/auth/FirstLoginPasswordReset'

/* ── Common / always-needed (small footprint, kept eager) ── */
import ForbiddenScreen from './pages/common/ForbiddenScreen'

/* ── Tenant ── */
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard'))
const PropertyDiscovery = lazy(() => import('./pages/tenant/PropertyDiscovery'))
const PropertyDetails = lazy(() => import('./pages/tenant/PropertyDetails'))
const SecurePayment = lazy(() => import('./pages/tenant/SecurePayment'))
const DigitalAgreement = lazy(() => import('./pages/tenant/DigitalAgreement'))
const BookingConfirmed = lazy(() => import('./pages/tenant/BookingConfirmed'))
const ServiceMarketplace = lazy(() => import('./pages/tenant/ServiceMarketplace'))
const BookSlot = lazy(() => import('./pages/tenant/BookSlot'))
const TenantPayments = lazy(() => import('./pages/tenant/TenantPayments'))
const BookVisit = lazy(() => import('./pages/tenant/BookVisit'))

/* ── Provider ── */
const MyServiceJobs = lazy(() => import('./pages/provider/MyServiceJobs'))
const ProviderDashboard = lazy(() => import('./pages/provider/ProviderDashboard'))
const WorkCompletionReport = lazy(() => import('./pages/provider/WorkCompletionReport'))
const PayoutLedger = lazy(() => import('./pages/provider/PayoutLedger'))

/* ── Owner ── */
const OwnerPortfolio = lazy(() => import('./pages/owner/OwnerPortfolio'))
const ListNewProperty = lazy(() => import('./pages/owner/ListNewProperty'))
const MaintenanceLog = lazy(() => import('./pages/owner/MaintenanceLog'))
const InvoiceApproval = lazy(() => import('./pages/owner/InvoiceApproval'))
const PortfolioHub = lazy(() => import('./pages/owner/PortfolioHub'))
const EarningsAnalytics = lazy(() => import('./pages/owner/EarningsAnalytics'))
const TaxTds = lazy(() => import('./pages/owner/TaxTds'))

/* ── Inspection ── */
const InspectionHub = lazy(() => import('./pages/inspection/InspectionHub'))
const InspectionChecklist = lazy(() => import('./pages/inspection/InspectionChecklist'))
const HandoverSummary = lazy(() => import('./pages/inspection/HandoverSummary'))

/* ── Common ── */
const UserProfile = lazy(() => import('./pages/common/UserProfile'))
const NotificationCenter = lazy(() => import('./pages/common/NotificationCenter'))
const MessagingInbox = lazy(() => import('./pages/common/MessagingInbox'))
const RealtimeChat = lazy(() => import('./pages/common/RealtimeChat'))
const KycVerification = lazy(() => import('./pages/common/KycVerification'))
const BankAccounts = lazy(() => import('./pages/common/BankAccounts'))
const DisputeResolution = lazy(() => import('./pages/common/DisputeResolution'))
const SettlementProposal = lazy(() => import('./pages/common/SettlementProposal'))
const NotificationPreferences = lazy(() => import('./pages/common/NotificationPreferences'))

/* ── Manager (formerly admin) ── */
const ManagerFinancial = lazy(() => import('./pages/manager/ManagerFinancial'))
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'))
const ManagerProperties = lazy(() => import('./pages/manager/ManagerProperties'))
const ManagerUserMgmt = lazy(() => import('./pages/manager/ManagerUserMgmt'))
const KycReview = lazy(() => import('./pages/manager/KycReview'))
const ManagerCalendar = lazy(() => import('./pages/manager/ManagerCalendar'))
const ManagerPaymentReview = lazy(() => import('./pages/manager/ManagerPaymentReview'))
const ManagerOnboarding = lazy(() => import('./pages/manager/ManagerOnboarding'))
const ManagerOnboardingDetail = lazy(() => import('./pages/manager/ManagerOnboardingDetail'))
const ManagerVisits = lazy(() => import('./pages/manager/ManagerVisits'))

/* ── Dev sandbox (DEV-only route) ── */
const ComponentSandbox = lazy(() => import('./pages/dev/ComponentSandbox'))

/* ── Super Admin ── */
const SAHome = lazy(() => import('./pages/super-admin/SAHome'))
const SAUsers = lazy(() => import('./pages/super-admin/SAUsers'))
const SAProperties = lazy(() => import('./pages/super-admin/SAProperties'))
const SAPermissions = lazy(() => import('./pages/super-admin/SAPermissions'))
const SAPropertyWizard = lazy(() => import('./pages/super-admin/SAPropertyWizard'))
const SAUserProfile = lazy(() => import('./pages/super-admin/SAUserProfile'))
const SAOnboarding = lazy(() => import('./pages/super-admin/SAOnboarding'))
const SAOnboardingDetail = lazy(() => import('./pages/super-admin/SAOnboardingDetail'))
const SAVisits = lazy(() => import('./pages/super-admin/SAVisits'))

/**
 * AuthGuard — redirects unauthenticated users to /welcome.
 * Shows nothing while auth is loading (prevents flash).
 */
function AuthGuard() {
  const { isAuthenticated, loading, requiresPasswordReset } = useRole()
  const location = useLocation()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/welcome" replace />
  if (requiresPasswordReset && location.pathname !== '/first-login-password') {
    return <Navigate to="/first-login-password" replace />
  }
  if (!requiresPasswordReset && location.pathname === '/first-login-password') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

/**
 * GuestGuard — redirects authenticated users away from auth pages.
 */
function GuestGuard() {
  const { isAuthenticated, loading } = useRole()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

/**
 * RouteFallback — Shown by <Suspense> while a lazy-loaded route chunk is fetching.
 * Kept minimal to avoid layout shift; the lazy chunk's own page chrome then renders.
 */
function RouteFallback() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-tertiary)', fontSize: 'var(--fs-caption)',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: 8 }}>
        progress_activity
      </span>
      Loading…
    </div>
  )
}

/**
 * Placeholder page.
 */
function Placeholder({ title }) {
  return (
    <div style={{
      maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-dark)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>construction</span>
      <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{title || 'Coming Soon'}</h2>
      <p style={{ fontSize: 'var(--fs-body)' }}>This screen will be built in a future phase.</p>
    </div>
  )
}

/**
 * Role-aware home — renders correct dashboard per active role.
 */
function RoleHome() {
  const { role } = useRole()
  switch (role) {
    case 'owner': return <OwnerPortfolio />
    case 'provider': return <ProviderDashboard />
    case 'manager': return <ManagerDashboard />
    case 'super_admin': return <SAHome />
    default: return <TenantDashboard />
  }
}

export default function AppRouter() {
  return (
    <ErrorBoundary context="AppRouter">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RoleProvider defaultRole="tenant">
            <ToastProvider>
              <OfflineBanner />
              <GlobalErrorBanner />
              <Suspense fallback={<RouteFallback />}>
                <AppRoutes />
              </Suspense>
            </ToastProvider>
          </RoleProvider>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

function AppRoutes() {
  return (
    <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
          </Route>

          {/* Role Selection — accessible before and after login */}
          <Route path="/select-role" element={<RoleSelectionHub />} />

          <Route element={<AuthGuard />}>
            {/* Role-aware Home */}
            <Route path="/" element={<RoleHome />} />
            <Route path="/first-login-password" element={<FirstLoginPasswordReset />} />

            {/* Tenant */}
            <Route path="/browse" element={<PropertyDiscovery />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/pay" element={<SecurePayment />} />
            <Route path="/agreement/:id" element={<DigitalAgreement />} />
            <Route path="/booking-confirmed" element={<BookingConfirmed />} />
            <Route path="/services" element={<ServiceMarketplace />} />
            <Route path="/book-service/:serviceKey" element={<BookSlot />} />
            <Route path="/properties" element={<Placeholder title="My Properties" />} />
            <Route path="/payments" element={<TenantPayments />} />

            {/* Owner — gated on owner.read or property.read (owner sees own scope). */}
            <Route element={<RequirePermission anyOf={['property.read', 'owner.read']} />}>
              <Route path="/owner-dashboard" element={<OwnerPortfolio />} />
              <Route path="/portfolio-hub" element={<PortfolioHub />} />
              <Route path="/earnings-analytics" element={<EarningsAnalytics />} />
              <Route path="/tax-tds" element={<TaxTds />} />
              <Route path="/maintenance-log" element={<MaintenanceLog />} />
            </Route>
            <Route element={<RequirePermission code="property.create" />}>
              <Route path="/list-property" element={<ListNewProperty />} />
            </Route>
            <Route element={<RequirePermission code="payment.update" />}>
              <Route path="/invoice-approval/:jobId" element={<InvoiceApproval />} />
            </Route>

            {/* Provider — gated on job.read (assigned scope). */}
            <Route element={<RequirePermission code="job.read" />}>
              <Route path="/jobs" element={<MyServiceJobs />} />
              <Route path="/work-report/:jobId" element={<WorkCompletionReport />} />
              <Route path="/provider-earnings" element={<PayoutLedger />} />
            </Route>
            <Route path="/messaging" element={<MessagingInbox />} />

            {/* Inspection — gated on inspection.read */}
            <Route element={<RequirePermission code="inspection.read" />}>
              <Route path="/inspection-hub" element={<InspectionHub />} />
              <Route path="/inspection-checklist/:inspId" element={<InspectionChecklist />} />
              <Route path="/handover-summary/:inspId" element={<HandoverSummary />} />
            </Route>

            {/* Manager (formerly 'Admin' — DB v2 calls this role MANAGER).
                Each section is gated on the appropriate entity permission. */}
            <Route element={<RequirePermission anyOf={['payment.read', 'payment.update']} />}>
              <Route path="/manager-finance" element={<ManagerFinancial />} />
              <Route path="/manager-payments" element={<ManagerPaymentReview />} />
            </Route>
            <Route element={<RequirePermission code="user.read" />}>
              <Route path="/manager-users" element={<ManagerUserMgmt />} />
            </Route>
            <Route element={<RequirePermission code="property.read" />}>
              <Route path="/manager-properties" element={<ManagerProperties />} />
            </Route>
            <Route element={<RequirePermission code="visit_request.read" />}>
              <Route path="/manager-calendar" element={<ManagerCalendar />} />
              <Route path="/manager-onboarding" element={<ManagerOnboarding />} />
              <Route path="/manager-onboarding/:workflowId" element={<ManagerOnboardingDetail />} />
              <Route path="/manager-visits" element={<ManagerVisits />} />
            </Route>
            <Route element={<RequirePermission code="kyc.update" />}>
              <Route path="/kyc-review/:userId" element={<KycReview />} />
            </Route>
            {/* Legacy redirects — keep one release for in-flight bookmarks. */}
            <Route path="/admin-finance" element={<Navigate to="/manager-finance" replace />} />
            <Route path="/admin-users" element={<Navigate to="/manager-users" replace />} />
            <Route path="/admin-properties" element={<Navigate to="/manager-properties" replace />} />
            <Route path="/admin-calendar" element={<Navigate to="/manager-calendar" replace />} />
            <Route path="/admin-payments" element={<Navigate to="/manager-payments" replace />} />
            <Route path="/admin-onboarding" element={<Navigate to="/manager-onboarding" replace />} />

            {/* Super Admin — gated on user.create (super-admin-only) + audit_log.read */}
            <Route element={<RequirePermission allOf={['user.create', 'audit_log.read']} />}>
              <Route path="/sa" element={<SAHome />} />
              <Route path="/sa/users" element={<SAUsers />} />
              <Route path="/sa/users/:userId" element={<SAUserProfile />} />
              <Route path="/sa/properties" element={<SAProperties />} />
              <Route path="/sa/properties/create" element={<SAPropertyWizard />} />
              <Route path="/sa/properties/:propertyId/edit" element={<SAPropertyWizard />} />
              <Route path="/sa/permissions" element={<SAPermissions />} />
              <Route path="/sa/onboarding" element={<SAOnboarding />} />
              <Route path="/sa/onboarding/:workflowId" element={<SAOnboardingDetail />} />
              <Route path="/sa/visits" element={<SAVisits />} />
            </Route>

            {/* Tenant Visit Booking */}
            <Route path="/book-visit/:propertyId" element={<BookVisit />} />

            {/* Common */}
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/chat/:chatId" element={<RealtimeChat />} />
            <Route path="/kyc-verification" element={<KycVerification />} />
            <Route path="/bank-accounts" element={<BankAccounts />} />
            <Route path="/dispute/:caseId" element={<DisputeResolution />} />
            <Route path="/settlement-proposal" element={<SettlementProposal />} />
            <Route path="/notification-settings" element={<NotificationPreferences />} />
            <Route path="/marketplace" element={<Placeholder title="Marketplace" />} />
            <Route path="/activity" element={<Placeholder title="Activity History" />} />
            <Route path="/forbidden" element={<ForbiddenScreen />} />
            {/* DEV-only component sandbox */}
            {import.meta.env.DEV && (
              <Route path="/dev/components" element={<ComponentSandbox />} />
            )}
          </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}
