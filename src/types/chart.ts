export interface OHLCData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

export interface PricePoint {
  time: string
  price: number
  airline?: string
}

export interface SparklineData {
  prices: number[]
  dates: string[]
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | 'ALL'

export type CandleInterval = 'hourly' | 'daily' | 'weekly' | 'monthly'
