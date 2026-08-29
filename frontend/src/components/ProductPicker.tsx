import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import type { Producto } from '../api/types'

type Props = {
  productos: Producto[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

// Selector de producto con búsqueda por coincidencias (combobox).
// Siempre se abre hacia abajo y filtra la lista mientras el cliente escribe.
export default function ProductPicker({ productos, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const seleccionado = productos.find((p) => p.id === value)

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [productos, query])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className={`sdown ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="input sdown-btn"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v)
          setQuery('')
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={seleccionado ? '' : 'sdown-ph'}>
          {seleccionado
            ? `${seleccionado.nombre} — ${Number(seleccionado.stock_actual)} ${seleccionado.unidad_medida}`
            : 'Selecciona un producto…'}
        </span>
        <Icon name="chevron-down" />
      </button>

      {open && !disabled && (
        <div className="sdown-menu">
          <div className="sdown-search">
            <Icon name="search" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul role="listbox" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filtrados.length === 0 ? (
              <li className="sdown-item" style={{ color: 'var(--muted)', cursor: 'default' }}>
                Sin coincidencias
              </li>
            ) : (
              filtrados.map((p) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={p.id === value}
                  className={`sdown-item ${p.id === value ? 'sel' : ''}`}
                  onClick={() => {
                    onChange(p.id)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {p.nombre}{' '}
                  <span style={{ color: 'var(--muted)' }}>
                    — {Number(p.stock_actual)} {p.unidad_medida}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
