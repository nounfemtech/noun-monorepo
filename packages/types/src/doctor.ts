import type { UUID, Timestamp, Nullable, Address } from './common'
import type { User, UserProfile } from './user'

export type DoctorSpecialty =
  | 'gynecology'
  | 'obstetrics'
  | 'endocrinology'
  | 'dermatology'
  | 'psychiatry'
  | 'psychology'
  | 'cardiology'
  | 'general_practice'
  | 'other'

export type DoctorStatus = 'active' | 'inactive' | 'on_vacation' | 'suspended'

export type ConsultationType = 'in_person' | 'telemedicine' | 'both'

export interface AvailabilitySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string // "HH:mm"
  endTime: string   // "HH:mm"
  slotDurationMinutes: number
}

export interface DoctorAvailability {
  slots: AvailabilitySlot[]
  consultationType: ConsultationType
  maxPatientsPerDay: Nullable<number>
  advanceBookingDays: number
}

export interface Doctor {
  id: UUID
  user: User
  profile: UserProfile
  crm: string
  crmState: string
  specialties: DoctorSpecialty[]
  status: DoctorStatus
  clinicAddress: Nullable<Address>
  consultationFeeReais: Nullable<number>
  availability: Nullable<DoctorAvailability>
  bio: Nullable<string>
  acceptsInsurance: boolean
  acceptedInsurancePlans: string[]
  averageRating: Nullable<number>
  totalReviews: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateDoctorInput {
  userId: UUID
  crm: string
  crmState: string
  specialties: DoctorSpecialty[]
  clinicAddress?: Address
  consultationFeeReais?: number
  availability?: DoctorAvailability
  bio?: string
  acceptsInsurance?: boolean
  acceptedInsurancePlans?: string[]
}

export interface UpdateDoctorInput {
  specialties?: DoctorSpecialty[]
  status?: DoctorStatus
  clinicAddress?: Address
  consultationFeeReais?: number
  availability?: DoctorAvailability
  bio?: string
  acceptsInsurance?: boolean
  acceptedInsurancePlans?: string[]
}
