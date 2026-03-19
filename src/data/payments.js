/**
 * Mock Payments & Transactions
 */
export const payments = [
  {
    id: 'PAY-001',
    type: 'rent',
    label: 'Monthly Rent',
    propertyId: 'PROP-001',
    propertyName: 'The Azure Horizon, Apt 4B',
    tenantId: 'USR-001',
    ownerId: 'USR-002',
    amount: 45000,
    breakdown: { rent: 42000, maintenance: 3000 },
    status: 'overdue',
    dueDate: '2026-03-05',
    paidDate: null,
    method: null,
    referenceId: null,
  },
  {
    id: 'PAY-002',
    type: 'rent',
    label: 'Monthly Rent',
    propertyId: 'PROP-002',
    propertyName: 'Skyline Residences, Unit 12A',
    tenantId: 'USR-005',
    ownerId: 'USR-002',
    amount: 35000,
    breakdown: { rent: 32500, maintenance: 2500 },
    status: 'paid',
    dueDate: '2026-03-01',
    paidDate: '2026-02-28',
    method: 'upi',
    referenceId: 'TXN-20260228-9845',
  },
  {
    id: 'PAY-003',
    type: 'service',
    label: 'Plumbing Repair',
    propertyId: 'PROP-001',
    propertyName: 'The Azure Horizon, Apt 4B',
    tenantId: 'USR-001',
    ownerId: 'USR-002',
    providerId: 'USR-003',
    amount: 2070,
    breakdown: { materials: 570, labor: 1500 },
    status: 'escrowed',
    dueDate: null,
    paidDate: '2026-03-02',
    method: 'card',
    referenceId: 'TXN-20260302-1122',
  },
  {
    id: 'PAY-004',
    type: 'service',
    label: 'Electrical Wiring',
    propertyId: 'PROP-002',
    propertyName: 'Skyline Residences, Unit 12A',
    tenantId: 'USR-005',
    ownerId: 'USR-002',
    providerId: 'USR-003',
    amount: 4500,
    breakdown: { materials: 1500, labor: 3000 },
    status: 'paid',
    dueDate: null,
    paidDate: '2026-02-20',
    method: 'netbanking',
    referenceId: 'TXN-20260220-3344',
  },
]

export const recentActivity = [
  { id: 'ACT-001', icon: 'trending_up', iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E', title: 'Rent Payment Received', subtitle: '2 hours ago', amount: '+₹25,000', amountColor: '#22C55E' },
  { id: 'ACT-002', icon: 'build', iconBg: 'rgba(245,158,11,0.15)', iconColor: '#F59E0B', title: 'Plumbing Repair Scheduled', subtitle: 'Yesterday', badge: 'pending' },
  { id: 'ACT-003', icon: 'check_circle', iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E', title: 'KYC Verification Complete', subtitle: '2 days ago', badge: 'verified' },
  { id: 'ACT-004', icon: 'gavel', iconBg: 'rgba(239,68,68,0.15)', iconColor: '#EF4444', title: 'Invoice Disputed', subtitle: '3 days ago', badge: 'disputed' },
  { id: 'ACT-005', icon: 'description', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#3B82F6', title: 'Lease Agreement Signed', subtitle: '1 week ago', badge: 'completed' },
]

export const ownerEarnings = {
  totalRevenue: 452000,
  commission: 45200,
  commissionRate: 10,
  netPayout: 406800,
  monthlyTrend: [
    { month: 'Oct', gross: 380000, net: 342000 },
    { month: 'Nov', gross: 400000, net: 360000 },
    { month: 'Dec', gross: 420000, net: 378000 },
    { month: 'Jan', gross: 435000, net: 391500 },
    { month: 'Feb', gross: 445000, net: 400500 },
    { month: 'Mar', gross: 452000, net: 406800 },
  ],
  tdsDeducted: 450000,
  tdsFYTotal: 1500000,
  tdsRate: 30,
}

export const adminFinancials = {
  escrowedFunds: 4523000,
  escrowedTrend: '+5.2%',
  pendingInvoices: 1245000,
  pendingInvoiceCount: 8,
  pendingInvoiceTrend: '+2.1%',
  rentSplits: [
    { propertyId: 'PROP-001', propertyName: 'The Azure Horizon, Apt 4B', grossRent: 45000, commission: 4500, ownerPayout: 40500, status: 'ready' },
    { propertyId: 'PROP-002', propertyName: 'Skyline Residences, Unit 12A', grossRent: 35000, commission: 3500, ownerPayout: 31500, status: 'pending' },
  ],
}

export function getPaymentById(id) {
  return payments.find((p) => p.id === id)
}
