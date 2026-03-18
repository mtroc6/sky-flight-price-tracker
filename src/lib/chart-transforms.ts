import type { OHLCData, PricePoint, SparklineData, TimeRange } from '../types/chart'
import type { PriceSnapshot } from '../types/flight'

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export function snapshotsToOHLC(snapshots: PriceSnapshot[], useDaily: boolean = false): OHLCData[] {
  if (snapshots.length === 0) return []

  const priceInUnits = (cents: number) => cents / 100

  if (useDaily) {
    const byDay = new Map<string, number[]>()
    for (const s of snapshots) {
      const day = s.fetchedAt.split('T')[0]
      const existing = byDay.get(day) || []
      existing.push(s.priceCents)
      byDay.set(day, existing)
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, prices]) => ({
        time: day,
        open: priceInUnits(prices[0]),
        high: priceInUnits(Math.max(...prices)),
        low: priceInUnits(Math.min(...prices)),
        close: priceInUnits(prices[prices.length - 1]),
      }))
  }

  const byWeek = new Map<string, number[]>()
  for (const s of snapshots) {
    const week = getWeekStart(s.fetchedAt)
    const existing = byWeek.get(week) || []
    existing.push(s.priceCents)
    byWeek.set(week, existing)
  }

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, prices]) => ({
      time: week,
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
      time: s.fetchedAt.split('T')[0],
      price: s.priceCents / 100,
      airline: s.airline || undefined,
    }))
}

export function snapshotsToSparkline(snapshots: PriceSnapshot[], limit: number = 14): SparklineData {
  const sorted = [...snapshots].sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt))
  const recent = sorted.slice(-limit)
  return {
    prices: recent.map((s) => s.priceCents / 100),
    dates: recent.map((s) => s.fetchedAt.split('T')[0]),
  }
}

export function filterByTimeRange(snapshots: PriceSnapshot[], range: TimeRange): PriceSnapshot[] {
  if (range === 'ALL') return snapshots

  const now = new Date()
  const daysMap: Record<string, number> = {
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
  }

  const days = daysMap[range] || 30
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return snapshots.filter((s) => new Date(s.fetchedAt) >= cutoff)
}

export function shouldUseDailyCandles(snapshots: PriceSnapshot[]): boolean {
  if (snapshots.length === 0) return true
  const dates = snapshots.map((s) => new Date(s.fetchedAt))
  const minDate = Math.min(...dates.map((d) => d.getTime()))
  const maxDate = Math.max(...dates.map((d) => d.getTime()))
  const weeks = (maxDate - minDate) / (7 * 24 * 60 * 60 * 1000)
  return weeks < 4
}
