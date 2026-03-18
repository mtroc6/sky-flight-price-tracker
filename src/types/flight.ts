export interface Location {
  id: number
  code: string
  name: string
  cityName: string
  countryCode: string
  type: 'airport' | 'city'
}

export interface WatchedRoute {
  id: number
  originCode: string
  originName: string
  destinationCode: string
  destinationName: string
  departureDate: string
  returnDate: string | null
  isRoundTrip: boolean
  flexDays: number
  cabinClass: 'economy' | 'business' | 'first'
  adults: number
  isActive: boolean
  createdAt: string
  lastChecked: string | null
  currentMinPrice: number | null
  previousMinPrice: number | null
}

export interface PriceSnapshot {
  id: number
  routeId: number
  priceCents: number
  airline: string | null
  stops: number
  bookingLink: string | null
  source: 'kiwi' | 'serpapi'
  fetchedAt: string
}

export interface FlightSearchResult {
  id: string
  price: number
  priceCurrency: string
  airline: string
  airlineLogo: string | null
  departureTime: string
  arrivalTime: string
  duration: number
  stops: number
  stopCities: string[]
  origin: string
  destination: string
  bookingLink: string
  returnDepartureTime?: string
  returnArrivalTime?: string
  returnDuration?: number
  returnStops?: number
}

export interface AlternativeRoute {
  id: number
  routeId: number
  originCode: string
  destinationCode: string
  priceCents: number
  airline: string | null
  stops: number
  bookingLink: string | null
  foundAt: string
}
