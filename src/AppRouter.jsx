import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { RoleProvider, useRole } from './context/RoleContext'

/* ── Auth Pages ── */
import WelcomeScreen from './pages/auth/WelcomeScreen'
import LoginScreen from './pages/auth/LoginScreen'
import SignupScreen from './pages/auth/SignupScreen'
import RoleSelectionHub from './pages/auth/RoleSelectionHub'
import FirstLoginPasswordReset from './pages/auth/FirstLoginPasswordReset'

/* ── App Pages ── */
import TenantDashboard from './pages/tenant/TenantDashboard'
import PropertyDiscovery from './pages/tenant/PropertyDiscovery'
import PropertyDetails from './pages/tenant/PropertyDetails'
import SecurePayment from './pages/tenant/SecurePayment'
import DigitalAgreement from './pages/tenant/DigitalAgreement'
import BookingConfirmed from './pages/tenant/BookingConfirmed'
import ServiceMarketplace from './pages/tenant/ServiceMarketplace'
import BookSlot from './pages/tenant/BookSlot'
import TenantPayments from './pages/tenant/TenantPayments'
import MyServiceJobs from './pages/provider/MyServiceJobs'
import ProviderDashboard from './pages/provider/ProviderDashboard'
import WorkCompletionReport from './pages/provider/WorkCompletionReport'
import PayoutLedger from './pages/provider/PayoutLedger'
import OwnerPortfolio from './pages/owner/OwnerPortfolio'
import ListNewProperty from './pages/owner/ListNewProperty'
import MaintenanceLog from './pages/owner/MaintenanceLog'
import InvoiceApproval from './pages/owner/InvoiceApproval'
import PortfolioHub from './pages/owner/PortfolioHub'
import EarningsAnalytics from './pages/owner/EarningsAnalytics'
import TaxTds from './pages/owner/TaxTds'
import InspectionHub from './pages/inspection/InspectionHub'
import InspectionChecklist from './pages/inspection/InspectionChecklist'
import HandoverSummary from './pages/inspection/HandoverSummary'
import UserProfile from './pages/common/UserProfile'
import NotificationCenter from './pages/common/NotificationCenter'
import MessagingInbox from './pages/common/MessagingInbox'
import RealtimeChat from './pages/common/RealtimeChat'
import KycVerification from './pages/common/KycVerification'
import BankAccounts from './pages/common/BankAccounts'
import DisputeResolution from './pages/common/DisputeResolution'
import SettlementProposal from './pages/common/SettlementProposal'
import NotificationPreferences from './pages/common/NotificationPreferences'
import AdminFinancial from './pages/admin/AdminFinancial'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProperties from './pages/admin/AdminProperties'
import AdminUserMgmt from './pages/admin/AdminUserMgmt'
import KycReview from './pages/admin/KycReview'
import AdminCalendar from './pages/admin/AdminCalendar'
import AdminPaymentReview from './pages/admin/AdminPaymentReview'
import AdminOnboarding from './pages/admin/AdminOnboarding'
import BookVisit from './pages/tenant/BookVisit'

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
    case 'admin': return <AdminDashboard />
    default: return <TenantDashboard />
  }
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RoleProvider defaultRole="tenant">
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

            {/* Owner */}
            <Route path="/owner-dashboard" element={<OwnerPortfolio />} />
            <Route path="/list-property" element={<ListNewProperty />} />
            <Route path="/maintenance-log" element={<MaintenanceLog />} />
            <Route path="/invoice-approval/:jobId" element={<InvoiceApproval />} />
            <Route path="/portfolio-hub" element={<PortfolioHub />} />
            <Route path="/earnings-analytics" element={<EarningsAnalytics />} />
            <Route path="/tax-tds" element={<TaxTds />} />

            {/* Provider */}
            <Route path="/jobs" element={<MyServiceJobs />} />
            <Route path="/work-report/:jobId" element={<WorkCompletionReport />} />
            <Route path="/provider-earnings" element={<PayoutLedger />} />
            <Route path="/messaging" element={<MessagingInbox />} />

            {/* Inspection */}
            <Route path="/inspection-hub" element={<InspectionHub />} />
            <Route path="/inspection-checklist/:inspId" element={<InspectionChecklist />} />
            <Route path="/handover-summary/:inspId" element={<HandoverSummary />} />

            {/* Admin */}
            <Route path="/admin-finance" element={<AdminFinancial />} />
            <Route path="/admin-users" element={<AdminUserMgmt />} />
            <Route path="/kyc-review/:userId" element={<KycReview />} />
            <Route path="/admin-properties" element={<AdminProperties />} />
            <Route path="/admin-calendar" element={<AdminCalendar />} />
            <Route path="/admin-payments" element={<AdminPaymentReview />} />
            <Route path="/admin-onboarding" element={<AdminOnboarding />} />

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
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </RoleProvider>
    </BrowserRouter>
  )
}
