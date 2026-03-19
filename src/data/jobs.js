/**
 * Mock Service Jobs
 */
export const jobs = [
  {
    id: 'JOB-001',
    serviceType: 'Plumbing Repair',
    description: 'Sink Leak — Kitchen',
    icon: 'plumbing',
    propertyId: 'PROP-001',
    address: '123 Azure View, Apt 4B, Bandra West',
    tenantId: 'USR-001',
    tenantName: 'Priya Sharma',
    providerId: 'USR-003',
    providerName: 'John Doe',
    status: 'active',
    scheduledDate: '2026-03-06',
    scheduledTime: '10:00 AM - 12:00 PM',
    estimatedCost: { min: 500, max: 1500 },
    actualCost: null,
    createdAt: '2026-03-03',
  },
  {
    id: 'JOB-002',
    serviceType: 'Electrical Wiring',
    description: 'Faulty switch panel in master bedroom',
    icon: 'bolt',
    propertyId: 'PROP-002',
    address: 'Skyline Residences, Unit 12A, Whitefield',
    tenantId: 'USR-005',
    tenantName: 'Sarah Jenkins',
    providerId: 'USR-003',
    providerName: 'John Doe',
    status: 'completed',
    scheduledDate: '2026-02-20',
    scheduledTime: '02:00 PM - 04:00 PM',
    estimatedCost: { min: 400, max: 1200 },
    actualCost: 4500,
    createdAt: '2026-02-18',
    completedAt: '2026-02-20',
  },
  {
    id: 'JOB-003',
    serviceType: 'Painting',
    description: 'Full living room repaint',
    icon: 'format_paint',
    propertyId: 'PROP-001',
    address: '123 Azure View, Apt 4B, Bandra West',
    tenantId: 'USR-001',
    tenantName: 'Priya Sharma',
    providerId: null,
    providerName: null,
    status: 'scheduled',
    scheduledDate: '2026-03-10',
    scheduledTime: '09:00 AM - 05:00 PM',
    estimatedCost: { min: 3000, max: 8000 },
    actualCost: null,
    createdAt: '2026-03-04',
  },
  {
    id: 'JOB-004',
    serviceType: 'AC Service',
    description: 'Annual maintenance — 3 split ACs',
    icon: 'ac_unit',
    propertyId: 'PROP-003',
    address: 'Marina Bay Villa 7, ECR Road',
    tenantId: null,
    tenantName: null,
    providerId: 'USR-003',
    providerName: 'John Doe',
    status: 'disputed',
    scheduledDate: '2026-02-28',
    scheduledTime: '10:00 AM - 02:00 PM',
    estimatedCost: { min: 1500, max: 4000 },
    actualCost: 6500,
    createdAt: '2026-02-25',
    completedAt: '2026-02-28',
  },
]

export const serviceCategories = [
  { key: 'plumbing',   icon: 'plumbing',           label: 'Plumbing',         startPrice: 500,  emergency: true },
  { key: 'electrical', icon: 'bolt',               label: 'Electrical',       startPrice: 400,  emergency: false },
  { key: 'carpentry',  icon: 'carpenter',          label: 'Carpentry',        startPrice: 600,  emergency: false },
  { key: 'painting',   icon: 'format_paint',       label: 'Painting',         startPrice: 1000, emergency: false },
  { key: 'cleaning',   icon: 'cleaning_services',  label: 'Cleaning',         startPrice: 800,  emergency: false },
  { key: 'pest',       icon: 'pest_control',       label: 'Pest Control',     startPrice: 1200, emergency: false },
  { key: 'appliance',  icon: 'kitchen',            label: 'Appliance Repair', startPrice: 300,  emergency: false },
  { key: 'ac',         icon: 'ac_unit',            label: 'AC Service',       startPrice: 450,  emergency: false },
]

export const providerStats = {
  nextPayoutAmount: 12500,
  nextPayoutDate: '2026-03-10T00:00:00',
  weeklyTarget: 75,
  earningsThisWeek: 15200,
  earningsThisMonth: 42800,
  earningsLifetime: 850000,
  weeklyBreakdown: [
    { day: 'Mon', amount: 2800 },
    { day: 'Tue', amount: 3200 },
    { day: 'Wed', amount: 1500 },
    { day: 'Thu', amount: 4200 },
    { day: 'Fri', amount: 3500 },
    { day: 'Sat', amount: 0 },
    { day: 'Sun', amount: 0 },
  ],
}

export function getJobById(id) {
  return jobs.find((j) => j.id === id)
}

export function getJobsByProvider(providerId) {
  return jobs.filter((j) => j.providerId === providerId)
}

export function getJobsByStatus(status) {
  return jobs.filter((j) => j.status === status)
}
