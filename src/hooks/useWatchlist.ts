import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import type { AddFlightParams } from '../types/api'

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
    mutationFn: (params: AddFlightParams) => api.watchlist.create(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })
}

export function useUpdateWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...params }: { id: number; isActive?: boolean }) =>
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
