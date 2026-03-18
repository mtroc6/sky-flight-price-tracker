import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { PricePoint } from '../../types/chart'

interface PriceLineChartProps {
  data: PricePoint[]
  height?: number
}

function formatDate(unix: number): string {
  const d = new Date(unix * 1000)
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: number }) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border border-border bg-bg-secondary px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted">{formatDate(label)}</p>
      <p className="font-mono text-sm font-semibold text-accent">
        {payload[0].value.toLocaleString('pl-PL')} PLN
      </p>
    </div>
  )
}

export function PriceLineChart({ data, height = 300 }: PriceLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-bg-card" style={{ height }}>
        <p className="text-sm text-text-muted">Brak danych do wyswietlenia wykresu</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => formatDate(v)}
            tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={{ stroke: '#30363d' }}
            axisLine={{ stroke: '#30363d' }}
          />
          <YAxis
            tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={{ stroke: '#30363d' }}
            axisLine={{ stroke: '#30363d' }}
            tickFormatter={(v) => `${v} zl`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00ff88"
            strokeWidth={2}
            dot={{ r: 3, fill: '#00ff88', stroke: '#0d1117', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#00ff88', stroke: '#0d1117', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
