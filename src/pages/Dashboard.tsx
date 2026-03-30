import { Link } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'
import { useCurrency } from '../lib/CurrencyContext'

function useApiUsage() {
  return useQuery({
    queryKey: ['api-usage'],
    queryFn: async () => {
      const res = await fetch('/api/account/usage')
      const json = await res.json()
      return json.data as { used: number; limit: number; left: number } | null
    },
    staleTime: 5 * 60 * 1000,
  })
}

export default function Dashboard() {
  const { data: routes, isLoading } = useWatchlist()
  const { data: usage } = useApiUsage()
  const { formatPrice } = useCurrency()

  const activeRoutes = routes?.filter((r) => r.isActive) || []

  // Find most recent lastChecked across all routes
  const lastCheckedDates = activeRoutes
    .filter((r) => r.lastChecked)
    .map((r) => new Date(r.lastChecked!))
    .sort((a, b) => b.getTime() - a.getTime())
  const lastChecked = lastCheckedDates[0] || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Przegladaj swoje obserwowane trasy</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Obserwowanych lotow" value={String(activeRoutes.length)} accent />

        {/* Last check - time big, date below */}
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <p className="text-xs font-medium text-text-muted">Ostatnie sprawdzenie</p>
          {lastChecked ? (
            <div className="mt-1">
              <p className="font-mono text-2xl font-bold text-text-primary">
                {lastChecked.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-text-muted">
                {lastChecked.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          ) : (
            <p className="mt-1 font-mono text-2xl font-bold text-text-primary">-</p>
          )}
        </div>

        {/* SerpApi usage */}
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <p className="text-xs font-medium text-text-muted">SerpApi (reczne odswiezanie)</p>
          {usage ? (
            <div className="mt-1">
              <p className="font-mono text-2xl font-bold text-text-primary">
                {usage.left} <span className="text-sm text-text-muted">/ {usage.limit}</span>
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-bg-tertiary">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all"
                  style={{ width: `${Math.max(2, (usage.left / usage.limit) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-text-muted">Pozostalo zapytan w tym miesiacu</p>
            </div>
          ) : (
            <p className="mt-1 font-mono text-2xl font-bold text-text-muted">-</p>
          )}
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Routes overview */}
      {!isLoading && activeRoutes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-bg-card py-12">
          <div className="text-4xl">✈</div>
          <p className="text-sm text-text-muted">Brak obserwowanych lotow. Dodaj pierwszy lot ponizej.</p>
        </div>
      )}

      {!isLoading && activeRoutes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Ostatnio dodane trasy</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRoutes.slice(0, 3).map((route) => (
              <Link
                key={route.id}
                to={`/route/${route.id}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-border-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-accent">{route.originCode}</span>
                    <span className="text-text-muted">&rarr;</span>
                    <span className="font-mono text-sm font-bold text-accent">{route.destinationCode}</span>
                    {route.flightNumber && (
                      <span className="font-mono text-[10px] text-text-muted">{route.flightNumber}</span>
                    )}
                  </div>
                  {route.currentMinPrice != null && (
                    <span className="font-mono text-sm font-semibold text-text-primary">
                      {formatPrice(route.currentMinPrice)}
                    </span>
                  )}
                </div>

                <div className="text-xs text-text-muted">
                  {route.departureDate}
                  {route.bestAirline && <span className="ml-2 text-text-secondary">{route.bestAirline}</span>}
                </div>

                {route.currentMinPrice != null && route.price24hAgoCents != null && route.currentMinPrice !== route.price24hAgoCents && (
                  <PriceChange current={route.currentMinPrice} previous={route.price24hAgoCents} />
                )}
              </Link>
            ))}
          </div>
          {activeRoutes.length > 3 && (
            <div className="flex justify-center">
              <Link
                to="/watchlist"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
              >
                Pokaz wiecej ({activeRoutes.length - 3})
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tutorial */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Jak dodac lot do sledzenia?</h2>
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TutorialStep num={1} title="Wyszukaj lot" desc="Wejdz na google.com/travel/flights" />
            <TutorialStep num={2} title="Kliknij w lot" desc="Otworzy sie strona rezerwacji" />
            <TutorialStep num={3} title="Skopiuj URL" desc="Skopiuj adres z paska przegladarki" />
            <TutorialStep num={4} title="Wklej tutaj" desc="Cena sprawdzana co godzine automatycznie" />
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              to="/add"
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
            >
              Dodaj lot
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function TutorialStep({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-bold text-accent">{num}</div>
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted">{desc}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  )
}

function PriceChange({ current, previous }: { current: number; previous: number }) {
  const { formatPrice } = useCurrency()
  const diff = current - previous
  const pct = ((diff / previous) * 100).toFixed(1)
  const isDown = diff < 0
  return (
    <span className={`font-mono text-xs font-medium ${isDown ? 'text-green' : 'text-red'}`}>
      {isDown ? '-' : '+'}{formatPrice(Math.abs(diff))} ({isDown ? '' : '+'}{pct}%)
    </span>
  )
}
