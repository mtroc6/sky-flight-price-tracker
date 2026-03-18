import type { FlightSearchResult } from '../types/flight'
import type { FlightSearchParams } from '../types/api'

const SERPAPI_BASE = 'https://serpapi.com/search'

const CABIN_MAP: Record<string, number> = {
  economy: 1,
  business: 3,
  first: 4,
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult[]> {
  const url = new URL(SERPAPI_BASE)
  url.searchParams.set('engine', 'google_flights')
  url.searchParams.set('api_key', process.env.SERPAPI_KEY || '')
  url.searchParams.set('departure_id', params.origin)
  url.searchParams.set('arrival_id', params.destination)
  url.searchParams.set('outbound_date', params.departureDate)
  url.searchParams.set('hl', 'pl')
  url.searchParams.set('gl', 'pl')
  url.searchParams.set('currency', params.currency || 'PLN')
  url.searchParams.set('adults', String(params.adults || 1))
  url.searchParams.set('travel_class', String(CABIN_MAP[params.cabinClass || 'economy']))

  if (params.returnDate) {
    url.searchParams.set('return_date', params.returnDate)
    url.searchParams.set('type', '1') // round trip
  } else {
    url.searchParams.set('type', '2') // one way
  }

  if (params.maxStops !== undefined) {
    url.searchParams.set('stops', String(params.maxStops))
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`SerpApi error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  if (json.error) {
    throw new Error(`SerpApi error: ${json.error}`)
  }

  const allFlights = [
    ...(json.best_flights || []),
    ...(json.other_flights || []),
  ]

  return allFlights.map((flight: Record<string, unknown>, index: number) => {
    const legs = flight.flights as Array<Record<string, unknown>>
    const firstLeg = legs[0]
    const lastLeg = legs[legs.length - 1]

    const depAirport = firstLeg.departure_airport as Record<string, string>
    const arrAirport = lastLeg.arrival_airport as Record<string, string>

    const result: FlightSearchResult = {
      id: `serpapi-${index}-${Date.now()}`,
      price: flight.price as number,
      priceCurrency: params.currency || 'PLN',
      airline: (firstLeg.airline as string) || '',
      airlineLogo: (firstLeg.airline_logo as string) || null,
      departureTime: depAirport.time || '',
      arrivalTime: arrAirport.time || '',
      duration: ((flight.total_duration as number) || 0) * 60,
      stops: Math.max(0, legs.length - 1),
      stopCities: legs.slice(1).map((l) => {
        const dep = l.departure_airport as Record<string, string>
        return dep?.name || dep?.id || ''
      }),
      origin: depAirport.name || depAirport.id || '',
      destination: arrAirport.name || arrAirport.id || '',
      bookingLink: null,
    }

    // If there's a departure_token, we could fetch return flights
    // but for now we just mark the type
    if (flight.type === 'Round trip') {
      result.returnDuration = 0
      result.returnStops = 0
    }

    return result
  })
}

export async function getMinPrice(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  _flexDays: number = 0,
  cabinClass: string = 'economy',
): Promise<{ priceCents: number; airline: string; stops: number; bookingLink: string; departureTime: string; arrivalTime: string; duration: number } | null> {
  const url = new URL(SERPAPI_BASE)
  url.searchParams.set('engine', 'google_flights')
  url.searchParams.set('api_key', process.env.SERPAPI_KEY || '')
  url.searchParams.set('departure_id', origin)
  url.searchParams.set('arrival_id', destination)
  url.searchParams.set('outbound_date', departureDate)
  url.searchParams.set('hl', 'pl')
  url.searchParams.set('gl', 'pl')
  url.searchParams.set('currency', 'PLN')
  url.searchParams.set('travel_class', String(CABIN_MAP[cabinClass]))

  if (returnDate) {
    url.searchParams.set('return_date', returnDate)
    url.searchParams.set('type', '1')
  } else {
    url.searchParams.set('type', '2')
  }

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const json = await res.json()
  if (json.error) return null

  const allFlights = [
    ...(json.best_flights || []),
    ...(json.other_flights || []),
  ]

  if (allFlights.length === 0) return null

  // Find cheapest
  const cheapest = allFlights.reduce((min: Record<string, unknown>, f: Record<string, unknown>) =>
    (f.price as number) < (min.price as number) ? f : min
  , allFlights[0])

  const legs = cheapest.flights as Array<Record<string, unknown>>
  const firstLeg = legs[0]
  const lastLeg = legs[legs.length - 1]
  const depAirport = firstLeg.departure_airport as Record<string, string>
  const arrAirport = lastLeg.arrival_airport as Record<string, string>

  return {
    priceCents: Math.round((cheapest.price as number) * 100),
    airline: (firstLeg.airline as string) || '',
    stops: Math.max(0, legs.length - 1),
    bookingLink: '',
    departureTime: depAirport?.time || '',
    arrivalTime: arrAirport?.time || '',
    duration: ((cheapest.total_duration as number) || 0) * 60,
  }
}
