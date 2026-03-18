import { clsx } from 'clsx'
import { useCurrency } from '../../lib/CurrencyContext'
import { convertPriceSync } from '../../lib/currency'

interface PriceDisplayProps {
  price: number // price in PLN (already divided by 100)
  previousPrice?: number | null
  size?: 'sm' | 'md' | 'lg'
}

export function PriceDisplay({ price, previousPrice, size = 'md' }: PriceDisplayProps) {
  const { currency, symbol } = useCurrency()

  const converted = convertPriceSync(price, currency)
  const prevConverted = previousPrice ? convertPriceSync(previousPrice, currency) : null

  const diff = prevConverted ? converted - prevConverted : 0
  const pctChange = prevConverted ? ((diff / prevConverted) * 100) : 0
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
        {converted.toLocaleString('pl-PL')} {symbol}
      </span>
      {prevConverted != null && diff !== 0 && (
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
