import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Watchlist from './pages/Watchlist'
import RouteDetail from './pages/RouteDetail'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/route/:id" element={<RouteDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}
