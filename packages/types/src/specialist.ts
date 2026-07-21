// Tipos do modulo Specialist (medico/nutricionista/psicologo) em apps/connect.
// Derivados do schema real confirmado via Supabase MCP em 16/07/2026 (ver apps/connect/CLAUDE.md,
// secao 8), nao de packages/types/src/doctor.ts (descartado) nem da tabela legada `doctors`.
//
// Fontes reais:
// - public.profiles (role doctor/nutritionist/psychologist, tenant_id preenchido)
// - public.tenants (type = 'specialist')
// - public.availability_slots
// - medical.records / medical.record_evolutions / medical.prescriptions / medical.reports /
//   medical.exam_requests (schema separado, RLS habilitada em 16/07/2026)
//
// packages/config/src/supabase/database.types.ts so cobre o schema `public`; os tipos de
// medical.* abaixo sao mantidos a mao ate a geracao multi-schema ser resolvida.

import type { UUID, Timestamp, Nullable } from './common'

export type SpecialistRole = 'doctor' | 'nutritionist' | 'psychologist'

export type SpecialistSubtype =
  | 'clinico_geral'
  | 'endocrinologista'
  | 'urologista'
  | 'ginecologista'
  | 'psiquiatra'
  | 'psicologo'
  | 'nutricionista'

export type ConsultationType = 'in_person' | 'telemedicine' | 'both'

// ── Perfil profissional (public.profiles + public.tenants) ──────────────────

export interface SpecialistProfile {
  id: UUID
  tenantId: UUID
  role: SpecialistRole
  fullName: string
  socialName: Nullable<string>
  email: Nullable<string>
  phoneMobile: Nullable<string>
  avatarUrl: Nullable<string>
  councilId: Nullable<string>
  councilState: Nullable<string>
  medicalSpecialty: Nullable<string>
  bio: Nullable<string>
  defaultConsultationPriceReais: Nullable<number>
  acceptsInsurance: boolean
  acceptedInsurancePlans: string[]
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SpecialistTenantInfo {
  id: UUID
  code: string
  name: string
  subtype: Nullable<SpecialistSubtype>
  rqe: Nullable<string>
  conselhoNumero: Nullable<string>
  conselhoUf: Nullable<string>
}

export interface UpdateSpecialistProfileInput {
  bio?: string
  defaultConsultationPriceReais?: number
  acceptsInsurance?: boolean
  acceptedInsurancePlans?: string[]
  phoneMobile?: string
  avatarUrl?: string
}

// ── Agenda ───────────────────────────────────────────────────────────────────
// Tres pecas (Prompt 2):
// - availability_rules: disponibilidade recorrente (dia da semana + faixa de horario)
// - availability_blocks: bloqueios pontuais (feriado, ausencia)
// - availability_slots: slots concretos ja existentes no schema, referenciados por
//   appointments.slot_id; passam a ser derivados das regras no agendamento (Prompt 3)

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domingo

export interface AvailabilityRule {
  id: UUID
  doctorId: UUID
  tenantId: UUID
  weekday: Weekday
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  slotDurationMinutes: number
  consultationType: ConsultationType
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AvailabilityBlock {
  id: UUID
  doctorId: UUID
  tenantId: UUID
  startsAt: Timestamp
  endsAt: Timestamp
  reason: Nullable<string>
  createdAt: Timestamp
  updatedAt: Timestamp
}


export interface AvailabilitySlot {
  id: UUID
  doctorId: UUID
  tenantId: UUID
  startsAt: Timestamp
  endsAt: Timestamp
  isBooked: boolean
  priceReais: Nullable<number>
  createdAt: Timestamp
}

export interface CreateAvailabilitySlotInput {
  doctorId: UUID
  tenantId: UUID
  startsAt: Timestamp
  endsAt: Timestamp
  priceReais?: number
}

// ── Prontuario (medical.records / medical.record_evolutions) ────────────────

export interface MedicalRecord {
  id: UUID
  patientId: UUID
  doctorId: UUID
  appointmentId: Nullable<UUID>
  chiefComplaint: Nullable<string>
  historyOfIllness: Nullable<string>
  pastMedicalHistory: Nullable<string>
  familyHistory: Nullable<string>
  socialHistory: Nullable<string>
  gynecologicalHistory: Nullable<string>
  currentMedications: Nullable<string>
  allergies: Nullable<string>
  physicalExam: Nullable<string>
  diagnosis: Nullable<string>
  icd10Codes: Nullable<string[]>
  therapeuticPlan: Nullable<string>
  evolutionNotes: Nullable<string>
  signedAt: Nullable<Timestamp>
  signatureHash: Nullable<string>
  isFinalized: boolean
  finalizedAt: Nullable<Timestamp>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface RecordEvolution {
  id: UUID
  recordId: UUID
  doctorId: UUID
  notes: string
  createdAt: Timestamp
}

// ── Receitas (medical.prescriptions) ─────────────────────────────────────────
// Tipos conforme Portaria 344/98 ANVISA. controlled_c1/c2 e antimicrobial exigem
// assinatura ICP-Brasil (Portaria MS 467/2020, Res. CFM 2.299/2021) — ver
// apps/connect/CLAUDE.md, secao 8, para a decisao de fornecedor (Memed).
export type PrescriptionType =
  | 'common'
  | 'special_a'
  | 'special_b1'
  | 'special_b2'
  | 'controlled_c1'
  | 'controlled_c2'
  | 'antimicrobial'

export interface PrescriptionMedication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: Nullable<string>
}

export interface Prescription {
  id: UUID
  recordId: Nullable<UUID>
  patientId: UUID
  doctorId: UUID
  type: PrescriptionType
  medications: PrescriptionMedication[]
  clinicalIndication: Nullable<string>
  validUntil: Timestamp
  dispensedAt: Nullable<Timestamp>
  pharmacyId: Nullable<UUID>
  digitalSignature: Nullable<string>
  qrCodeUrl: Nullable<string>
  isValid: boolean
  createdAt: Timestamp
}

export function requiresIcpBrasilSignature(type: PrescriptionType): boolean {
  return type === 'controlled_c1' || type === 'controlled_c2' || type === 'antimicrobial'
}

// ── Laudos, atestados e solicitacoes de exame (medical.reports / medical.exam_requests) ──

export type MedicalReportType = 'laudo' | 'solicitacao_exame' | 'atestado'

export interface MedicalReport {
  id: UUID
  patientId: UUID
  doctorId: UUID
  appointmentId: Nullable<UUID>
  type: MedicalReportType
  title: string
  content: string
  digitalSignature: Nullable<string>
  pdfUrl: Nullable<string>
  isFinalized: boolean
  createdAt: Timestamp
}

export interface RequestedExam {
  examName: string
  code: Nullable<string>
  instructions: Nullable<string>
}

export interface ExamRequest {
  id: UUID
  patientId: UUID
  doctorId: UUID
  appointmentId: Nullable<UUID>
  exams: RequestedExam[]
  clinicalJustification: Nullable<string>
  completedAt: Nullable<Timestamp>
  createdAt: Timestamp
}
