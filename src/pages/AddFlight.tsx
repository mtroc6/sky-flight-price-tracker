import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api-client'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useQueryClient } from '@tanstack/react-query'
import type { FlightSearchResult } from '../types/flight'

function formatTime(timeStr: string): string {
  const timePart = timeStr.split(' ')[1]
  if (timePart) return timePart.slice(0, 5)
  return timeStr
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export default function AddFlight() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flights, setFlights] = useState<FlightSearchResult[] | null>(null)
  const [parsedData, setParsedData] = useState<{
    origin: string; destination: string; date: string
    airlineName: string; flightNumber: string; trackingUrl: string
    originName: string; destinationName: string
  } | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleParseUrl = async () => {
    if (!url.trim()) return
    setIsLoading(true)
    setError(null)
    setFlights(null)
    setParsedData(null)
    setWarning(null)
    setSuccess(false)

    try {
      const result = await api.flights.parseUrl(url.trim())
      setParsedData(result.data.parsed)
      setFlights(result.data.flights)
      if (result.data.warning) setWarning(result.data.warning)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectFlight = async (flight: FlightSearchResult) => {
    if (!parsedData) return
    setIsAdding(true)
    setError(null)

    try {
      await api.watchlist.create({
        trackingUrl: parsedData.trackingUrl,
        originCode: parsedData.origin,
        originName: parsedData.originName,
        destinationCode: parsedData.destination,
        destinationName: parsedData.destinationName,
        departureDate: parsedData.date,
        flightNumber: flight.flightNumber || parsedData.flightNumber,
        airline: flight.airline,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        stops: flight.stops,
        price: flight.price,
      })

      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      setSuccess(true)
      setTimeout(() => navigate('/watchlist'), 1500)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dodaj lot do sledzenia</h1>
        <p className="text-sm text-text-secondary">Wklej link z Google Flights do konkretnego lotu</p>
      </div>

      {/* URL input */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Link z Google Flights
        </label>
        <p className="mb-3 text-xs text-text-muted">
          Wyszukaj lot na google.com/travel/flights → kliknij w lot → skopiuj URL z paska adresu
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParseUrl()}
            placeholder="https://www.google.com/travel/flights/booking?tfs=..."
            className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent sm:flex-1"
          />
          <button
            onClick={handleParseUrl}
            disabled={!url.trim() || isLoading}
            className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
          >
            {isLoading ? 'Analizuje...' : 'Analizuj'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-dim bg-red-dim/10 px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      {warning && (
        <div className="rounded-lg border border-yellow/30 bg-yellow/5 px-4 py-3 text-sm text-yellow">
          {warning}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-dim bg-green-dim/10 px-4 py-3 text-sm text-green">
          Lot dodany do sledzenia! Przekierowuje...
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {/* Parsed info */}
      {parsedData && !isLoading && (
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-lg font-bold text-accent">{parsedData.origin}</span>
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-mono text-lg font-bold text-accent">{parsedData.destination}</span>
            <span className="text-text-muted">|</span>
            <span className="text-text-secondary">{parsedData.date}</span>
            <span className="text-text-muted">|</span>
            <span className="text-text-secondary">{parsedData.airlineName}</span>
            {parsedData.flightNumber && (
              <>
                <span className="text-text-muted">|</span>
                <span className="font-mono text-xs text-accent">{parsedData.flightNumber}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Flight selection */}
      {flights && flights.length > 0 && !success && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {flights.length === 1 ? 'Znaleziony lot' : 'Wybierz lot do sledzenia'}
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Cena moze sie nieznacznie roznic od Google Flights — pobieramy ja bezposrednio od linii lotniczych.
              Sluzy do identyfikacji lotu, potem sledzenie odbywa sie przez Google Flights.
            </p>
          </div>

          {flights.map((flight) => (
            <div
              key={flight.id}
              className="rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-accent/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Airline */}
                  <div className="w-24">
                    <div className="text-sm font-medium text-text-primary">{flight.airline}</div>
                    {flight.flightNumber && (
                      <div className="font-mono text-xs text-text-muted">{flight.flightNumber}</div>
                    )}
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-semibold text-text-primary">
                      {formatTime(flight.departureTime)}
                    </span>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-text-muted">{formatDuration(flight.duration)}</span>
                      <div className="my-0.5 h-px w-16 bg-border" />
                      <span className="text-[10px] text-text-muted">
                        {flight.stops === 0 ? 'Bezposredni' : `${flight.stops} przesiadka`}
                      </span>
                    </div>
                    <span className="font-mono text-lg font-semibold text-text-primary">
                      {formatTime(flight.arrivalTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-xl font-bold text-text-primary">
                    {flight.price} <span className="text-sm text-text-muted">PLN</span>
                  </span>
                  <button
                    onClick={() => handleSelectFlight(flight)}
                    disabled={isAdding}
                    className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-dim disabled:opacity-40"
                  >
                    {isAdding ? 'Dodaje...' : 'Sledz ten lot'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {flights && flights.length === 0 && !success && (
        <div className="rounded-xl border border-border bg-bg-card py-8 text-center">
          <p className="text-sm text-text-muted">Nie znaleziono lotow. Sprawdz czy URL jest poprawny.</p>
        </div>
      )}
    </div>
  )
}
