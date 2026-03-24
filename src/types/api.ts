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

export interface AddFlightParams {
  trackingUrl: string
  originCode: string
  originName: string
  destinationCode: string
  destinationName: string
  departureDate: string
  flightNumber: string
  airline: string
  departureTime: string
  arrivalTime: string
  duration: number
  stops: number
  price: number
  group?: string
}
