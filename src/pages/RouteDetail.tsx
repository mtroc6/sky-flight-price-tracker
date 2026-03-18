import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { useWatchlist } from '../hooks/useWatchlist'
import { CandlestickChart } from '../components/charts/CandlestickChart'
import { PriceLineChart } from '../components/charts/PriceLineChart'
import { PriceDisplay } from '../components/common/PriceDisplay'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { snapshotsToOHLC, snapshotsToPricePoints, shouldUseDailyCandles, filterByTimeRange } from '../lib/chart-transforms'
import { api } from '../lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import type { TimeRange } from '../types/chart'

const REFRESH_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

function useTimeAgo(date: string | null) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!date) { setText(''); return }

    function update() {
      const diff = Date.now() - new Date(date!).getTime()
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(mins / 60)
      const days = Math.floor(hours / 24)

      if (mins < 1) setText('przed chwila')
      else if (mins < 60) setText(`${mins} min temu`)
      else if (hours < 24) setText(`${hours}h ${mins % 60}min temu`)
      else setText(`${days}d ${hours % 24}h temu`)
    }

    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [date])

  return text
}

function useRefreshCooldown(lastChecked: string | null) {
  const [canRefresh, setCanRefresh] = useState(false)
  const [remainingText, setRemainingText] = useState('')

  useEffect(() => {
    function update() {
      if (!lastChecked) { setCanRefresh(true); setRemainingText(''); return }

      const elapsed = Date.now() - new Date(lastChecked).getTime()
      const remaining = REFRESH_COOLDOWN_MS - elapsed

      if (remaining <= 0) {
        setCanRefresh(true)
        setRemainingText('')
      } else {
        setCanRefresh(false)
        const mins = Math.ceil(remaining / 60000)
        setRemainingText(`za ${mins} min`)
      }
    }

    update()
    const interval = setInterval(update, 15000)
    return () => clearInterval(interval)
  }, [lastChecked])

  return { canRefresh, remainingText }
}

