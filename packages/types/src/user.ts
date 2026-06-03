import type { UUID, Timestamp, Nullable, Address, Gender } from './common'

export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'admin' | 'super_admin'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'

export interface User {
  id: UUID
  email: string
  phone: Nullable<string>
  role: UserRole
  status: UserStatus
  avatarUrl: Nullable<string>
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt: Nullable<Timestamp>
}

export interface UserProfile {
  userId: UUID
  firstName: string
  lastName: string
  fullName: string
  gender: Nullable<Gender>
  dateOfBirth: Nullable<string>
  address: Nullable<Address>
  bio: Nullable<string>
}

export interface CreateUserInput {
  email: string
  password: string
  role: UserRole
  firstName: string
  lastName: string
  phone?: string
}

export interface UpdateUserInput {
  email?: string
  phone?: string
  avatarUrl?: string
  status?: UserStatus
}
