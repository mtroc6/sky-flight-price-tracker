import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Currency, getSavedCurrency, saveCurrency, initRates, convertPriceSync, getCurrencySymbol } from './currency'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  formatPrice: (priceCentsPLN: number) => string
  symbol: string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PLN',
  setCurrency: () => {},
  formatPrice: (c) => `${(c / 100).toLocaleString('pl-PL')} zl`,
  symbol: 'zl',
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(getSavedCurrency)

  useEffect(() => {
    initRates()
  }, [])

  const handleSetCurrency = (c: Currency) => {
    setCurrencyState(c)
    saveCurrency(c)
  }

  const formatPrice = (priceCentsPLN: number) => {
    const pln = priceCentsPLN / 100
    const converted = convertPriceSync(pln, currency)
    return `${converted.toLocaleString('pl-PL')} ${getCurrencySymbol(currency)}`
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency: handleSetCurrency,
      formatPrice,
      symbol: getCurrencySymbol(currency),
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
