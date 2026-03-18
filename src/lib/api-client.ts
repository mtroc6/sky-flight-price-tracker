const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  locations: {
    search: (query: string) =>
      request<{ data: Array<{ code: string; name: string; cityName: string; countryCode: string }> }>(
        `/locations/search?q=${encodeURIComponent(query)}`
      ),
  },

  flights: {
    search: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return request<{ data: import('../types/flight').FlightSearchResult[] }>(
        `/search/flights?${qs}`
      )
    },
  },

  watchlist: {
    list: () =>
      request<{ data: import('../types/flight').WatchedRoute[] }>('/watchlist'),

    create: (params: import('../types/api').WatchlistCreateParams) =>
      request<{ data: import('../types/flight').WatchedRoute }>('/watchlist', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    update: (id: number, params: import('../types/api').WatchlistUpdateParams) =>
      request<{ data: import('../types/flight').WatchedRoute }>(`/watchlist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),

    delete: (id: number) =>
      request<{ success: boolean }>(`/watchlist/${id}`, {
        method: 'DELETE',
      }),
  },

  prices: {
    history: (routeId: number, range?: string) => {
      const qs = range ? `?range=${range}` : ''
      return request<{ data: import('../types/flight').PriceSnapshot[] }>(
        `/prices/${routeId}${qs}`
      )
    },
    refresh: (routeId: number) =>
      request<{ data: import('../types/flight').WatchedRoute | null; message?: string }>(
        `/prices/refresh?routeId=${routeId}`,
        { method: 'POST' },
      ),
  },
}
