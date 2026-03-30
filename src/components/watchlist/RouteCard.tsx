import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import type { WatchedRoute } from '../../types/flight'
import { PriceDisplay } from '../common/PriceDisplay'

interface RouteCardProps {
  route: WatchedRoute
  groups?: string[]
  onDelete?: (id: number) => void
  onGroupChange?: (id: number, group: string | null) => void
}

export function RouteCard({ route, groups = [], onDelete, onGroupChange }: RouteCardProps) {
  const departureDateTime = route.bestDepartureTime
    ? new Date(route.bestDepartureTime)
    : new Date(route.departureDate + 'T23:59:59')
  const isArchived = departureDateTime < new Date()

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
            {route.flightNumber && (
              <span className="rounded bg-blue/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-blue">
                {route.flightNumber}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            {route.originName} &rarr; {route.destinationName}
          </div>
          <div className="mt-2">
            <span className="font-mono text-sm font-semibold text-blue">{route.departureDate}</span>
          </div>
          {route.bestAirline && (
            <div className="mt-2 space-y-1 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="font-medium">{route.bestAirline}</span>
                <span className="text-text-muted">
                  {route.bestStops === 0 ? 'Bezposredni' : `${route.bestStops} przesiadka`}
                </span>
              </div>
              {route.bestDepartureTime && route.bestArrivalTime && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-blue">
                    {route.bestDepartureTime.split(' ')[1]?.slice(0, 5)} <span className="font-normal text-text-muted">&rarr;</span> {route.bestArrivalTime.split(' ')[1]?.slice(0, 5)}
                  </span>
                  {route.bestDuration != null && route.bestDuration > 0 && (
                    <span className="text-text-muted">
                      {Math.floor(route.bestDuration / 3600)}h {Math.floor((route.bestDuration % 3600) / 60)}m
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {route.currentMinPrice != null && (
            <PriceDisplay
              price={route.currentMinPrice / 100}
              previousPrice={route.price24hAgoCents ? route.price24hAgoCents / 100 : null}
              size="sm"
            />
          )}
          {!route.currentMinPrice && (
            <span className="text-xs text-text-muted">Brak danych</span>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div className="flex items-center gap-1.5">
          <div
            className={clsx(
              'h-2 w-2 flex-shrink-0 rounded-full',
              isArchived
                ? 'border border-green bg-transparent'
                : route.isActive ? 'bg-green' : 'bg-text-muted',
            )}
          />
          <span className="whitespace-nowrap text-[10px] leading-none text-text-muted">
            {isArchived
              ? 'Archiwalny'
              : route.lastChecked
                ? new Date(route.lastChecked).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Aktywna'}
          </span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          {onGroupChange && (
            <select
              value={route.group || ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '__new__') {
                  const name = prompt('Nazwa nowej grupy:')
                  if (name?.trim()) {
                    onGroupChange(route.id, name.trim())
                  } else {
                    e.target.value = route.group || ''
                  }
                } else {
                  onGroupChange(route.id, val || null)
                }
              }}
              className="rounded bg-bg-tertiary px-1.5 py-1 text-[10px] text-text-muted outline-none focus:border-accent"
              title="Zmien grupe"
            >
              <option value="">Bez grupy</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value="__new__">+ Nowa grupa</option>
            </select>
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
