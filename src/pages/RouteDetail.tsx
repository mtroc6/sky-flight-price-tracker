import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { useWatchlist } from '../hooks/useWatchlist'
import { CandlestickChart } from '../components/charts/CandlestickChart'
import { PriceLineChart } from '../components/charts/PriceLineChart'
import { PriceDisplay } from '../components/common/PriceDisplay'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { snapshotsToOHLC, snapshotsToPricePoints, filterByTimeRange, bestIntervalForRange } from '../lib/chart-transforms'
import { api } from '../lib/api-client'
import { useCurrency } from '../lib/CurrencyContext'
import { useQueryClient } from '@tanstack/react-query'
import type { TimeRange } from '../types/chart'

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

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

const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', 'ALL']
const rangeLabels: Record<TimeRange, string> = { '1D': '24h', '1W': '7d', '1M': '30d', '3M': '90d', 'ALL': 'Wszystko' }

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>()
  const routeId = Number(id)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { formatPrice } = useCurrency()
  const { data: routes } = useWatchlist()
  const { data: snapshots, isLoading } = usePriceHistory(routeId)

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
  const candleInterval = bestIntervalForRange(timeRange)
  const ohlcData = snapshotsToOHLC(filteredSnapshots, candleInterval)
  const lineData = snapshotsToPricePoints(filteredSnapshots)

  // Range change stats
  const rangeChange = (() => {
    if (filteredSnapshots.length < 2) return null
    const first = filteredSnapshots[0].priceCents
    const last = filteredSnapshots[filteredSnapshots.length - 1].priceCents
    const diff = last - first
    const pct = ((diff / first) * 100).toFixed(1)
    return { diff, pct, isDown: diff < 0 }
  })()

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
        <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-6">
          {/* Route + price row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xl font-bold text-accent sm:text-2xl">{route.originCode}</span>
                <span className="text-text-muted">&rarr;</span>
                <span className="font-mono text-xl font-bold text-accent sm:text-2xl">{route.destinationCode}</span>
                {route.flightNumber && (
                  <span className="rounded bg-blue/10 px-2 py-0.5 font-mono text-[10px] font-medium text-blue">
                    {route.flightNumber}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                {route.originName} &rarr; {route.destinationName}
              </p>
              <p className="mt-1.5 hidden text-xs text-text-muted sm:block">Wylot: <span className="font-mono text-sm font-semibold text-blue">{route.departureDate}</span></p>
            </div>

            {route.currentMinPrice != null && (
              <div className="flex items-center justify-between sm:block sm:text-right">
                {route.trackingUrl && (
                  <a
                    href={route.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent sm:hidden"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Google Flights
                  </a>
                )}
                <div className="text-right">
                  <PriceDisplay
                    price={route.currentMinPrice / 100}
                    previousPrice={route.price24hAgoCents ? route.price24hAgoCents / 100 : null}
                    size="lg"
                  />
                  <p className="text-xs text-text-muted">Aktualna cena</p>
                </div>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-text-muted sm:hidden">Wylot: <span className="font-mono text-sm font-semibold text-blue">{route.departureDate}</span></p>

          {/* Flight details */}
          {route.bestAirline && (
            <div className="mt-3">
              <div className="space-y-0.5 rounded-lg bg-bg-tertiary px-3 py-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{route.bestAirline}</span>
                  <span className="text-text-muted">
                    {route.bestStops === 0 ? 'Bezposredni' : `${route.bestStops} przesiadka`}
                  </span>
                </div>
                {route.bestDepartureTime && route.bestArrivalTime && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <span className="font-mono text-sm font-semibold text-blue">
                      {route.bestDepartureTime.split(' ')[1]?.slice(0, 5)} <span className="font-normal text-text-muted">&rarr;</span> {route.bestArrivalTime.split(' ')[1]?.slice(0, 5)}
                    </span>
                    {route.bestDuration != null && route.bestDuration > 0 && (
                      <span>
                        {Math.floor(route.bestDuration / 3600)}h {Math.floor((route.bestDuration % 3600) / 60)}m
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last update + refresh + Google Flights */}
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-xs text-text-muted">
              {route.lastChecked ? `Aktualizacja: ${lastCheckedAgo}` : 'Brak danych'}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={!canRefresh || isRefreshing}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRefreshing ? 'Odswiezam...' : 'Odswiez'}
                </button>
                {!canRefresh && remainingText && (
                  <span className="text-xs text-text-muted">{remainingText}</span>
                )}
                <span className="text-[10px] text-text-muted">Auto: ~1h (7-22), ~3h (noc)</span>
              </div>
              {route.trackingUrl && (
                <a
                  href={route.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent sm:flex"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Google Flights
                </a>
              )}
            </div>
          </div>
          {refreshError && (
            <div className="mt-2 rounded-lg bg-red-dim/10 px-3 py-2 text-xs text-red">{refreshError}</div>
          )}
        </div>
      )}

      {/* Chart controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-1 rounded-lg bg-bg-secondary p-1 sm:w-auto">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 rounded-md px-3 py-1 text-center font-mono text-xs font-medium transition-colors sm:flex-none ${
                timeRange === range
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>

        {rangeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Zmiana {rangeLabels[timeRange]}:</span>
            <span className={`font-mono text-sm font-bold ${rangeChange.isDown ? 'text-green' : 'text-red'}`}>
              {rangeChange.isDown ? '' : '+'}{formatPrice(rangeChange.diff)} ({rangeChange.isDown ? '' : '+'}{rangeChange.pct}%)
            </span>
          </div>
        )}
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Charts — candles on top, line below */}
      {!isLoading && <CandlestickChart data={ohlcData} showTime={candleInterval === 'hourly'} />}
      {!isLoading && <PriceLineChart data={lineData} />}

      {/* Stats */}
      {filteredSnapshots.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatBox
            label="Minimum"
            value={formatPrice(Math.min(...filteredSnapshots.map((s) => s.priceCents)))}
            type="green"
          />
          <StatBox
            label="Maksimum"
            value={formatPrice(Math.max(...filteredSnapshots.map((s) => s.priceCents)))}
            type="red"
          />
          <StatBox
            label="Srednia"
            value={formatPrice(Math.round(filteredSnapshots.reduce((s, x) => s + x.priceCents, 0) / filteredSnapshots.length))}
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
                        {formatPrice(snap.priceCents)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {change !== 0 && (
                          <span className={change < 0 ? 'text-green' : 'text-red'}>
                            {change > 0 ? '+' : ''}{formatPrice(Math.abs(change))}
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