const timeRanges: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL']

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>()
  const routeId = Number(id)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: routes } = useWatchlist()
  const { data: snapshots, isLoading } = usePriceHistory(routeId, timeRange)

  const route = routes?.find((r) => r.id === routeId)
  const lastCheckedAgo = useTimeAgo(route?.lastChecked ?? null)
  const { canRefresh, remainingText } = useRefreshCooldown(route?.lastChecked ?? null)

  const handleRefresh = useCallback(async () => {
    if (!canRefresh || isRefreshing) return
    setIsRefreshing(true)
    setRefreshError(null)
    try {
      await api.prices.refresh(routeId)
      queryClient.invalidateQueries({ queryKey: ['prices'] })
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    } catch (err) {
      setRefreshError((err as Error).message)
    } finally {
      setIsRefreshing(false)
    }
  }, [canRefresh, isRefreshing, routeId, queryClient])

  const filteredSnapshots = snapshots ? filterByTimeRange(snapshots, timeRange) : []
  const useDaily = shouldUseDailyCandles(filteredSnapshots)
  const ohlcData = snapshotsToOHLC(filteredSnapshots, useDaily)
  const lineData = snapshotsToPricePoints(filteredSnapshots)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/watchlist" className="text-text-secondary hover:text-text-primary">
          Obserwowane
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary">
          {route ? `${route.originCode} → ${route.destinationCode}` : `Trasa #${id}`}
        </span>
      </div>

      {/* Route header */}
      {route && (
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold text-accent">{route.originCode}</span>
                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="font-mono text-2xl font-bold text-accent">{route.destinationCode}</span>
                {route.flightNumber && (
                  <span className="rounded bg-blue/10 px-2 py-0.5 text-xs font-mono font-medium text-blue">
                    {route.flightNumber}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {route.originName} &rarr; {route.destinationName}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-text-muted">
                <span>Wylot: {route.departureDate}</span>
              </div>
              {route.bestAirline && (
                <div className="mt-3 flex items-center gap-4 rounded-lg bg-bg-tertiary px-3 py-2 text-sm">
                  <span className="font-medium text-text-primary">{route.bestAirline}</span>
                  {route.bestDepartureTime && route.bestArrivalTime && (
                    <span className="font-mono text-text-secondary">
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
                  <span className={route.bestStops === 0 ? 'text-green' : 'text-text-muted'}>
                    {route.bestStops === 0 ? 'Bezposredni' : `${route.bestStops} przesiadka`}
                  </span>
                </div>
              )}
            </div>

            <div className="text-right">
              {route.currentMinPrice != null && (
                <>
                  <PriceDisplay
                    price={route.currentMinPrice / 100}
                    previousPrice={route.previousMinPrice ? route.previousMinPrice / 100 : null}
                    size="lg"
                  />
                  <p className="mt-1 text-xs text-text-muted">Aktualna najnizsza cena</p>
                </>
              )}
            </div>
          </div>

          {/* Last update + refresh */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {route.lastChecked ? (
                <span>Ostatnia aktualizacja: <span className="text-text-secondary">{lastCheckedAgo}</span></span>
              ) : (
                <span>Brak danych cenowych</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!canRefresh && remainingText && (
                <span className="text-xs text-text-muted">Nastepne odswiezenie {remainingText}</span>
              )}
              <button
                onClick={handleRefresh}
                disabled={!canRefresh || isRefreshing}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-secondary"
              >
                <svg
                  className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Odswiezam...' : 'Odswiez cene'}
              </button>
            </div>
          </div>
          {refreshError && (
            <div className="mt-2 rounded-lg bg-red-dim/10 px-3 py-2 text-xs text-red">
              {refreshError}
            </div>
          )}
        </div>
      )}

      {/* Chart controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1 font-mono text-xs font-medium transition-colors ${
                timeRange === range
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
          <button
            onClick={() => setChartType('candle')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              chartType === 'candle' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Swiece
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              chartType === 'line' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Liniowy
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Charts */}
      {!isLoading && chartType === 'candle' && <CandlestickChart data={ohlcData} />}
      {!isLoading && chartType === 'line' && <PriceLineChart data={lineData} />}

      {/* Stats */}
      {filteredSnapshots.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatBox
            label="Minimum"
            value={`${(Math.min(...filteredSnapshots.map((s) => s.priceCents)) / 100).toLocaleString('pl-PL')} PLN`}
            type="green"
          />
          <StatBox
            label="Maksimum"
            value={`${(Math.max(...filteredSnapshots.map((s) => s.priceCents)) / 100).toLocaleString('pl-PL')} PLN`}
            type="red"
          />
          <StatBox
            label="Srednia"
            value={`${(filteredSnapshots.reduce((s, x) => s + x.priceCents, 0) / filteredSnapshots.length / 100).toLocaleString('pl-PL', { maximumFractionDigits: 0 })} PLN`}
          />
          <StatBox
            label="Punkty danych"
            value={String(filteredSnapshots.length)}
          />
        </div>
      )}

      {/* Price history table */}
      {filteredSnapshots.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Historia cen</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-card">
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="px-4 py-2 text-left font-medium">Data</th>
                  <th className="px-4 py-2 text-left font-medium">Cena</th>
                  <th className="px-4 py-2 text-left font-medium">Zmiana</th>
                  <th className="px-4 py-2 text-left font-medium">Linia</th>
                  <th className="px-4 py-2 text-left font-medium">Przesiadki</th>
                  <th className="px-4 py-2 text-left font-medium">Zrodlo</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredSnapshots].reverse().map((snap, i, arr) => {
                  const prevSnap = arr[i + 1]
                  const change = prevSnap ? snap.priceCents - prevSnap.priceCents : 0
                  return (
                    <tr key={snap.id} className="border-b border-border/30 hover:bg-bg-tertiary/50">
                      <td className="px-4 py-2 font-mono text-xs text-text-secondary">
                        {new Date(snap.fetchedAt).toLocaleString('pl-PL', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2 font-mono font-semibold text-text-primary">
                        {(snap.priceCents / 100).toLocaleString('pl-PL')} PLN
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {change !== 0 && (
                          <span className={change < 0 ? 'text-green' : 'text-red'}>
                            {change > 0 ? '+' : ''}{(change / 100).toLocaleString('pl-PL')} PLN
                          </span>
                        )}
                        {change === 0 && i < arr.length - 1 && (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-text-secondary">{snap.airline || '—'}</td>
                      <td className="px-4 py-2 text-xs text-text-muted">
                        {snap.stops === 0 ? 'Bezposredni' : `${snap.stops}`}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          snap.source === 'serpapi' ? 'bg-blue/10 text-blue' :
                          snap.source === 'google' ? 'bg-accent/10 text-accent' :
                          'bg-text-muted/10 text-text-muted'
                        }`}>
                          {snap.source === 'serpapi' ? 'SerpApi' : snap.source === 'google' ? 'Scraper' : snap.source}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, type }: { label: string; value: string; type?: 'green' | 'red' }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-lg font-bold ${
          type === 'green' ? 'text-green' : type === 'red' ? 'text-red' : 'text-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
