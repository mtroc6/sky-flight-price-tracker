import { useMemo } from 'react'

interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function SparklineChart({ data, width = 100, height = 30, color }: SparklineChartProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const step = width / (data.length - 1)

    return data
      .map((v, i) => {
        const x = i * step
        const y = height - ((v - min) / range) * (height - 4) - 2
        return `${i === 0 ? 'M' : 'L'}${x},${y}`
      })
      .join(' ')
  }, [data, width, height])

  if (data.length < 2) return null

  const isUp = data[data.length - 1] > data[0]
  const strokeColor = color || (isUp ? 'var(--color-red)' : 'var(--color-green)')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
