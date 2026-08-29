import { useEffect, useState, type FormEvent } from 'react'
import Icon from './Icon'
import SelectMenu from './SelectMenu'
import ProductPicker from './ProductPicker'
import type { Producto } from '../api/types'
import { getProductos, apiErrorMessage } from '../api/productos'
import { createMovimiento } from '../api/movimientos'
import { toast } from '../lib/toast'

type Props = {
  tipoInicial: 'ENTRADA' | 'SALIDA'
  productoIdInicial?: string
  onClose: () => void
  onSaved: () => void
}

// Bancos frecuentes (solo sugerencias; el campo admite cualquier texto).
const BANCOS = [
  'Bancolombia',
  'Davivienda',
  'BBVA',
  'Banco de Bogotá',
  'Banco de Occidente',
  'Banco Agrario',
  'Scotiabank Colpatria',
  'Nequi',
  'Daviplata',
  'Efectivo',
]

export default function MovimientoModal({ tipoInicial, productoIdInicial, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>(tipoInicial)
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState(productoIdInicial ?? '')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  // Datos de factura (solo entradas).
  const [numeroFactura, setNumeroFactura] = useState('')
  const [fechaPago, setFechaPago] = useState('')
  const [banco, setBanco] = useState('')
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorCantidad, setErrorCantidad] = useState('')

  useEffect(() => {
    document.body.classList.add('modal-open')
    getProductos()
      .then((data) => {
        setProductos(data)
        if (productoIdInicial && data.some((p) => p.id === productoIdInicial)) {
          setProductoId(productoIdInicial)
        } else if (data.length > 0) {
          setProductoId(data[0].id)
        }
      })
      .catch(() => toast('No se pudieron cargar los productos.', 'error'))
    return () => document.body.classList.remove('modal-open')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const prod = productos.find((p) => p.id === productoId)
  const productoBloqueado = Boolean(productoIdInicial)

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
        // Los datos de factura solo se envían en las entradas.
        ...(tipo === 'ENTRADA'
          ? {
              numero_factura: numeroFactura.trim(),
              fecha_pago_factura: fechaPago || null,
              banco_pago: banco.trim(),
              precio_factura: precio ? precio : null,
            }
          : {}),
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
                  <ProductPicker
                    productos={productos}
                    value={productoId}
                    onChange={setProductoId}
                    disabled={productoBloqueado}
                  />
                  {productoBloqueado && (
                    <span className="hint">Registrando movimiento para este producto.</span>
                  )}
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
                    onWheel={(e) => e.currentTarget.blur()}
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

                {/* Datos de la factura: solo para entradas y opcionales */}
                {tipo === 'ENTRADA' && (
                  <div className="field">
                    <label>
                      Datos de la factura <span className="hint">(opcional)</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="field" style={{ margin: 0 }}>
                        <label htmlFor="m-fact" className="hint">N° de factura</label>
                        <input
                          className="input"
                          id="m-fact"
                          type="text"
                          value={numeroFactura}
                          onChange={(e) => setNumeroFactura(e.target.value)}
                          placeholder="Ej: FAC-00123"
                        />
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label htmlFor="m-fpago" className="hint">Fecha de pago</label>
                        <input
                          className="input"
                          id="m-fpago"
                          type="date"
                          value={fechaPago}
                          onChange={(e) => setFechaPago(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                      <div className="field" style={{ margin: 0 }}>
                        <label htmlFor="m-precio" className="hint">Precio (COP)</label>
                        <input
                          className="input"
                          id="m-precio"
                          type="number"
                          min="0"
                          step="0.01"
                          value={precio}
                          onChange={(e) => setPrecio(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label htmlFor="m-banco" className="hint">Banco donde se pagó</label>
                        <SelectMenu
                          id="m-banco"
                          value={banco}
                          options={BANCOS}
                          placeholder="— Selecciona un banco —"
                          onChange={setBanco}
                        />
                      </div>
                    </div>
                  </div>
                )}

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
