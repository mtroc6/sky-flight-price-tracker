import { clsx } from 'clsx'

interface PriceDisplayProps {
  price: number
  previousPrice?: number | null
  currency?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceDisplay({ price, previousPrice, currency = 'PLN', size = 'md' }: PriceDisplayProps) {
  const diff = previousPrice ? price - previousPrice : 0
  const pctChange = previousPrice ? ((diff / previousPrice) * 100) : 0
  const isUp = diff > 0
  const isDown = diff < 0

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className={clsx('font-mono font-bold text-text-primary', sizeClasses[size])}>
        {price.toLocaleString('pl-PL')} {currency}
      </span>
      {previousPrice != null && diff !== 0 && (
        <span
          className={clsx(
            'font-mono text-xs font-medium',
            isDown && 'text-green',
            isUp && 'text-red',
          )}
        >
          {isUp ? '+' : ''}{diff.toLocaleString('pl-PL')} ({pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%)
        </span>
      )}
    </div>
  )
}
