export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Ustawienia</h1>
        <p className="text-sm text-text-secondary">Informacje o aplikacji</p>
      </div>

      <div className="space-y-6">
        {/* How it works + Schedule */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Jak to dziala</h2>
          <p className="mt-2 text-xs text-text-secondary">
            Wklejasz link z Google Flights → system pobiera dane lotu przez SerpApi → co ~1h Playwright sprawdza aktualna cene → wykresy pokazuja zmiany w czasie.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-px rounded-lg bg-border overflow-hidden">
            <div className="bg-bg-tertiary px-3 py-2 text-center">
              <p className="font-mono text-sm font-bold text-text-primary">co ~1h</p>
              <p className="text-[10px] text-text-muted">dzien (7-22)</p>
            </div>
            <div className="bg-bg-tertiary px-3 py-2 text-center">
              <p className="font-mono text-sm font-bold text-text-primary">co ~3h</p>
              <p className="text-[10px] text-text-muted">noc (22-7)</p>
            </div>
            <div className="bg-bg-tertiary px-3 py-2 text-center">
              <p className="font-mono text-sm font-bold text-text-primary">co 5 min</p>
              <p className="text-[10px] text-text-muted">reczne</p>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-text-muted">
            GitHub Actions moze opoznic uruchomienie o 5-50 min. Ceny w PLN.
          </p>
        </div>

        {/* Sources + About */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Zrodla danych</h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green" />
                <span className="text-text-primary">Google Flights (Playwright)</span>
              </div>
              <span className="text-text-muted">automatyczne ceny</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green" />
                <span className="text-text-primary">SerpApi Google Flights</span>
              </div>
              <span className="text-text-muted">dodawanie + reczne</span>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4 text-xs text-text-muted">
            Sky - Flight Price Tracker v1.0.0 · Koszt: $0/mies
          </div>
        </div>
      </div>
    </div>
  )
}
