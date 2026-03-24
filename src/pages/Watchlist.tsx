import { Link } from 'react-router-dom'
import { useWatchlist, useDeleteFromWatchlist, useUpdateWatchlist } from '../hooks/useWatchlist'
import { RouteCard } from '../components/watchlist/RouteCard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export default function Watchlist() {
  const { data: routes, isLoading } = useWatchlist()
  const deleteRoute = useDeleteFromWatchlist()
  const updateRoute = useUpdateWatchlist()

  const handleDelete = (id: number) => {
    if (confirm('Na pewno chcesz usunac ten lot?')) {
      deleteRoute.mutate(id)
    }
  }

  const handleToggle = (id: number, isActive: boolean) => {
    updateRoute.mutate({ id, isActive })
  }

  // Group routes
  const grouped = new Map<string, typeof routes>()
  const ungrouped: typeof routes = []

  if (routes) {
    for (const route of routes) {
      if (route.group) {
        const existing = grouped.get(route.group) || []
        existing.push(route)
        grouped.set(route.group, existing)
      } else {
        ungrouped.push(route)
      }
    }
  }

  const groupNames = [...grouped.keys()].sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Obserwowane loty</h1>
          <p className="text-sm text-text-secondary">
            {routes?.length || 0} lotow
          </p>
        </div>
        <Link
          to="/add"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
        >
          + Dodaj lot
        </Link>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && routes && routes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-card py-16">
          <div className="text-5xl">✈</div>
          <h2 className="text-lg font-semibold text-text-primary">Lista jest pusta</h2>
          <p className="text-sm text-text-secondary">Wklej link z Google Flights by zaczac sledzic ceny</p>
          <Link
            to="/add"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
          >
            Dodaj lot
          </Link>
        </div>
      )}

      {/* Grouped routes */}
      {groupNames.map((groupName) => (
        <div key={groupName} className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {groupName}
            <span className="text-sm font-normal text-text-muted">({grouped.get(groupName)?.length})</span>
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {grouped.get(groupName)!.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Ungrouped routes */}
      {ungrouped.length > 0 && (
        <div className="space-y-3">
          {groupNames.length > 0 && (
            <h2 className="text-lg font-semibold text-text-muted">Bez grupy</h2>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {ungrouped.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
