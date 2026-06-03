import type { UUID, Timestamp, Nullable, Address } from './common'
import type { User } from './user'

export type PharmacyType = 'independent' | 'chain' | 'compounding' | 'online'

export type PharmacyStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval'

export type DeliveryMode = 'pickup' | 'delivery' | 'both'

export interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  openTime: string  // "HH:mm"
  closeTime: string // "HH:mm"
  isOpen: boolean
}

export interface Pharmacy {
  id: UUID
  user: User
  tradeName: string
  legalName: string
  cnpj: string
  crf: string
  crfState: string
  type: PharmacyType
  status: PharmacyStatus
  address: Address
  phone: string
  email: string
  website: Nullable<string>
  deliveryMode: DeliveryMode
  deliveryRadiusKm: Nullable<number>
  operatingHours: OperatingHours[]
  handlesControlledSubstances: boolean
  handlesCompounding: boolean
  averageRating: Nullable<number>
  totalReviews: number
  logoUrl: Nullable<string>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreatePharmacyInput {
  userId: UUID
  tradeName: string
  legalName: string
  cnpj: string
  crf: string
  crfState: string
  type: PharmacyType
  address: Address
  phone: string
  deliveryMode: DeliveryMode
  operatingHours: OperatingHours[]
  handlesControlledSubstances?: boolean
  handlesCompounding?: boolean
}

export interface UpdatePharmacyInput {
  tradeName?: string
  type?: PharmacyType
  status?: PharmacyStatus
  address?: Address
  phone?: string
  email?: string
  website?: string
  deliveryMode?: DeliveryMode
  deliveryRadiusKm?: number
  operatingHours?: OperatingHours[]
  handlesControlledSubstances?: boolean
  handlesCompounding?: boolean
  logoUrl?: string
}
