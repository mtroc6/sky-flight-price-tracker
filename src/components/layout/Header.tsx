import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const mobileNav = [
  { path: '/', label: 'Pulpit' },
  { path: '/add', label: 'Dodaj' },
  { path: '/watchlist', label: 'Obserwowane' },
  { path: '/settings', label: 'Ustawienia' },
]

export function Header() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-bg-secondary px-4 lg:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10">
          <span className="text-sm font-bold text-accent">S</span>
        </div>
        <span className="font-semibold text-text-primary">Sky</span>
      </div>

      {/* Mobile nav */}
      <nav className="ml-4 flex gap-1 overflow-x-auto lg:hidden" style={{ scrollbarWidth: 'none' }}>
        {mobileNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-md bg-green-dim/20 px-2 py-1 text-xs font-medium text-green sm:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-green" />
          Online
        </div>
      </div>
    </header>
  )
}
