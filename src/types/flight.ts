export interface WatchedRoute {
  id: number
  originCode: string
  originName: string
  destinationCode: string
  destinationName: string
  departureDate: string
  flightNumber: string | null
  trackingUrl: string | null
  isActive: boolean
  createdAt: string
  lastChecked: string | null
  currentMinPrice: number | null
  previousMinPrice: number | null
  bestAirline: string | null
  bestStops: number | null
  bestDepartureTime: string | null
  bestArrivalTime: string | null
  bestDuration: number | null
}

export interface PriceSnapshot {
  id: number
  routeId: number
  priceCents: number
  airline: string | null
  stops: number
  source: 'serpapi' | 'google'
  fetchedAt: string
}

export interface FlightSearchResult {
  id: string
  price: number
  priceCurrency: string
  airline: string
  airlineCode: string
  airlineLogo: string | null
  departureTime: string
  arrivalTime: string
  duration: number
  stops: number
  stopCities: string[]
  origin: string
  destination: string
  flightNumber: string
}
