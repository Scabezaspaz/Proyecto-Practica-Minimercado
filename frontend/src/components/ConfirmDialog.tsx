import { useEffect } from 'react'
import Icon, { type IconName } from './Icon'

type Tone = 'danger' | 'warn' | 'primary'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: Tone
  onConfirm: () => void
  onCancel: () => void
}

// Diálogo de confirmación con el diseño de la app (reemplaza a window.confirm).
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    document.body.classList.add('modal-open')
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  const iconBg = tone === 'danger' ? 'bg-danger' : tone === 'warn' ? 'bg-warn' : 'bg-blue'
  const iconName: IconName = tone === 'danger' ? 'trash' : tone === 'warn' ? 'alert-triangle' : 'info'
  const btnClass = tone === 'danger' ? 'btn-danger' : 'btn-primary'

  return (
    <div
      className="modal-backdrop open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="modal" style={{ maxWidth: 430 }}>
        <div className="modal-body">
          <div className="modal-msg">
            <span className={`big-icon ${iconBg}`}><Icon name={iconName} /></span>
            <div>
              <strong>{title}</strong>
              <p>{message}</p>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${btnClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
