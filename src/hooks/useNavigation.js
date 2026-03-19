/**
 * useNavigation — Centralized navigation hook.
 *
 * Provides role-aware tab→route mapping so every screen
 * uses the same consistent routing logic.
 */
import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'

/**
 * Bottom Nav tab key → route mapping per role.
 * Matches the flows defined in 03_navigation_flows_and_checklist.md.
 */
const TAB_ROUTES = {
  tenant: {
    home: '/',
    properties: '/browse',
    services: '/services',
    payments: '/pay',
    profile: '/profile',
    alerts: '/notifications',
  },
  owner: {
    dashboard: '/',
    properties: '/portfolio-hub',
    maintenance: '/maintenance-log',
    tax: '/tax-tds',
    profile: '/profile',
    alerts: '/notifications',
    inspections: '/inspection-hub',
  },
  provider: {
    home: '/',
    jobs: '/jobs',
    messages: '/messaging',
    earnings: '/provider-earnings',
    profile: '/profile',
    alerts: '/notifications',
  },
  admin: {
    home: '/',
    finance: '/admin-finance',
    properties: '/admin-properties',
    users: '/admin-users',
    profile: '/profile',
    settings: '/notification-settings',
    alerts: '/notifications',
  },
}

/**
 * Role-aware home routes — what "/" resolves to per role.
 */
export const HOME_ROUTES = {
  tenant: '/',
  owner: '/owner-dashboard',
  provider: '/jobs',
  admin: '/admin-finance',
}

export function useNavigation() {
  const navigate = useNavigate()
  const { role } = useRole()

  const routes = TAB_ROUTES[role] || TAB_ROUTES.tenant

  /**
   * Handle bottom nav tab change — navigates to the correct route.
   */
  const handleTabChange = (tabKey) => {
    const route = routes[tabKey]
    if (route) navigate(route)
  }

  /**
   * Navigate to the role-specific home/dashboard screen.
   */
  const goHome = () => navigate(HOME_ROUTES[role] || '/')

  /**
   * Common navigation shortcuts used across multiple screens.
   */
  const goTo = {
    // Common
    profile: () => navigate('/profile'),
    notifications: () => navigate('/notifications'),
    messaging: () => navigate('/messaging'),
    kycVerification: () => navigate('/kyc-verification'),
    bankAccounts: () => navigate('/bank-accounts'),
    notificationSettings: () => navigate('/notification-settings'),

    // Tenant
    browse: () => navigate('/browse'),
    pay: () => navigate('/pay'),
    services: () => navigate('/services'),
    bookService: (key) => navigate(`/book-service/${key}`),
    property: (id) => navigate(`/property/${id}`),
    agreement: (id) => navigate(`/agreement/${id}`),
    bookingConfirmed: () => navigate('/booking-confirmed'),

    // Owner
    ownerDashboard: () => navigate('/owner-dashboard'),
    listProperty: () => navigate('/list-property'),
    maintenanceLog: () => navigate('/maintenance-log'),
    invoiceApproval: (jobId) => navigate(`/invoice-approval/${jobId}`),
    portfolioHub: () => navigate('/portfolio-hub'),
    earningsAnalytics: () => navigate('/earnings-analytics'),
    taxTds: () => navigate('/tax-tds'),

    // Provider
    jobs: () => navigate('/jobs'),
    workReport: (jobId) => navigate(`/work-report/${jobId}`),
    providerEarnings: () => navigate('/provider-earnings'),

    // Inspection
    inspectionHub: () => navigate('/inspection-hub'),
    inspectionChecklist: (id) => navigate(`/inspection-checklist/${id}`),
    handoverSummary: (id) => navigate(`/handover-summary/${id}`),

    // Dispute
    dispute: (caseId) => navigate(`/dispute/${caseId || '84920'}`),
    settlementProposal: () => navigate('/settlement-proposal'),

    // Admin
    adminFinance: () => navigate('/admin-finance'),
    adminUsers: () => navigate('/admin-users'),
    kycReview: (userId) => navigate(`/kyc-review/${userId}`),

    // Chat
    chat: (chatId) => navigate(`/chat/${chatId}`),
  }

  return { handleTabChange, goHome, goTo, role, routes }
}
