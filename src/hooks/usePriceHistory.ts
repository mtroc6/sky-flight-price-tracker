import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { TimeRange } from '../types/chart'

export function usePriceHistory(routeId: number | undefined, range?: TimeRange) {
  return useQuery({
    queryKey: ['prices', routeId, range],
    queryFn: () => api.prices.history(routeId!, range),
    enabled: !!routeId,
    select: (res) => res.data,
  })
}
