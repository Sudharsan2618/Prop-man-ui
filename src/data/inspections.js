/**
 * Mock Inspections
 */
export const inspections = [
  {
    id: 'INS-001',
    propertyId: 'PROP-001',
    propertyName: 'The Azure Horizon, Apt 4B',
    propertyAddress: 'Bandra West, Mumbai',
    type: 'move-in',
    status: 'scheduled',
    scheduledDate: '2026-03-15',
    tenantId: 'USR-001',
    tenantName: 'Priya Sharma',
    inspectorId: 'USR-004',
    score: null,
    rooms: [],
  },
  {
    id: 'INS-002',
    propertyId: 'PROP-002',
    propertyName: 'Skyline Residences, Unit 12A',
    propertyAddress: 'Whitefield, Bangalore',
    type: 'move-out',
    status: 'completed',
    scheduledDate: '2026-02-15',
    completedDate: '2026-02-15',
    tenantId: 'USR-005',
    tenantName: 'Sarah Jenkins',
    inspectorId: 'USR-004',
    score: 8.5,
    rooms: [
      { name: 'Living Room', status: 'good', items: [
        { name: 'Walls', condition: 'good', notes: '' },
        { name: 'Flooring', condition: 'fair', notes: 'Minor scratch near entrance' },
        { name: 'Windows & Blinds', condition: 'good', notes: '' },
      ]},
      { name: 'Master Bedroom', status: 'good', items: [
        { name: 'Walls', condition: 'good', notes: '' },
        { name: 'Flooring', condition: 'good', notes: '' },
        { name: 'Closets', condition: 'good', notes: '' },
      ]},
      { name: 'Kitchen', status: 'flagged', items: [
        { name: 'Countertop', condition: 'fair', notes: 'Water stain' },
        { name: 'Sink & Faucet', condition: 'damaged', notes: 'Leaking faucet' },
        { name: 'Cabinets', condition: 'good', notes: '' },
      ]},
      { name: 'Bathroom', status: 'good', items: [
        { name: 'Tiles', condition: 'good', notes: '' },
        { name: 'Fixtures', condition: 'good', notes: '' },
      ]},
    ],
    summary: { good: 45, fair: 5, damaged: 2 },
  },
]

export const inspectionStats = {
  pending: 12,
  active: 5,
  completed: 28,
  disputes: 3,
}

export const notifications = [
  {
    id: 'NOT-001',
    type: 'payment',
    icon: 'payments',
    iconBg: 'rgba(19,200,236,0.15)',
    iconColor: '#13C8EC',
    title: 'Rent Due Reminder',
    body: 'Your monthly rent of ₹45,000 for The Azure Horizon is due today.',
    timestamp: '2h ago',
    unread: true,
    actionLabel: 'Pay Now',
    actionTarget: '/payments/PAY-001',
  },
  {
    id: 'NOT-002',
    type: 'maintenance',
    icon: 'build',
    iconBg: 'rgba(212,168,67,0.15)',
    iconColor: '#D4A843',
    title: 'Service Request Update',
    body: 'Plumbing repair for Apt 4B has been scheduled for March 6.',
    timestamp: '5h ago',
    unread: true,
    actionLabel: null,
    actionTarget: null,
  },
  {
    id: 'NOT-003',
    type: 'inspection',
    icon: 'checklist',
    iconBg: 'rgba(19,200,236,0.15)',
    iconColor: '#13C8EC',
    title: 'Inspection Scheduled',
    body: 'Move-in inspection for The Azure Horizon on March 15.',
    timestamp: '1d ago',
    unread: false,
    actionLabel: null,
    actionTarget: null,
  },
  {
    id: 'NOT-004',
    type: 'payment',
    icon: 'payments',
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22C55E',
    title: 'Payment Received',
    body: 'Rent payment of ₹35,000 received from Sarah Jenkins for Skyline Residences.',
    timestamp: '2d ago',
    unread: false,
    actionLabel: null,
    actionTarget: null,
  },
  {
    id: 'NOT-005',
    type: 'maintenance',
    icon: 'build',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#F59E0B',
    title: 'Invoice Requires Approval',
    body: 'John Doe submitted an invoice for ₹2,070 for plumbing work.',
    timestamp: '3d ago',
    unread: false,
    actionLabel: 'Approve Invoice',
    actionTarget: '/invoices/INV-001',
  },
]

export function getInspectionById(id) {
  return inspections.find((i) => i.id === id)
}
