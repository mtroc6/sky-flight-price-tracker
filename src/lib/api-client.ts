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
  flights: {
    parseUrl: (url: string) =>
      request<{
        data: {
          parsed: {
            origin: string
            destination: string
            date: string
            airlineCode: string
            airlineName: string
            flightNumber: string
            trackingUrl: string
            originName: string
            destinationName: string
          }
          flights: import('../types/flight').FlightSearchResult[]
          warning?: string
        }
      }>('/flights/parse-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  },

  watchlist: {
    list: () =>
      request<{ data: import('../types/flight').WatchedRoute[] }>('/watchlist'),

    create: (params: import('../types/api').AddFlightParams) =>
      request<{ data: import('../types/flight').WatchedRoute }>('/watchlist', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    update: (id: number, params: { isActive?: boolean }) =>
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
