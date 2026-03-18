import { useMemo } from 'react'
import { searchAirports } from '../lib/airports'

export function useLocations(query: string) {
  const data = useMemo(() => {
    if (query.length < 2) return []
    return searchAirports(query)
  }, [query])

  return {
    data,
    isLoading: false,
  }
}
