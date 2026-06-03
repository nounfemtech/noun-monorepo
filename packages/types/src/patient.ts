import type { UUID, Timestamp, Nullable, Address } from './common'
import type { User, UserProfile } from './user'

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export type MenstrualCycleStatus =
  | 'regular'
  | 'irregular'
  | 'amenorrhea'
  | 'menopause'
  | 'not_applicable'

export interface MenstrualCycleData {
  status: MenstrualCycleStatus
  averageCycleLengthDays: Nullable<number>
  averagePeriodLengthDays: Nullable<number>
  lastPeriodDate: Nullable<string>
}

export interface HealthMetrics {
  weightKg: Nullable<number>
  heightCm: Nullable<number>
  bloodType: Nullable<BloodType>
  allergies: string[]
  chronicConditions: string[]
  currentMedications: string[]
  menstrualCycle: Nullable<MenstrualCycleData>
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email: Nullable<string>
}

export interface Patient {
  id: UUID
  user: User
  profile: UserProfile
  healthMetrics: HealthMetrics
  insurancePlan: Nullable<string>
  insuranceNumber: Nullable<string>
  preferredPharmacyId: Nullable<UUID>
  emergencyContact: Nullable<EmergencyContact>
  consentedToDataSharing: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreatePatientInput {
  userId: UUID
  healthMetrics?: Partial<HealthMetrics>
  emergencyContact?: EmergencyContact
  insurancePlan?: string
  insuranceNumber?: string
}

export interface UpdatePatientInput {
  healthMetrics?: Partial<HealthMetrics>
  emergencyContact?: EmergencyContact
  insurancePlan?: string
  insuranceNumber?: string
  preferredPharmacyId?: UUID
  consentedToDataSharing?: boolean
}
