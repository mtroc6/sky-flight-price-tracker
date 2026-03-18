import { useState } from 'react'
import { AirportSearch } from '../components/search/AirportSearch'
import { FlightResultCard } from '../components/search/FlightResultCard'
import { useFlightSearch } from '../hooks/useFlightSearch'
import { useAddToWatchlist } from '../hooks/useWatchlist'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { FlightSearchResult } from '../types/flight'

export default function Search() {
  const [origin, setOrigin] = useState({ code: '', name: '' })
  const [destination, setDestination] = useState({ code: '', name: '' })
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [isRoundTrip, setIsRoundTrip] = useState(true)
  const [searchParams, setSearchParams] = useState<{
    origin: string; destination: string; departureDate: string; returnDate?: string
  } | null>(null)

  const { data: flights, isLoading, error } = useFlightSearch(searchParams)
  const addToWatchlist = useAddToWatchlist()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin.code || !destination.code || !departureDate) return
    setSearchParams({
      origin: origin.code,
      destination: destination.code,
      departureDate,
      returnDate: returnDate || undefined,
    })
  }

  const handleAddToWatchlist = (flight: FlightSearchResult) => {
    addToWatchlist.mutate({
      originCode: origin.code,
      originName: origin.name,
      destinationCode: destination.code,
      destinationName: destination.name,
      departureDate,
      returnDate: returnDate || undefined,
      isRoundTrip,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Szukaj lotow</h1>
        <p className="text-sm text-text-secondary">Znajdz najtansze loty i dodaj trasy do obserwowanych</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="rounded-xl border border-border bg-bg-card p-4">
        {/* Trip type toggle */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => { setIsRoundTrip(false); setReturnDate('') }}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              !isRoundTrip
                ? 'bg-accent text-bg-primary'
                : 'border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            W jedna strone
          </button>
          <button
            type="button"
            onClick={() => setIsRoundTrip(true)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              isRoundTrip
                ? 'bg-accent text-bg-primary'
                : 'border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            Powrotny
          </button>
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 ${isRoundTrip ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <AirportSearch
            label="Skad"
            value={origin.code}
            displayValue={origin.name}
            onSelect={(code, name) => setOrigin({ code, name })}
            placeholder="np. Warszawa, WAW"
          />
          <AirportSearch
            label="Dokad"
            value={destination.code}
            displayValue={destination.name}
            onSelect={(code, name) => setDestination({ code, name })}
            placeholder="np. Barcelona, BCN"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Data wylotu</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent [color-scheme:dark]"
            />
          </div>
          {isRoundTrip && (
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Data powrotu</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent [color-scheme:dark]"
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!origin.code || !destination.code || !departureDate}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Szukaj
          </button>
        </div>
      </form>

      {addToWatchlist.isSuccess && (
        <div className="rounded-lg border border-green-dim bg-green-dim/10 px-4 py-2 text-sm text-green">
          Trasa dodana do obserwowanych!
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="rounded-lg border border-red-dim bg-red-dim/10 px-4 py-3 text-sm text-red">
          Blad wyszukiwania: {(error as Error).message}
        </div>
      )}

      {flights && (
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
          <p className="text-sm text-text-muted">Nie znaleziono lotow dla podanych kryteriow</p>
        </div>
      )}
    </div>
  )
}
