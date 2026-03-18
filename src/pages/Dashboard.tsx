import { Link } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export default function Dashboard() {
  const { data: routes, isLoading } = useWatchlist()

  const activeRoutes = routes?.filter((r) => r.isActive) || []
  const cheapest = activeRoutes
    .filter((r) => r.currentMinPrice != null)
    .sort((a, b) => a.currentMinPrice! - b.currentMinPrice!)
  const dropping = activeRoutes.filter(
    (r) => r.currentMinPrice != null && r.previousMinPrice != null && r.currentMinPrice < r.previousMinPrice,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Przegladaj swoje obserwowane trasy</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Obserwowanych tras" value={String(activeRoutes.length)} accent />
        <StatCard
          label="Najtansza trasa"
          value={cheapest[0] ? `${(cheapest[0].currentMinPrice! / 100).toLocaleString('pl-PL')} PLN` : '-'}
          sub={cheapest[0] ? `${cheapest[0].originCode} → ${cheapest[0].destinationCode}` : undefined}
        />
        <StatCard label="Spadki cen" value={String(dropping.length)} positive={dropping.length > 0} />
        <StatCard
          label="Ostatnie sprawdzenie"
          value={activeRoutes[0]?.lastChecked
            ? new Date(activeRoutes[0].lastChecked).toLocaleDateString('pl-PL')
            : 'Nigdy'}
        />
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Routes overview */}
      {!isLoading && activeRoutes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-card py-16">
          <div className="text-5xl">✈</div>
          <h2 className="text-lg font-semibold text-text-primary">Brak obserwowanych tras</h2>
          <p className="text-sm text-text-secondary">Dodaj pierwsza trase, zeby zaczac sledzic ceny</p>
          <Link
            to="/search"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
          >
            Szukaj lotow
          </Link>
        </div>
      )}

      {!isLoading && activeRoutes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Obserwowane trasy</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRoutes.map((route) => (
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
                  </div>
                  {route.currentMinPrice != null && (
                    <span className="font-mono text-sm font-semibold text-text-primary">
                      {(route.currentMinPrice / 100).toLocaleString('pl-PL')} zl
                    </span>
                  )}
                </div>

                <div className="text-xs text-text-muted">
                  {route.departureDate}
                  {route.returnDate && ` → ${route.returnDate}`}
                </div>

                {route.currentMinPrice != null && route.previousMinPrice != null && (
                  <div className="flex items-center justify-between">
                    <PriceChange current={route.currentMinPrice} previous={route.previousMinPrice} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, accent, positive }: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  positive?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${accent ? 'text-accent' : positive ? 'text-green' : 'text-text-primary'}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-text-secondary">{sub}</p>}
    </div>
  )
}

function PriceChange({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  const pct = ((diff / previous) * 100).toFixed(1)
  const isDown = diff < 0
  return (
    <span className={`font-mono text-xs font-medium ${isDown ? 'text-green' : 'text-red'}`}>
      {isDown ? '' : '+'}{(diff / 100).toLocaleString('pl-PL')} zl ({isDown ? '' : '+'}{pct}%)
    </span>
  )
}
