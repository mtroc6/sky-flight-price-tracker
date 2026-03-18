import type { OHLCData, PricePoint, TimeRange, CandleInterval } from '../types/chart'
import type { PriceSnapshot } from '../types/flight'

function getGroupKey(dateStr: string, interval: CandleInterval): string {
  const d = new Date(dateStr)
  switch (interval) {
    case 'hourly':
      return `${d.toISOString().slice(0, 13)}:00:00Z`
    case 'daily':
      return `${d.toISOString().split('T')[0]}T00:00:00Z`
    case 'weekly': {
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d)
      monday.setDate(diff)
      return `${monday.toISOString().split('T')[0]}T00:00:00Z`
    }
    case 'monthly':
      return `${d.toISOString().slice(0, 7)}-01T00:00:00Z`
  }
}

function toUnix(isoStr: string): number {
  return Math.floor(new Date(isoStr).getTime() / 1000)
}

export function snapshotsToOHLC(snapshots: PriceSnapshot[], interval: CandleInterval): OHLCData[] {
  if (snapshots.length === 0) return []

  const priceInUnits = (cents: number) => cents / 100

  const grouped = new Map<string, number[]>()
  for (const s of snapshots) {
    const key = getGroupKey(s.fetchedAt, interval)
    const existing = grouped.get(key) || []
    existing.push(s.priceCents)
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, prices]) => ({
      time: toUnix(time),
      open: priceInUnits(prices[0]),
      high: priceInUnits(Math.max(...prices)),
      low: priceInUnits(Math.min(...prices)),
      close: priceInUnits(prices[prices.length - 1]),
    }))
}

export function snapshotsToPricePoints(snapshots: PriceSnapshot[]): PricePoint[] {
  return snapshots
    .sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt))
    .map((s) => ({
      time: toUnix(s.fetchedAt),
      price: s.priceCents / 100,
      airline: s.airline || undefined,
    }))
}

export function filterByTimeRange(snapshots: PriceSnapshot[], range: TimeRange): PriceSnapshot[] {
  if (range === 'ALL') return snapshots

  const now = new Date()
  const daysMap: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
  }

  const days = daysMap[range] || 30
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return snapshots.filter((s) => new Date(s.fetchedAt) >= cutoff)
}

export function bestIntervalForRange(range: TimeRange): CandleInterval {
  switch (range) {
    case '1D': return 'hourly'
    case '1W': return 'hourly'
    case '1M': return 'daily'
    case '3M': return 'weekly'
    case 'ALL': return 'weekly'
  }
}
