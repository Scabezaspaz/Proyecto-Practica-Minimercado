import { useEffect, useState, type FormEvent } from 'react'
import Icon from './Icon'
import type { Producto } from '../api/types'
import { getProductos, apiErrorMessage } from '../api/productos'
import { createMovimiento } from '../api/movimientos'
import { toast } from '../lib/toast'

type Props = {
  tipoInicial: 'ENTRADA' | 'SALIDA'
  onClose: () => void
  onSaved: () => void
}

export default function MovimientoModal({ tipoInicial, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>(tipoInicial)
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorCantidad, setErrorCantidad] = useState('')

  useEffect(() => {
    document.body.classList.add('modal-open')
    getProductos()
      .then((data) => {
        setProductos(data)
        if (data.length > 0) setProductoId(data[0].id)
      })
      .catch(() => toast('No se pudieron cargar los productos.', 'error'))
    return () => document.body.classList.remove('modal-open')
  }, [])

  const prod = productos.find((p) => p.id === productoId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const c = Number(cantidad)
    if (!c || c <= 0) {
      setErrorCantidad('Ingresa una cantidad mayor que cero.')
      return
    }
    if (tipo === 'SALIDA' && prod && c > Number(prod.stock_actual)) {
      setErrorCantidad(
        `No hay suficiente stock. Disponible: ${Number(prod.stock_actual)} ${prod.unidad_medida}.`,
      )
      return
    }

    setSaving(true)
    try {
      await createMovimiento({
        producto: productoId,
        tipo_movimiento: tipo,
        cantidad,
        observacion: observacion.trim(),
      })
      toast(tipo === 'ENTRADA' ? 'Entrada registrada correctamente.' : 'Salida registrada correctamente.', 'success')
      onSaved()
    } catch (err) {
      const msg = apiErrorMessage(err, 'No se pudo registrar el movimiento.')
      setErrorCantidad(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

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
          <h3>{tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar salida'}</h3>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {productos.length === 0 ? (
              <div className="alert alert-warn" style={{ marginBottom: 0 }}>
                <Icon name="alert-triangle" />
                Primero debes crear al menos un producto en la sección Productos.
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Tipo de movimiento</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={`btn ${tipo === 'ENTRADA' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setTipo('ENTRADA')}
                    >
                      <Icon name="arrow-down" />Entrada
                    </button>
                    <button
                      type="button"
                      className={`btn ${tipo === 'SALIDA' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setTipo('SALIDA')}
                    >
                      <Icon name="arrow-up" />Salida
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="m-prod">Producto</label>
                  <select
                    className="input"
                    id="m-prod"
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {Number(p.stock_actual)} {p.unidad_medida}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`field ${errorCantidad ? 'invalid' : ''}`}>
                  <label htmlFor="m-cant">Cantidad</label>
                  <input
                    className="input"
                    id="m-cant"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={cantidad}
                    onChange={(e) => {
                      setCantidad(e.target.value)
                      if (errorCantidad) setErrorCantidad('')
                    }}
                    placeholder="0.00"
                  />
                  {prod && (
                    <span className="hint">
                      Stock actual: {Number(prod.stock_actual)} {prod.unidad_medida}
                    </span>
                  )}
                  <span className="error">
                    <Icon name="alert-triangle" />
                    <span className="err-text">{errorCantidad}</span>
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="m-obs">
                    Observación <span className="hint">(opcional)</span>
                  </label>
                  <textarea
                    className="input"
                    id="m-obs"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Motivo o nota del movimiento…"
                  ></textarea>
                </div>
              </>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${saving ? 'loading' : ''}`}
              disabled={saving || productos.length === 0}
            >
              {tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}