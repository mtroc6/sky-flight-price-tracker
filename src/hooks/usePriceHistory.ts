import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'

export function usePriceHistory(routeId: number | undefined) {
  return useQuery({
    queryKey: ['prices', routeId],
    queryFn: () => api.prices.history(routeId!),
    enabled: !!routeId,
    select: (res) => res.data,
  })
}
