import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import type { WatchedRoute } from '../../types/flight'
import { PriceDisplay } from '../common/PriceDisplay'
import { SparklineChart } from '../charts/SparklineChart'

interface RouteCardProps {
  route: WatchedRoute
  onDelete?: (id: number) => void
  onToggle?: (id: number, active: boolean) => void
}

export function RouteCard({ route, onDelete, onToggle }: RouteCardProps) {
  const priceChange = route.currentMinPrice && route.previousMinPrice
    ? route.currentMinPrice - route.previousMinPrice
    : 0
  const isDown = priceChange < 0

  return (
    <Link
      to={`/route/${route.id}`}
      className="block rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-border-hover hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-accent">{route.originCode}</span>
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-mono text-lg font-bold text-accent">{route.destinationCode}</span>
            {route.isRoundTrip && (
              <span className="rounded bg-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-blue">
                W obie strony
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            {route.originName} &rarr; {route.destinationName}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
            <span>{route.departureDate}</span>
            {route.returnDate && <span>Powrot: {route.returnDate}</span>}
            {route.flexDays > 0 && <span>&plusmn;{route.flexDays} dni</span>}
          </div>
          {route.bestAirline && (
            <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
              <span className="font-medium">{route.bestAirline}</span>
              {route.bestDepartureTime && route.bestArrivalTime && (
                <span>
                  {route.bestDepartureTime.split(' ')[1]?.slice(0, 5) || route.bestDepartureTime}
                  {' → '}
                  {route.bestArrivalTime.split(' ')[1]?.slice(0, 5) || route.bestArrivalTime}
                </span>
              )}
              {route.bestDuration != null && route.bestDuration > 0 && (
                <span className="text-text-muted">
                  {Math.floor(route.bestDuration / 3600)}h {Math.floor((route.bestDuration % 3600) / 60)}m
                </span>
              )}
              <span className="text-text-muted">
                {route.bestStops === 0 ? 'Bezposredni' : `${route.bestStops} przesiadka`}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {route.currentMinPrice != null && (
            <PriceDisplay
              price={route.currentMinPrice / 100}
              previousPrice={route.previousMinPrice ? route.previousMinPrice / 100 : null}
              size="sm"
            />
          )}
          {!route.currentMinPrice && (
            <span className="text-xs text-text-muted">Brak danych</span>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'h-1.5 w-1.5 rounded-full',
              route.isActive ? 'bg-green' : 'bg-text-muted',
            )}
          />
          <span className="text-[10px] text-text-muted">
            {route.isActive ? 'Aktywna' : 'Wstrzymana'}
          </span>
          {route.lastChecked && (
            <span className="text-[10px] text-text-muted">
              Sprawdzono: {new Date(route.lastChecked).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
          {onToggle && (
            <button
              onClick={() => onToggle(route.id, !route.isActive)}
              className="rounded p-1 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
              title={route.isActive ? 'Wstrzymaj' : 'Wznow'}
            >
              {route.isActive ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              )}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(route.id)}
              className="rounded p-1 text-text-muted hover:bg-red/10 hover:text-red"
              title="Usun"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
