import type { FlightSearchResult } from '../../types/flight'
import { PriceDisplay } from '../common/PriceDisplay'

interface FlightResultCardProps {
  flight: FlightSearchResult
  onAddToWatchlist?: () => void
}

function formatTime(timeStr: string): string {
  // SerpApi returns "2026-04-13 14:25" format
  const timePart = timeStr.split(' ')[1]
  if (timePart) return timePart.slice(0, 5)
  // Fallback for ISO format
  try {
    return new Date(timeStr).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return timeStr
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export function FlightResultCard({ flight, onAddToWatchlist }: FlightResultCardProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-border-hover">
      <div className="flex items-start justify-between gap-4">
        {/* Flight info */}
        <div className="flex-1">
          {/* Outbound */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-lg font-semibold text-text-primary">
                {formatTime(flight.departureTime)}
              </div>
              <div className="text-xs text-text-muted">{flight.origin}</div>
            </div>

            <div className="flex flex-1 flex-col items-center">
              <div className="text-[10px] text-text-muted">{formatDuration(flight.duration)}</div>
              <div className="relative my-1 h-px w-full bg-border">
                {flight.stops > 0 && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-2 w-2 rounded-full border border-yellow bg-bg-card" />
                  </div>
                )}
              </div>
              <div className="text-[10px] text-text-muted">
                {flight.stops === 0 ? 'Bezposredni' : `${flight.stops} przesiadka`}
              </div>
            </div>

            <div>
              <div className="font-mono text-lg font-semibold text-text-primary">
                {formatTime(flight.arrivalTime)}
              </div>
              <div className="text-xs text-text-muted">{flight.destination}</div>
            </div>
          </div>

          {/* Airline & flight number */}
          <div className="mt-2 text-xs text-text-secondary">
            {flight.airline}
            {flight.flightNumber && (
              <span className="ml-2 font-mono text-text-muted">{flight.flightNumber}</span>
            )}
          </div>
        </div>

        {/* Price + Actions */}
        <div className="flex flex-col items-end gap-2">
          <PriceDisplay price={flight.price} currency={flight.priceCurrency} />

          {onAddToWatchlist && (
            <button
              onClick={onAddToWatchlist}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-dim"
            >
              Obserwuj
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
