import { Link } from 'react-router-dom'
import { useWatchlist, useDeleteFromWatchlist, useUpdateWatchlist } from '../hooks/useWatchlist'
import { RouteCard } from '../components/watchlist/RouteCard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export default function Watchlist() {
  const { data: routes, isLoading } = useWatchlist()
  const deleteRoute = useDeleteFromWatchlist()
  const updateRoute = useUpdateWatchlist()

  const handleDelete = (id: number) => {
    if (confirm('Na pewno chcesz usunac te trase?')) {
      deleteRoute.mutate(id)
    }
  }

  const handleToggle = (id: number, isActive: boolean) => {
    updateRoute.mutate({ id, isActive })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Obserwowane trasy</h1>
          <p className="text-sm text-text-secondary">
            {routes?.length || 0} tras w obserwowanych
          </p>
        </div>
        <Link
          to="/search"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
        >
          + Dodaj trase
        </Link>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && routes && routes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-card py-16">
          <div className="text-5xl">👀</div>
          <h2 className="text-lg font-semibold text-text-primary">Lista jest pusta</h2>
          <p className="text-sm text-text-secondary">Wyszukaj loty i dodaj trasy do obserwowanych</p>
          <Link
            to="/search"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
          >
            Szukaj lotow
          </Link>
        </div>
      )}

      {routes && routes.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
