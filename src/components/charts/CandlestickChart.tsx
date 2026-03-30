import { useEffect, useRef, useState } from 'react'
import { createChart, type IChartApi, ColorType, CandlestickSeries } from 'lightweight-charts'
import type { OHLCData } from '../../types/chart'

interface CandlestickChartProps {
  data: OHLCData[]
  height?: number
  showTime?: boolean
}

interface OHLCInfo {
  open: number
  high: number
  low: number
  close: number
}

export function CandlestickChart({ data, height = 400, showTime = false }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [hoveredCandle, setHoveredCandle] = useState<OHLCInfo | null>(null)

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
        timeVisible: showTime,
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

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) {
        setHoveredCandle(null)
        return
      }
      const candle = param.seriesData.get(series) as OHLCInfo | undefined
      if (candle) {
        setHoveredCandle({ open: candle.open, high: candle.high, low: candle.low, close: candle.close })
      }
    })

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
      <div className="mb-2 flex flex-wrap gap-3 font-mono text-[11px]">
        {hoveredCandle ? (
          <>
            <span className="text-text-muted">O: <span className="text-text-primary">{hoveredCandle.open.toLocaleString('pl-PL')}</span></span>
            <span className="text-text-muted">H: <span className="text-green">{hoveredCandle.high.toLocaleString('pl-PL')}</span></span>
            <span className="text-text-muted">L: <span className="text-red">{hoveredCandle.low.toLocaleString('pl-PL')}</span></span>
            <span className="text-text-muted">C: <span className="text-text-primary">{hoveredCandle.close.toLocaleString('pl-PL')}</span></span>
          </>
        ) : (
          <span className="text-text-muted">Najedz na swiece by zobaczyc OHLC</span>
        )}
      </div>
      <div ref={containerRef} />
    </div>
  )
}
