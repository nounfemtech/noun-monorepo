// Tipos de public.appointments, realinhados ao schema real confirmado via Supabase MCP
// (ver apps/connect/CLAUDE.md, secao 8). A versao anterior deste arquivo modelava campos do
// schema legado descartado (scheduledAt/durationMinutes/meetingUrl/paymentAmountReais/rescheduled)
// que nao existem em public.appointments hoje. Horario vem de availability_slots (via slotId),
// nao de um campo solto aqui.

import type { UUID, Timestamp, Nullable } from './common'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type AppointmentType = 'first_visit' | 'follow_up' | 'return' | 'telemedicine'

export interface Appointment {
  id: UUID
  patientId: UUID
  doctorId: UUID
  tenantId: UUID
  slotId: Nullable<UUID>
  status: AppointmentStatus
  type: AppointmentType
  priceReais: Nullable<number>
  paymentMethod: Nullable<string>
  cardBrand: Nullable<string>
  paidAt: Nullable<Timestamp>
  patientNotes: Nullable<string>
  telemedicineUrl: Nullable<string>
  googleCalendarEventId: Nullable<string>
  cancelledBy: Nullable<UUID>
  cancelledReason: Nullable<string>
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Formato de referencia para o prontuario por consulta (Prompt 3 cita este shape), mas o dado
// real e persistido em medical.records/medical.record_evolutions (ver specialist.ts), nao numa
// coluna jsonb aqui.
export interface AppointmentNotes {
  chiefComplaint: Nullable<string>
  anamnesis: Nullable<string>
  physicalExam: Nullable<string>
  diagnosis: Nullable<string>
  treatmentPlan: Nullable<string>
  followUpDate: Nullable<string>
}

export interface CreateAppointmentInput {
  patientId: UUID
  doctorId: UUID
  tenantId: UUID
  slotStartsAt: Timestamp
  slotEndsAt: Timestamp
  type: AppointmentType
  priceReais?: number
  patientNotes?: string
}

export interface AppointmentFilter {
  patientId?: UUID
  doctorId?: UUID
  status?: AppointmentStatus | AppointmentStatus[]
  from?: Timestamp
  to?: Timestamp
  type?: AppointmentType
}
