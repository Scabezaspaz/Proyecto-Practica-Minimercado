import Icon from './Icon'
import { getUsername } from '../api/auth'

// Iniciales para el avatar (ej: "santiago cabezas" -> "SC", "admin" -> "AD")
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

type TopbarProps = {
  title: string
  onMenu: () => void
}

export default function Topbar({ title, onMenu }: TopbarProps) {
  const username = getUsername()

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-toggle" onClick={onMenu} aria-label="Abrir menú">
        <Icon name="menu" />
      </button>
      <h1 className="page-title">{title}</h1>
      <div className="topbar-right">
        <div className="bell-wrap">
          <button type="button" className="icon-btn" aria-label="Notificaciones">
            <Icon name="bell" />
            <span className="bell-dot"></span>
          </button>
        </div>
        <span className="topbar-divider"></span>
        <div className="user-chip">
          <span className="avatar">{initials(username)}</span>
          <span className="user-chip-text">
            <strong>{username}</strong>
            <em>Administrador</em>
          </span>
        </div>
      </div>
    </header>
  )
}