import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { PricePoint } from '../../types/chart'

interface PriceLineChartProps {
  data: PricePoint[]
  height?: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-bg-secondary px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted">{label}</p>
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
            tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={{ stroke: '#30363d' }}
            axisLine={{ stroke: '#30363d' }}
          />
          <YAxis
            tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={{ stroke: '#30363d' }}
            axisLine={{ stroke: '#30363d' }}
            tickFormatter={(v) => `${v} zl`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00ff88"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00ff88', stroke: '#0d1117', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
