import { useEffect, type FormEvent, type ReactNode } from 'react'
import Icon from './Icon'

type Props = {
  title: string
  submitLabel: string
  saving: boolean
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  children: ReactNode
}

// Contenedor reutilizable para los formularios en modal (encabezado,
// cuerpo y botones). Cada modal solo define sus campos.
export default function FormModal({ title, submitLabel, saving, onClose, onSubmit, children }: Props) {
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  return (
    <div
      className="modal-backdrop open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="modal-body">{children}</div>

          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
