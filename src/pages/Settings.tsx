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
          <h2 className="text-sm font-semibold text-text-primary">Zrodla danych</h2>
          <p className="mt-1 text-xs text-text-secondary">Skad pobieramy ceny lotow</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green" />
                <span className="text-sm text-text-primary">Google Flights (Playwright)</span>
              </div>
              <span className="text-xs text-accent">Automatyczne</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green" />
                <span className="text-sm text-text-primary">SerpApi Google Flights</span>
              </div>
              <span className="text-xs text-text-muted">Reczne / szukanie</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Ceny automatycznie co 1h w dzien (7-22), co 3h w nocy. Reczne odswiezenie dostepne raz na godzine.
          </p>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">O aplikacji</h2>
          <div className="mt-3 space-y-2 text-xs text-text-secondary">
            <p>Sky - Flight Price Tracker v1.0.0</p>
            <p>Osobista aplikacja do sledzenia cen lotow z wykresami candlestick.</p>
            <p className="text-text-muted">Pierwsza cena pobierana od razu przy dodaniu trasy. Koszt: $0/mies.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
