import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { getUsername } from '../api/auth'
import api from '../api/client'
import type { Producto } from '../api/types'

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
  const [open, setOpen] = useState(false)
  const [alertas, setAlertas] = useState<Producto[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  // Trae los productos con stock bajo para las notificaciones
  useEffect(() => {
    api
      .get('/dashboard/')
      .then((res) => setAlertas(res.data.productos_stock_bajo_lista || []))
      .catch(() => {})
  }, [])

  // Cierra el desplegable al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [])

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-toggle" onClick={onMenu} aria-label="Abrir menú">
        <Icon name="menu" />
      </button>
      <h1 className="page-title">{title}</h1>
      <div className="topbar-right">
        <div className="bell-wrap" ref={wrapRef}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Notificaciones"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((o) => !o)
            }}
          >
            <Icon name="bell" />
            {alertas.length > 0 && <span className="bell-dot"></span>}
          </button>

          <div className={`dropdown ${open ? 'open' : ''}`}>
            <div className="dropdown-head">
              <strong>Notificaciones</strong>
              <span className="badge badge-amber badge-no-dot">{alertas.length}</span>
            </div>

            {alertas.length === 0 ? (
              <div className="dropdown-item">
                <span className="di-icon"><Icon name="check" /></span>
                <div>
                  <strong>Todo en orden</strong>
                  <span>No hay productos con stock bajo.</span>
                </div>
              </div>
            ) : (
              alertas.map((p) => (
                <Link className="dropdown-item" to="/productos" key={p.id} onClick={() => setOpen(false)}>
                  <span className="di-icon"><Icon name="alert-triangle" /></span>
                  <div>
                    <strong>{p.nombre}</strong>
                    <span>
                      Stock: {Number(p.stock_actual)} {p.unidad_medida} · mínimo {Number(p.stock_minimo)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
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