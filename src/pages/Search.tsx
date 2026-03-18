import { useState } from 'react'
import { api } from '../lib/api-client'
import { FlightResultCard } from '../components/search/FlightResultCard'
import { useAddToWatchlist } from '../hooks/useWatchlist'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { FlightSearchResult } from '../types/flight'

export default function Search() {
  const [url, setUrl] = useState('')
  const [flights, setFlights] = useState<FlightSearchResult[] | null>(null)
  const [parsedInfo, setParsedInfo] = useState<{
    origin: string; destination: string; date: string; airlineCode: string; airlineName: string;
    flightNumber: string; trackingUrl: string; originName: string; destinationName: string
  } | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToWatchlist = useAddToWatchlist()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setIsLoading(true)
    setError(null)
    setFlights(null)
    setParsedInfo(null)
    setWarning(null)
    try {
      const res = await api.flights.parseUrl(url.trim())
      setFlights(res.data.flights)
      setParsedInfo(res.data.parsed)
      setWarning(res.data.warning ?? null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToWatchlist = (flight: FlightSearchResult) => {
    if (!parsedInfo) return
    addToWatchlist.mutate({
      trackingUrl: parsedInfo.trackingUrl,
      originCode: parsedInfo.origin,
      originName: parsedInfo.originName,
      destinationCode: parsedInfo.destination,
      destinationName: parsedInfo.destinationName,
      departureDate: parsedInfo.date,
      flightNumber: flight.flightNumber || parsedInfo.flightNumber,
      airline: flight.airline || parsedInfo.airlineName,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      stops: flight.stops,
      price: flight.price,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Szukaj lotow</h1>
        <p className="text-sm text-text-secondary">Wklej link do lotu z Google Flights, zeby dodac go do obserwowanych</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="rounded-xl border border-border bg-bg-card p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Link do lotu</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.google.com/travel/flights/..."
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Szukaj
            </button>
          </div>
        </div>
      </form>

      {addToWatchlist.isSuccess && (
        <div className="rounded-lg border border-green-dim bg-green-dim/10 px-4 py-2 text-sm text-green">
          Lot dodany do obserwowanych!
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="rounded-lg border border-red-dim bg-red-dim/10 px-4 py-3 text-sm text-red">
          Blad wyszukiwania: {error}
        </div>
      )}

      {warning && (
        <div className="rounded-lg border border-yellow/30 bg-yellow/5 px-4 py-3 text-sm text-yellow">
          {warning}
        </div>
      )}

      {parsedInfo && (
        <div className="rounded-lg border border-border bg-bg-card px-4 py-3 text-sm text-text-secondary">
          <span className="font-mono font-semibold text-accent">{parsedInfo.origin}</span>
          <span className="mx-2 text-text-muted">&rarr;</span>
          <span className="font-mono font-semibold text-accent">{parsedInfo.destination}</span>
          <span className="mx-3 text-text-muted">|</span>
          <span>{parsedInfo.date}</span>
          {parsedInfo.flightNumber && (
            <>
              <span className="mx-3 text-text-muted">|</span>
              <span className="font-mono">{parsedInfo.flightNumber}</span>
            </>
          )}
        </div>
      )}

      {flights && flights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Znaleziono {flights.length} lotow
            </h2>
          </div>
          <div className="space-y-3">
            {flights.map((flight) => (
              <FlightResultCard
                key={flight.id}
                flight={flight}
                onAddToWatchlist={() => handleAddToWatchlist(flight)}
              />
            ))}
          </div>
        </div>
      )}

      {flights && flights.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-bg-card py-12">
          <div className="text-3xl">:(</div>
          <p className="text-sm text-text-muted">Nie znaleziono lotow dla podanego linku</p>
        </div>
      )}
    </div>
  )
}
