import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

type Props = {
  id?: string
  value: string
  options: string[]
  placeholder?: string
  onChange: (value: string) => void
}

// Desplegable propio: SIEMPRE se abre hacia abajo (a diferencia del
// <select> nativo, que el navegador puede abrir hacia arriba).
export default function SelectMenu({ id, value, options, placeholder = 'Selecciona…', onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
        id={id}
        className="input sdown-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? '' : 'sdown-ph'}>{value || placeholder}</span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <ul className="sdown-menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`sdown-item ${opt === value ? 'sel' : ''}`}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
