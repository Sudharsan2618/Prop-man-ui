/**
 * Mock Users — tenants, owners, providers, admins
 */
export const users = [
  {
    id: 'USR-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '+91 98765 43210',
    role: 'tenant',
    avatar: null,
    initials: 'PS',
    location: 'Mumbai, India',
    status: 'verified',
    kycProgress: 100,
    memberSince: '2024-06-15',
    properties: ['PROP-001'],
  },
  {
    id: 'USR-002',
    name: 'Rajesh Mehta',
    email: 'rajesh.mehta@gmail.com',
    phone: '+971 50 123 4567',
    role: 'owner',
    avatar: null,
    initials: 'RM',
    location: 'Dubai, UAE',
    status: 'verified',
    kycProgress: 85,
    memberSince: '2023-01-10',
    portfolioValue: '₹12.5 Cr',
    properties: ['PROP-001', 'PROP-002', 'PROP-003'],
  },
  {
    id: 'USR-003',
    name: 'John Doe',
    email: 'john.doe@luxelife.com',
    phone: '+91 91234 56789',
    role: 'provider',
    avatar: null,
    initials: 'JD',
    location: 'Bangalore, India',
    status: 'verified',
    kycProgress: 100,
    memberSince: '2021-09-01',
    specialization: 'Plumbing & Electrical',
    rating: 4.8,
    totalJobs: 342,
  },
  {
    id: 'USR-004',
    name: 'Admin User',
    email: 'admin@luxelife.com',
    phone: '+91 90000 00000',
    role: 'admin',
    avatar: null,
    initials: 'AU',
    location: 'Mumbai, India',
    status: 'verified',
    kycProgress: 100,
    memberSince: '2022-01-01',
  },
  {
    id: 'USR-005',
    name: 'Sarah Jenkins',
    email: 'sarah.j@gmail.com',
    phone: '+91 98765 11111',
    role: 'tenant',
    avatar: null,
    initials: 'SJ',
    location: 'Bangalore, India',
    status: 'pending',
    kycProgress: 60,
    memberSince: '2025-11-20',
    properties: ['PROP-002'],
  },
  {
    id: 'USR-006',
    name: 'Vikram Patel',
    email: 'vikram.p@gmail.com',
    phone: '+91 87654 32100',
    role: 'provider',
    avatar: null,
    initials: 'VP',
    location: 'Mumbai, India',
    status: 'awaiting_review',
    kycProgress: 40,
    memberSince: '2026-02-01',
    specialization: 'Painting & Carpentry',
    rating: 0,
    totalJobs: 0,
  },
]

export const currentUser = users[0] // default tenant

export function getUserById(id) {
  return users.find((u) => u.id === id)
}

export function getUsersByRole(role) {
  return users.filter((u) => u.role === role)
}
