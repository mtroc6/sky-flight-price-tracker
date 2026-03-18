import type { FlightSearchResult } from '../../types/flight'
import { PriceDisplay } from '../common/PriceDisplay'

interface FlightResultCardProps {
  flight: FlightSearchResult
  onAddToWatchlist?: () => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
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

          {/* Return */}
          {flight.returnDepartureTime && (
            <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
              <div className="text-right">
                <div className="font-mono text-sm text-text-primary">
                  {formatTime(flight.returnDepartureTime)}
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div className="relative my-1 h-px w-full bg-border" />
                <div className="text-[10px] text-text-muted">
                  {flight.returnStops === 0 ? 'Bezposredni' : `${flight.returnStops} przesiadka`}
                </div>
              </div>
              <div>
                <div className="font-mono text-sm text-text-primary">
                  {formatTime(flight.returnArrivalTime!)}
                </div>
              </div>
            </div>
          )}

          {/* Airline */}
          <div className="mt-2 text-xs text-text-secondary">{flight.airline}</div>
        </div>

        {/* Price + Actions */}
        <div className="flex flex-col items-end gap-2">
          <PriceDisplay price={flight.price} currency={flight.priceCurrency} />

          <div className="flex gap-2">
            {onAddToWatchlist && (
              <button
                onClick={onAddToWatchlist}
                className="rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
              >
                Obserwuj
              </button>
            )}
            <a
              href={flight.bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-dim"
            >
              Rezerwuj
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
