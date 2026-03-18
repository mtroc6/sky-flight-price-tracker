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

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
