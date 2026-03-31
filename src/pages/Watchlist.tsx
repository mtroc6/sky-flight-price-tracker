import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWatchlist, useDeleteFromWatchlist, useUpdateWatchlist } from '../hooks/useWatchlist'
import { RouteCard } from '../components/watchlist/RouteCard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { api } from '../lib/api-client'

interface GroupInfo {
  name: string
  ntfyTopic: string | null
}

function useGroupOrder() {
  const queryClient = useQueryClient()
  const { data: groups } = useQuery({
    queryKey: ['group-order'],
    queryFn: async () => {
      const res = await api.groups.list()
      return res.data as GroupInfo[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: (order: string[]) => api.groups.saveOrder(order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-order'] }),
  })

  const topicMutation = useMutation({
    mutationFn: ({ name, ntfyTopic }: { name: string; ntfyTopic: string | null }) =>
      api.groups.setNotifications(name, ntfyTopic),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-order'] }),
  })

  const groupOrder = (groups || []).map(g => g.name)
  const groupTopics = new Map((groups || []).map(g => [g.name, g.ntfyTopic]))

  return {
    groupOrder,
    groupTopics,
    saveGroupOrder: (order: string[]) => saveMutation.mutate(order),
    setNtfyTopic: (name: string, ntfyTopic: string | null) => topicMutation.mutate({ name, ntfyTopic }),
  }
}

function GroupMenu({ groupName, index, total, onRename, onMove }: {
  groupName: string
  index: number
  total: number
  onRename: (oldName: string) => void
  onMove: (name: string, direction: 'up' | 'down') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
        title="Edytuj grupe"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 w-44 rounded-lg border border-border bg-bg-card py-1 shadow-lg">
          <button
            onClick={() => { setOpen(false); onRename(groupName) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Zmien nazwe
          </button>
          {index > 0 && (
            <button
              onClick={() => { setOpen(false); onMove(groupName, 'up') }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Przesun w gore
            </button>
          )}
          {index < total - 1 && (
            <button
              onClick={() => { setOpen(false); onMove(groupName, 'down') }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              Przesun w dol
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NtfyBell({ groupName, topic, onEnable, onDisable }: {
  groupName: string
  topic: string | null
  onEnable: (topic: string) => void
  onDisable: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleEnable = () => {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
    const safeName = groupName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const newTopic = `sky-${safeName}-${id}`
    onEnable(newTopic)
  }

  const subscribeUrl = topic ? `https://ntfy.sh/${topic}` : ''
  const qrUrl = topic
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=0d1117&color=e6edf3&data=${encodeURIComponent(subscribeUrl)}`
    : ''

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`rounded p-1 transition-colors ${
          topic
            ? 'text-accent hover:bg-accent/10'
            : 'text-text-muted hover:bg-bg-tertiary hover:text-text-primary'
        }`}
        title={topic ? 'Powiadomienia wlaczone' : 'Wlacz powiadomienia'}
      >
        <svg className="h-4 w-4" fill={topic ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={topic ? 0 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-xl border border-border bg-bg-card p-4 shadow-xl">
          {!topic ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm font-medium text-text-primary">Powiadomienia</span>
              </div>
              <p className="text-xs text-text-muted">
                Otrzymuj powiadomienia push na telefon gdy cena lotu w tej grupie spadnie lub wzrosnie.
              </p>
              <button
                onClick={handleEnable}
                className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
              >
                Wlacz powiadomienia
              </button>
              <p className="text-[10px] text-text-muted">
                Wymaga aplikacji <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ntfy</a> (Android / iOS)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-sm font-medium text-text-primary">Aktywne</span>
                </div>
                <button
                  onClick={() => { onDisable(); setOpen(false) }}
                  className="text-xs text-text-muted hover:text-red"
                >
                  Wylacz
                </button>
              </div>

              <div className="flex justify-center rounded-lg bg-bg-tertiary p-3">
                <img
                  src={qrUrl}
                  alt="QR kod subskrypcji ntfy"
                  width={180}
                  height={180}
                  className="rounded"
                />
              </div>

              <p className="text-center text-xs text-text-muted">
                Zeskanuj w aplikacji ntfy
              </p>

              <a
                href={subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Otworz w przegladarce
              </a>

              <div className="rounded-lg bg-bg-tertiary px-3 py-2">
                <p className="text-[10px] text-text-muted">Temat ntfy:</p>
                <p className="select-all font-mono text-xs text-text-secondary">{topic}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Watchlist() {
  const { data: routes, isLoading } = useWatchlist()
  const deleteRoute = useDeleteFromWatchlist()
  const updateRoute = useUpdateWatchlist()
  const { groupOrder, groupTopics, saveGroupOrder, setNtfyTopic } = useGroupOrder()

  const handleDelete = (id: number) => {
    if (confirm('Na pewno chcesz usunac ten lot?')) {
      deleteRoute.mutate(id)
    }
  }

  const handleGroupChange = (id: number, group: string | null) => {
    updateRoute.mutate({ id, group })
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

  // Sort groups: use saved order first, then alphabetical for any new groups
  const allGroups = [...grouped.keys()]
  const orderedGroups = groupOrder.filter((g) => allGroups.includes(g))
  const newGroups = allGroups.filter((g) => !orderedGroups.includes(g)).sort()
  const groupNames = [...orderedGroups, ...newGroups]

  const handleMoveGroup = (name: string, direction: 'up' | 'down') => {
    const idx = groupNames.indexOf(name)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= groupNames.length) return
    const newOrder = [...groupNames]
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    saveGroupOrder(newOrder)
  }

  const handleRenameGroup = (oldName: string) => {
    const newName = prompt('Nowa nazwa grupy:', oldName)
    if (!newName?.trim() || newName.trim() === oldName) return
    const trimmed = newName.trim()
    // Update all routes in this group
    const groupRoutes = grouped.get(oldName) || []
    for (const route of groupRoutes) {
      updateRoute.mutate({ id: route.id, group: trimmed })
    }
    // Update saved order
    const newOrder = groupNames.map((g) => g === oldName ? trimmed : g)
    saveGroupOrder(newOrder)
  }

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
            <NtfyBell
              groupName={groupName}
              topic={groupTopics.get(groupName) ?? null}
              onEnable={(topic) => setNtfyTopic(groupName, topic)}
              onDisable={() => setNtfyTopic(groupName, null)}
            />
            <GroupMenu
              groupName={groupName}
              index={groupNames.indexOf(groupName)}
              total={groupNames.length}
              onRename={handleRenameGroup}
              onMove={handleMoveGroup}
            />
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {grouped.get(groupName)!.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                groups={groupNames}
                onDelete={handleDelete}

                onGroupChange={handleGroupChange}
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
                groups={groupNames}
                onDelete={handleDelete}

                onGroupChange={handleGroupChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
