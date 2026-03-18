export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
  cabinClass?: 'economy' | 'business' | 'first'
  currency?: string
  maxStops?: number
}

export interface WatchlistCreateParams {
  originCode: string
  originName: string
  destinationCode: string
  destinationName: string
  departureDate: string
  returnDate?: string
  isRoundTrip: boolean
  flexDays?: number
  cabinClass?: 'economy' | 'business' | 'first'
  adults?: number
}

export interface WatchlistUpdateParams {
  isActive?: boolean
  flexDays?: number
  cabinClass?: 'economy' | 'business' | 'first'
  departureDate?: string
  returnDate?: string
}
