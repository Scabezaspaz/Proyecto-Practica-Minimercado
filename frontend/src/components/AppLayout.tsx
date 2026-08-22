import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

// Título de la barra superior según la ruta
const TITLES: Record<string, string> = {
  '/': 'Panel de control',
  '/productos': 'Productos',
  '/movimientos': 'Movimientos',
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'Mini Mercado Ecológico'

  return (
    <>
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div
        className={`backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className="main">
        <Topbar title={title} onMenu={() => setMenuOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  )
}