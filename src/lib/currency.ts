export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP'

const SYMBOLS: Record<Currency, string> = {
  PLN: 'zl',
  EUR: '€',
  USD: '$',
  GBP: '£',
}

let ratesCache: { rates: Record<string, number>; fetchedAt: number } | null = null

async function fetchRates(): Promise<Record<string, number>> {
  // Cache for 1 hour
  if (ratesCache && Date.now() - ratesCache.fetchedAt < 60 * 60 * 1000) {
    return ratesCache.rates
  }

  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=PLN&symbols=EUR,USD,GBP')
    const data = await res.json()
    const rates: Record<string, number> = { PLN: 1, ...data.rates }
    ratesCache = { rates, fetchedAt: Date.now() }
    return rates
  } catch {
    // Fallback rates if API fails
    return { PLN: 1, EUR: 0.233, USD: 0.254, GBP: 0.198 }
  }
}

export async function convertPrice(pricePLN: number, currency: Currency): Promise<number> {
  if (currency === 'PLN') return pricePLN
  const rates = await fetchRates()
  return Math.ceil(pricePLN * (rates[currency] || 1))
}

export function formatPricePLN(pricePLN: number): string {
  return `${pricePLN.toLocaleString('pl-PL')} zl`
}

export function getCurrencySymbol(currency: Currency): string {
  return SYMBOLS[currency]
}

export function getSavedCurrency(): Currency {
  if (typeof window === 'undefined') return 'PLN'
  return (localStorage.getItem('sky-currency') as Currency) || 'PLN'
}

export function saveCurrency(currency: Currency): void {
  localStorage.setItem('sky-currency', currency)
}

// React hook-friendly: synchronous with cached rates
let syncRates: Record<string, number> = { PLN: 1, EUR: 0.233, USD: 0.254, GBP: 0.198 }

export function initRates(): Promise<void> {
  return fetchRates().then(r => { syncRates = r })
}

export function convertPriceSync(pricePLN: number, currency: Currency): number {
  if (currency === 'PLN') return pricePLN
  return Math.ceil(pricePLN * (syncRates[currency] || 1))
}

export function formatPriceSync(pricePLN: number, currency: Currency): string {
  const converted = convertPriceSync(pricePLN, currency)
  return `${converted.toLocaleString('pl-PL')} ${SYMBOLS[currency]}`
}
