import { useState } from 'react'

export default function Settings() {
  const [currency, setCurrency] = useState('PLN')
  const [cabinClass, setCabinClass] = useState('economy')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Ustawienia</h1>
        <p className="text-sm text-text-secondary">Skonfiguruj aplikacje</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Currency */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Waluta</h2>
          <p className="mt-1 text-xs text-text-secondary">Domyslna waluta dla cen lotow</p>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-3 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="PLN">PLN - Zloty polski</option>
            <option value="EUR">EUR - Euro</option>
            <option value="USD">USD - Dolar amerykanski</option>
            <option value="GBP">GBP - Funt brytyjski</option>
          </select>
        </div>

        {/* Cabin class */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Domyslna klasa</h2>
          <p className="mt-1 text-xs text-text-secondary">Klasa podrozy uzywana przy wyszukiwaniu</p>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="mt-3 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="economy">Ekonomiczna</option>
            <option value="business">Biznesowa</option>
            <option value="first">Pierwsza</option>
          </select>
        </div>

        {/* API Status */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Status API</h2>
          <p className="mt-1 text-xs text-text-secondary">Zrodla danych cenowych</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green" />
                <span className="text-sm text-text-primary">Kiwi Tequila API</span>
              </div>
              <span className="text-xs text-text-muted">Primary</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-text-muted" />
                <span className="text-sm text-text-primary">SerpAPI Google Flights</span>
              </div>
              <span className="text-xs text-text-muted">Opcjonalny</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">O aplikacji</h2>
          <div className="mt-3 space-y-2 text-xs text-text-secondary">
            <p>Sky - Flight Price Tracker v1.0.0</p>
            <p>Osobista aplikacja do sledzenia cen lotow z wykresami candlestick.</p>
            <p className="text-text-muted">Dane cenowe sa pobierane automatycznie 2x dziennie.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
