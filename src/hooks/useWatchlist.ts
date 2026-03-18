import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { WatchlistCreateParams, WatchlistUpdateParams } from '../types/api'

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.watchlist.list(),
    select: (res) => res.data,
  })
}

export function useAddToWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: WatchlistCreateParams) => api.watchlist.create(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })
}

export function useUpdateWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...params }: WatchlistUpdateParams & { id: number }) =>
      api.watchlist.update(id, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })
}

export function useDeleteFromWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.watchlist.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })
}
