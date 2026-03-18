import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, ColorType, CandlestickSeries } from 'lightweight-charts'
import type { OHLCData } from '../../types/chart'

interface CandlestickChartProps {
  data: OHLCData[]
  height?: number
}

export function CandlestickChart({ data, height = 400 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b949e',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#21262d' },
        horzLines: { color: '#21262d' },
      },
      crosshair: {
        vertLine: { color: '#484f58', labelBackgroundColor: '#30363d' },
        horzLine: { color: '#484f58', labelBackgroundColor: '#30363d' },
      },
      rightPriceScale: {
        borderColor: '#30363d',
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: false,
      },
      height,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff4444',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff4444',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff4444',
    })

    series.setData(data as Parameters<typeof series.setData>[0])
    chart.timeScale().fitContent()
    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-bg-card" style={{ height }}>
        <p className="text-sm text-text-muted">Brak danych do wyswietlenia wykresu</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div ref={containerRef} />
    </div>
  )
}
