import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import MovimientoModal from '../components/MovimientoModal'
import { getProducto } from '../api/productos'
import { getMovimientos } from '../api/movimientos'
import type { Movimiento, Producto } from '../api/types'

type FiltroTipo = 'TODOS' | 'ENTRADA' | 'SALIDA'

function fmtFechaHora(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${fecha} · ${hora}`
}

function fmtFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function estadoProducto(p: Producto) {
  const actual = Number(p.stock_actual) || 0
  if (actual <= 0) return <span className="badge badge-red">Agotado</span>
  if (p.stock_bajo) return <span className="badge badge-amber">Stock bajo</span>
  return <span className="badge badge-green">Disponible</span>
}

export default function ProductoDetalle() {
  const { id = '' } = useParams()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<FiltroTipo>('TODOS')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipoModal, setTipoModal] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')

  async function cargar() {
    try {
      setLoading(true)
      const [prod, movs] = await Promise.all([
        getProducto(id),
        getMovimientos({ producto_id: id }),
      ])
      setProducto(prod)
      setMovimientos(movs)
      setError('')
    } catch {
      setError('No se pudo cargar el producto.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function abrir(tipo: 'ENTRADA' | 'SALIDA') {
    setTipoModal(tipo)
    setModalAbierto(true)
  }

  function onSaved() {
    setModalAbierto(false)
    cargar()
  }

  if (loading) {
    return (
      <div className="empty">
        <span className="empty-icon"><Icon name="refresh" /></span>
        <h3>Cargando producto…</h3>
      </div>
    )
  }
  if (error || !producto) {
    return (
      <div className="empty">
        <span className="empty-icon"><Icon name="alert-triangle" /></span>
        <h3>{error || 'Producto no encontrado.'}</h3>
        <Link className="btn btn-secondary" to="/productos"><Icon name="arrow-right" />Volver a productos</Link>
      </div>
    )
  }

  // Filtro por tipo (en memoria).
  const lista = movimientos.filter((m) => filtro === 'TODOS' || m.tipo_movimiento === filtro)

  const totalEntradas = movimientos
    .filter((m) => m.tipo_movimiento === 'ENTRADA')
    .reduce((s, m) => s + (Number(m.cantidad) || 0), 0)
  const totalSalidas = movimientos
    .filter((m) => m.tipo_movimiento === 'SALIDA')
    .reduce((s, m) => s + (Number(m.cantidad) || 0), 0)

  return (
    <>
      <div className="page-head">
        <p>
          <Link to="/productos" style={{ color: 'var(--subtle)' }}>Productos</Link>
          {' / '}<b>{producto.nombre}</b>
        </p>
        <div className="page-actions">
          <Link className="btn btn-secondary" to={`/productos/${producto.id}/reporte`}>
            <Icon name="arrow-down" />Generar reporte PDF
          </Link>
          <button className="btn btn-secondary" onClick={() => abrir('SALIDA')}>
            <Icon name="arrow-up" />Registrar salida
          </button>
          <button className="btn btn-primary" onClick={() => abrir('ENTRADA')}>
            <Icon name="arrow-down" />Registrar entrada
          </button>
        </div>
      </div>

      {/* Ficha del producto */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
            <div style={{ flex: '1 1 220px' }}>
              <div className="td-strong" style={{ fontSize: 18 }}>{producto.nombre}</div>
              {producto.descripcion && <div className="td-sub">{producto.descripcion}</div>}
              <div style={{ marginTop: 8 }}>{estadoProducto(producto)}</div>
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <div>
                <div className="hint">Stock actual</div>
                <div className="num" style={{ fontSize: 20 }}>{Number(producto.stock_actual)} {producto.unidad_medida}</div>
              </div>
              <div>
                <div className="hint">Stock mínimo</div>
                <div className="num" style={{ fontSize: 20 }}>{Number(producto.stock_minimo)} {producto.unidad_medida}</div>
              </div>
              <div>
                <div className="hint">Total entradas</div>
                <div className="num" style={{ fontSize: 20 }}><span className="ml-qty up">+{totalEntradas}</span></div>
              </div>
              <div>
                <div className="hint">Total salidas</div>
                <div className="num" style={{ fontSize: 20 }}><span className="ml-qty down">−{totalSalidas}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro Entradas / Salidas / Ambos */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${filtro === 'TODOS' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('TODOS')}
          >
            <Icon name="filter" />Ambos
          </button>
          <button
            className={`btn ${filtro === 'ENTRADA' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('ENTRADA')}
          >
            <Icon name="arrow-down" />Solo entradas
          </button>
          <button
            className={`btn ${filtro === 'SALIDA' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro('SALIDA')}
          >
            <Icon name="arrow-up" />Solo salidas
          </button>
        </div>
        <div className="spacer"></div>
        <span className="hint">{lista.length} {lista.length === 1 ? 'movimiento' : 'movimientos'}</span>
      </div>

      <div className="card">
        <div className="card-body-flush table-wrap">
          {lista.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="clock" /></span>
              <h3>Sin movimientos</h3>
              <p>
                {filtro === 'TODOS'
                  ? 'Este producto todavía no tiene movimientos registrados.'
                  : filtro === 'ENTRADA'
                    ? 'Este producto no tiene entradas registradas.'
                    : 'Este producto no tiene salidas registradas.'}
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="num">Cantidad</th>
                  <th>Usuario</th>
                  <th>Factura</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id}>
                    <td>{fmtFechaHora(m.fecha_movimiento)}</td>
                    <td>
                      {m.tipo_movimiento === 'ENTRADA' ? (
                        <span className="badge badge-green"><Icon name="arrow-down" />Entrada</span>
                      ) : (
                        <span className="badge badge-neutral"><Icon name="arrow-up" />Salida</span>
                      )}
                    </td>
                    <td className="num">
                      {m.tipo_movimiento === 'ENTRADA' ? (
                        <span className="ml-qty up">+{Number(m.cantidad)}</span>
                      ) : (
                        <span className="ml-qty down">−{Number(m.cantidad)}</span>
                      )}
                    </td>
                    <td>{m.usuario_nombre}</td>
                    <td>
                      {m.tipo_movimiento === 'ENTRADA' && (m.numero_factura || m.banco_pago || m.fecha_pago_factura) ? (
                        <div style={{ lineHeight: 1.4 }}>
                          {m.numero_factura && <div><span className="td-strong">{m.numero_factura}</span></div>}
                          {m.banco_pago && <div className="td-sub">{m.banco_pago}</div>}
                          {m.fecha_pago_factura && <div className="td-sub">Pago: {fmtFecha(m.fecha_pago_factura)}</div>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--subtle)' }}>—</span>
                      )}
                    </td>
                    <td>{m.observacion ? m.observacion : <span style={{ color: 'var(--subtle)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAbierto && (
        <MovimientoModal
          tipoInicial={tipoModal}
          productoIdInicial={producto.id}
          onClose={() => setModalAbierto(false)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
