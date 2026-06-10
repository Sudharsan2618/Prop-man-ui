/**
 * Domain types matching the DB v2 schema (08_database_schema.md).
 *
 * Frontend role aliases:
 *   - 'service_provider' (DB) ↔ 'provider' (UI)
 *   - 'admin' (legacy v1)     → 'manager' (mapped by normalizeRole)
 */

export type Role = 'tenant' | 'owner' | 'provider' | 'manager' | 'super_admin'

export type UserStatus = 'pending' | 'awaiting_review' | 'verified' | 'suspended'

export type PropertyType = 'apartment' | 'villa' | 'independent_house' | 'penthouse'

export type Furnishing = 'fully_furnished' | 'semi_furnished' | 'unfurnished'

export type Occupancy = 'occupied' | 'vacant'

export type VisitRequestStatus =
  | 'pending'
  | 'appointment_scheduled'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export type OnboardingWorkflowState =
  | 'visit_requested'
  | 'visit_scheduled'
  | 'visit_approved'
  | 'visit_rejected'
  | 'agreement_generated'
  | 'tenant_signed'
  | 'advance_submitted'
  | 'advance_approved'
  | 'police_verification_completed'
  | 'original_agreement_uploaded'
  | 'tenant_activated'

export type AgreementStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'awaiting_signature'
  | 'signed'
  | 'active'
  | 'terminated'
  | 'expired'

export type PaymentStatus =
  | 'pending'
  | 'overdue'
  | 'paid'
  | 'escrowed'
  | 'refunded'
  | 'failed'
  | 'awaiting_verification'
  | 'rejected'

export type PaymentType = 'rent' | 'service' | 'security_deposit' | 'advance'

export type JobStatus = 'scheduled' | 'active' | 'completed' | 'disputed' | 'cancelled'

export type InspectionType = 'move_in' | 'move_out' | 'periodic'

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'disputed'

export type KycStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  phone?: string
  name: string
  initials: string
  avatar?: string
  location?: string
  active_role: Role
  status: UserStatus
  kyc_progress: number
  must_reset_password?: boolean
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  name: string
  unit: string
  address: string
  city: string
  state: string
  pincode: string
  type: PropertyType
  bhk: string
  sqft: number
  furnishing: Furnishing
  floor: number
  total_floors: number
  facing?: string
  rent: number
  security_deposit: number
  maintenance_charges: number
  description?: string
  images: string[]
  occupancy: Occupancy
  premium: boolean
  amenities: string[]
  lease_start?: string
  lease_end?: string
  owner_id: string
  tenant_id?: string
  created_by?: string
  /** Frontend-normalized convenience fields. */
  image?: string
  chips?: string[]
  amenityIcons?: string[]
}

export interface Payment {
  id: string
  type: PaymentType
  label: string
  amount: number
  breakdown: Record<string, number>
  status: PaymentStatus
  due_date?: string
  paid_date?: string
  property_id: string
  tenant_id: string
  owner_id: string
  provider_id?: string
  manager_id?: string
  screenshot_url?: string
  verified_by?: string
  verified_at?: string
  /** Frontend-normalized. */
  dueDate?: string
  paidDate?: string
  propertyName?: string
}

export interface Job {
  id: string
  service_type: string
  category: string
  description: string
  icon: string
  address: string
  status: JobStatus
  scheduled_date?: string
  scheduled_time?: string
  estimated_cost: { min: number; max: number }
  actual_cost?: number
  property_id: string
  tenant_id?: string
  provider_id?: string
  /** Frontend-normalized. */
  serviceType?: string
  tenantName?: string
  providerName?: string
}

export interface Agreement {
  id: string
  status: AgreementStatus
  rent_amount: number
  security_deposit: number
  maintenance_charges: number
  lease_duration_months: number
  property_id: string
  tenant_id: string
  owner_id: string
  manager_id?: string
  advance_confirmed: boolean
  tenant_signature?: string
  owner_signature?: string
  pdf_url?: string
}

export interface Permission {
  id: number
  code: string
  description?: string
  entity: string
  action: 'create' | 'read' | 'update' | 'delete'
}

export interface RoleRow {
  id: number
  name: string
  description?: string
  permission_ids: number[]
}
