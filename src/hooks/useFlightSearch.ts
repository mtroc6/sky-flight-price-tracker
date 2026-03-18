import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'

interface SearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: string
  cabinClass?: string
  maxStops?: string
}

export function useFlightSearch(params: SearchParams | null) {
  const searchParams: Record<string, string> = {}
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams[k] = v
    })
  }

  return useQuery({
    queryKey: ['flights', params],
    queryFn: () => api.flights.search(searchParams),
    enabled: !!params && !!params.origin && !!params.destination && !!params.departureDate,
    select: (res) => res.data,
  })
}
