export type UUID = string

export type Timestamp = string // ISO 8601

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code: string
    details?: unknown
  }
}

export type Result<T> = ApiResponse<T> | ApiError

export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say'

export type AddressType = 'residential' | 'commercial'

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country: string
  type: AddressType
}
