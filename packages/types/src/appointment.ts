import type { UUID, Timestamp, Nullable } from './common'
import type { ConsultationType } from './doctor'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled'

export type CancellationReason =
  | 'patient_request'
  | 'doctor_unavailable'
  | 'emergency'
  | 'no_show'
  | 'other'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface AppointmentNotes {
  chiefComplaint: Nullable<string>
  anamnesis: Nullable<string>
  physicalExam: Nullable<string>
  diagnosis: Nullable<string>
  treatmentPlan: Nullable<string>
  prescriptions: Nullable<string>
  followUpDate: Nullable<string>
}

export interface Appointment {
  id: UUID
  patientId: UUID
  doctorId: UUID
  scheduledAt: Timestamp
  durationMinutes: number
  consultationType: ConsultationType
  status: AppointmentStatus
  paymentStatus: PaymentStatus
  paymentAmountReais: Nullable<number>
  meetingUrl: Nullable<string>
  notes: Nullable<AppointmentNotes>
  cancellationReason: Nullable<CancellationReason>
  cancellationNote: Nullable<string>
  cancelledAt: Nullable<Timestamp>
  cancelledBy: Nullable<UUID>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateAppointmentInput {
  patientId: UUID
  doctorId: UUID
  scheduledAt: Timestamp
  durationMinutes: number
  consultationType: ConsultationType
  paymentAmountReais?: number
}

export interface UpdateAppointmentInput {
  scheduledAt?: Timestamp
  status?: AppointmentStatus
  paymentStatus?: PaymentStatus
  meetingUrl?: string
  notes?: Partial<AppointmentNotes>
  cancellationReason?: CancellationReason
  cancellationNote?: string
}

export interface AppointmentFilter {
  patientId?: UUID
  doctorId?: UUID
  status?: AppointmentStatus | AppointmentStatus[]
  from?: Timestamp
  to?: Timestamp
  consultationType?: ConsultationType
}
