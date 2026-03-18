import { useState, useRef, useEffect } from 'react'
import { useLocations } from '../../hooks/useLocations'

interface AirportSearchProps {
  label: string
  value: string
  displayValue: string
  onSelect: (code: string, name: string) => void
  placeholder?: string
}

export function AirportSearch({ label, value, displayValue, onSelect, placeholder = 'Wpisz miasto lub kod...' }: AirportSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { data: locations, isLoading } = useLocations(query)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-text-secondary">{label}</label>
      <input
        type="text"
        value={isOpen ? query : (displayValue || query)}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setIsOpen(true)
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
      />
      {value && !isOpen && (
        <span className="absolute right-3 top-[34px] font-mono text-xs text-accent">{value}</span>
      )}

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-secondary shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-text-muted">Szukam...</div>
          ) : locations && locations.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {locations.map((loc) => (
                <li key={loc.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(loc.code, `${loc.cityName} (${loc.code})`)
                      setQuery('')
                      setIsOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bg-tertiary"
                  >
                    <div>
                      <span className="text-text-primary">{loc.cityName}</span>
                      <span className="ml-1 text-text-muted">- {loc.name}</span>
                    </div>
                    <span className="font-mono text-xs text-accent">{loc.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="px-3 py-2 text-sm text-text-muted">Brak wynikow</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
