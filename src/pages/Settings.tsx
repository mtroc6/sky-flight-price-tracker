export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Ustawienia</h1>
        <p className="text-sm text-text-secondary">Informacje o aplikacji</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* How it works */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Jak to dziala?</h2>
          <div className="mt-3 space-y-3 text-xs text-text-secondary">
            <div className="flex gap-3">
              <span className="font-mono font-bold text-accent">1.</span>
              <p>Wklejasz link do konkretnego lotu z Google Flights</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-accent">2.</span>
              <p>System pobiera dane lotu (linia, godziny, cena) przez SerpApi</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-accent">3.</span>
              <p>Co ~1 godzine (7:00-22:00) Playwright otwiera strone lotu i zapisuje aktualna cene</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-accent">4.</span>
              <p>Wykresy candlestick i liniowy pokazuja jak cena zmienia sie w czasie</p>
            </div>
          </div>
        </div>

        {/* Data sources */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Zrodla danych</h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green" />
                <div>
                  <span className="text-sm text-text-primary">Google Flights (Playwright)</span>
                  <p className="text-[10px] text-text-muted">Automatyczne pobieranie cen co ~1h</p>
                </div>
              </div>
              <span className="text-xs text-accent">Cron</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green" />
                <div>
                  <span className="text-sm text-text-primary">SerpApi Google Flights</span>
                  <p className="text-[10px] text-text-muted">Dodawanie lotow + reczne odswiezanie</p>
                </div>
              </div>
              <span className="text-xs text-text-muted">API</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">Harmonogram</h2>
          <div className="mt-3 space-y-2 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>Dzien (7:00 - 22:00 CET)</span>
              <span className="font-mono text-text-primary">co ~1h</span>
            </div>
            <div className="flex justify-between">
              <span>Noc (22:00 - 7:00 CET)</span>
              <span className="font-mono text-text-primary">co ~3h</span>
            </div>
            <div className="flex justify-between">
              <span>Reczne odswiezenie</span>
              <span className="font-mono text-text-primary">co 5 min</span>
            </div>
            <p className="mt-2 text-[10px] text-text-muted">
              GitHub Actions moze opoznic uruchomienie o 5-50 min. Ceny w PLN.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-sm font-semibold text-text-primary">O aplikacji</h2>
          <div className="mt-3 space-y-1 text-xs text-text-secondary">
            <p>Sky - Flight Price Tracker v1.0.0</p>
            <p className="text-text-muted">Koszt: $0/mies (darmowe API + GitHub Actions)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
