import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { useWatchlist } from '../hooks/useWatchlist'
import { CandlestickChart } from '../components/charts/CandlestickChart'
import { PriceLineChart } from '../components/charts/PriceLineChart'
import { PriceDisplay } from '../components/common/PriceDisplay'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { snapshotsToOHLC, snapshotsToPricePoints, shouldUseDailyCandles, filterByTimeRange } from '../lib/chart-transforms'
import type { TimeRange } from '../types/chart'

const timeRanges: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL']

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>()
  const routeId = Number(id)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle')

  const { data: routes } = useWatchlist()
  const { data: snapshots, isLoading } = usePriceHistory(routeId, timeRange)

  const route = routes?.find((r) => r.id === routeId)

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
                {route.isRoundTrip && (
                  <span className="rounded bg-blue/10 px-2 py-0.5 text-xs font-medium text-blue">
                    W obie strony
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {route.originName} &rarr; {route.destinationName}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-text-muted">
                <span>Wylot: {route.departureDate}</span>
                {route.returnDate && <span>Powrot: {route.returnDate}</span>}
                <span>Klasa: {route.cabinClass}</span>
                {route.flexDays > 0 && <span>&plusmn;{route.flexDays} dni</span>}
              </div>
            </div>

            {route.currentMinPrice != null && (
              <div className="text-right">
                <PriceDisplay
                  price={route.currentMinPrice / 100}
                  previousPrice={route.previousMinPrice ? route.previousMinPrice / 100 : null}
                  size="lg"
                />
                <p className="mt-1 text-xs text-text-muted">Aktualna najnizsza cena</p>
              </div>
            )}
          </div>
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
