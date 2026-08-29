import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon, { type IconName } from './Icon'
import { logout } from '../api/auth'

type NavItem = { to: string; icon: IconName; label: string; end?: boolean }

const ITEMS: NavItem[] = [
  { to: '/', icon: 'dashboard', label: 'Panel de control', end: true },
  { to: '/productos', icon: 'box', label: 'Productos' },
  { to: '/movimientos', icon: 'clock', label: 'Movimientos' },
  { to: '/reportes', icon: 'calendar', label: 'Reportes' },
]

type SidebarProps = {
  open: boolean
  onNavigate: () => void
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link to="/" className="brand" onClick={onNavigate}>
        <span className="brand-mark"><Icon name="leaf" /></span>
        <span className="brand-text">
          <strong>Mini Mercado Ecológico</strong>
          <em>Gestión de inventario</em>
        </span>
      </Link>

      <nav className="nav" aria-label="Navegación principal">
        <span className="nav-label">Menú</span>
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button type="button" className="nav-item" onClick={handleLogout}>
          <Icon name="logout" />
          <span>Cerrar sesión</span>
        </button>
        <p className="sidebar-version">v1.0 · Mini Mercado Ecológico</p>
      </div>
    </aside>
  )
}