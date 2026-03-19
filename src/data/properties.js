/**
 * Mock Properties
 */
export const properties = [
  {
    id: 'PROP-001',
    name: 'The Azure Horizon',
    unit: 'Apt 4B',
    address: 'Bandra West, Mumbai',
    type: 'Apartment',
    bhk: '3 BHK',
    sqft: 1500,
    furnishing: 'Fully Furnished',
    floor: 4,
    totalFloors: 12,
    facing: 'East',
    rent: 45000,
    securityDeposit: 135000,
    maintenanceCharges: 3000,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    ],
    ownerId: 'USR-002',
    tenantId: 'USR-001',
    occupancy: 'occupied',
    premium: true,
    amenities: ['parking', 'pool', 'gym', 'security', 'power_backup', 'playground'],
    chips: ['3 BHK', '1500 sqft', 'Furnished'],
    amenityIcons: ['local_parking', 'pool', 'fitness_center', 'security', 'bolt', 'park'],
    description: 'A luxurious 3 BHK apartment with panoramic sea views in the heart of Bandra West. This fully furnished residence features Italian marble flooring, modular kitchen, and premium fixtures throughout.',
    leaseStart: '2025-12-01',
    leaseEnd: '2026-11-30',
  },
  {
    id: 'PROP-002',
    name: 'Skyline Residences',
    unit: 'Unit 12A',
    address: 'Whitefield, Bangalore',
    type: 'Apartment',
    bhk: '2 BHK',
    sqft: 1200,
    furnishing: 'Semi Furnished',
    floor: 12,
    totalFloors: 20,
    facing: 'North',
    rent: 35000,
    securityDeposit: 105000,
    maintenanceCharges: 2500,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    ],
    ownerId: 'USR-002',
    tenantId: 'USR-005',
    occupancy: 'occupied',
    premium: false,
    amenities: ['parking', 'gym', 'security'],
    chips: ['2 BHK', '1200 sqft', 'Semi Furnished'],
    amenityIcons: ['local_parking', 'fitness_center', 'security'],
    description: 'Modern 2 BHK apartment in a premium high-rise tower with excellent connectivity to IT corridor.',
    leaseStart: '2025-11-01',
    leaseEnd: '2026-10-31',
  },
  {
    id: 'PROP-003',
    name: 'Marina Bay Villa',
    unit: 'Villa 7',
    address: 'ECR Road, Chennai',
    type: 'Villa',
    bhk: '4 BHK',
    sqft: 3200,
    furnishing: 'Fully Furnished',
    floor: 1,
    totalFloors: 2,
    facing: 'South',
    rent: 150000,
    securityDeposit: 450000,
    maintenanceCharges: 8000,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    ],
    ownerId: 'USR-002',
    tenantId: null,
    occupancy: 'vacant',
    premium: true,
    amenities: ['parking', 'pool', 'gym', 'security', 'power_backup', 'garden'],
    chips: ['4 BHK', '3200 sqft', 'Furnished', 'Sea View'],
    amenityIcons: ['local_parking', 'pool', 'fitness_center', 'security', 'bolt', 'yard'],
    description: 'Exquisite beachfront villa with private pool, landscaped gardens, and direct beach access.',
    leaseStart: null,
    leaseEnd: null,
  },
  {
    id: 'PROP-004',
    name: 'Green Park Heights',
    unit: 'Flat 301',
    address: 'Koramangala, Bangalore',
    type: 'Apartment',
    bhk: '1 BHK',
    sqft: 650,
    furnishing: 'Unfurnished',
    floor: 3,
    totalFloors: 8,
    facing: 'West',
    rent: 18000,
    securityDeposit: 54000,
    maintenanceCharges: 1500,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
    ],
    ownerId: 'USR-002',
    tenantId: null,
    occupancy: 'vacant',
    premium: false,
    amenities: ['parking', 'security'],
    chips: ['1 BHK', '650 sqft', 'Unfurnished'],
    amenityIcons: ['local_parking', 'security'],
    description: 'Compact 1 BHK ideal for young professionals, close to tech parks and metro station.',
    leaseStart: null,
    leaseEnd: null,
  },
]

export function getPropertyById(id) {
  return properties.find((p) => p.id === id)
}

export function getPropertiesByOwner(ownerId) {
  return properties.filter((p) => p.ownerId === ownerId)
}

export function getPropertiesByTenant(tenantId) {
  return properties.filter((p) => p.tenantId === tenantId)
}

export function formatRent(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L/mo`
  return `₹${amount.toLocaleString('en-IN')}/mo`
}
