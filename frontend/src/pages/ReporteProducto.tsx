import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { getProducto } from '../api/productos'
import { getMovimientos } from '../api/movimientos'
import { getUsername } from '../api/auth'
import type { Movimiento, Producto } from '../api/types'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function fmtFechaHora(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${fecha} ${hora}`
}

function fmtFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtPrecio(v: string | null): string {
  if (v === null || v === '') return ''
  const n = Number(v)
  if (isNaN(n)) return ''
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 })
}

function estadoProducto(p: Producto) {
  const actual = Number(p.stock_actual) || 0
  if (actual <= 0) return <span className="badge badge-red">Agotado</span>
  if (p.stock_bajo) return <span className="badge badge-amber">Stock bajo</span>
  return <span className="badge badge-green">Disponible</span>
}

export default function ReporteProducto() {
  const { id = '' } = useParams()
  const hoy = new Date()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [todo, setTodo] = useState(false)

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        setLoading(true)
        const [prod, movs] = await Promise.all([
          getProducto(id),
          getMovimientos({ producto_id: id }),
        ])
        if (cancel) return
        setProducto(prod)
        setMovimientos(movs)
        setError('')
      } catch {
        if (!cancel) setError('No se pudieron cargar los datos del reporte.')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [id])

  if (loading) {
    return (
      <div className="empty">
        <span className="empty-icon"><Icon name="refresh" /></span>
        <h3>Cargando datos…</h3>
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

  // Movimientos del período elegido (o todo el histórico).
  const seleccion = movimientos
    .filter((m) => {
      if (todo) return true
      const d = new Date(m.fecha_movimiento)
      return d.getFullYear() === anio && d.getMonth() === mes
    })
    .sort((a, b) => new Date(a.fecha_movimiento).getTime() - new Date(b.fecha_movimiento).getTime())

  const entradas = seleccion.filter((m) => m.tipo_movimiento === 'ENTRADA')
  const salidas = seleccion.filter((m) => m.tipo_movimiento === 'SALIDA')
  const totalEntradas = entradas.reduce((s, m) => s + (Number(m.cantidad) || 0), 0)
  const totalSalidas = salidas.reduce((s, m) => s + (Number(m.cantidad) || 0), 0)
  const neto = totalEntradas - totalSalidas

  // Años disponibles (de los datos + el actual).
  const anios = Array.from(new Set(movimientos.map((m) => new Date(m.fecha_movimiento).getFullYear())))
  if (!anios.includes(hoy.getFullYear())) anios.push(hoy.getFullYear())
  anios.sort((a, b) => b - a)

  const periodoTexto = todo ? 'Todo el histórico' : `${MESES[mes]} ${anio}`
  const generado = fmtFechaHora(new Date().toISOString())

  return (
    <>
      {/* Controles (no salen en el PDF) */}
      <div className="page-head no-print">
        <p>
          <Link to={`/productos/${producto.id}`} style={{ color: 'var(--subtle)' }}>← Volver al detalle</Link>
        </p>
      </div>

      <div className="toolbar no-print">
        <select
          className="input"
          style={{ maxWidth: 180 }}
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          disabled={todo}
        >
          {MESES.map((nombre, i) => (
            <option key={i} value={i}>{nombre}</option>
          ))}
        </select>
        <select
          className="input"
          style={{ maxWidth: 140 }}
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          disabled={todo}
        >
          {anios.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={todo} onChange={(e) => setTodo(e.target.checked)} />
          Todo el histórico
        </label>
        <div className="spacer"></div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="arrow-down" />Imprimir / Guardar PDF
        </button>
      </div>

      {/* Nota en pantalla: el documento solo aparece al imprimir/guardar PDF */}
      <div className="report-screen-note">
        <Icon name="info" />
        <div>
          El reporte de <b>{producto.nombre}</b> ({periodoTexto}) se generará al pulsar{' '}
          <b>Imprimir / Guardar PDF</b>. Aquí no se muestra la vista previa para mantener la pantalla limpia.
        </div>
      </div>

      {/* Documento del reporte (esto sí sale en el PDF) */}
      <div className="report-doc">
        <div className="report-header">
          <div className="report-brand">
            <span className="brand-mark"><Icon name="leaf" /></span>
            <div className="report-title">
              <h1>MINI MERCADO ECOLÓGICO</h1>
              <p>Reporte por producto</p>
            </div>
          </div>
          <div className="report-meta">
            <div>Producto: <b>{producto.nombre}</b></div>
            <div>Período: <b>{periodoTexto}</b></div>
            <div>Generado: <b>{generado}</b></div>
            <div>Generado por: <b>{getUsername()}</b></div>
          </div>
        </div>

        {/* Ficha del producto */}
        <h2 className="report-section-title">Ficha del producto</h2>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th className="num">Stock actual</th>
                  <th className="num">Stock mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="td-strong">{producto.nombre}</span></td>
                  <td>{producto.unidad_medida_display}</td>
                  <td className="num">{Number(producto.stock_actual)}</td>
                  <td className="num">{Number(producto.stock_minimo)}</td>
                  <td>{estadoProducto(producto)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. Movimientos del período */}
        <h2 className="report-section-title">1. Movimientos ({periodoTexto})</h2>
        <div className="report-totals">
          <span>Total de movimientos: <b>{seleccion.length}</b></span>
          <span>Entradas: <b>{entradas.length}</b></span>
          <span>Salidas: <b>{salidas.length}</b></span>
        </div>
        <div className="card">
          <div className="table-wrap">
            {seleccion.length === 0 ? (
              <div className="empty">
                <span className="empty-icon"><Icon name="clock" /></span>
                <h3>Sin movimientos</h3>
                <p>No hubo entradas ni salidas en {periodoTexto.toLowerCase()}.</p>
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
                  {seleccion.map((m) => (
                    <tr key={m.id}>
                      <td>{fmtFechaHora(m.fecha_movimiento)}</td>
                      <td>{m.tipo_movimiento === 'ENTRADA' ? 'Entrada' : 'Salida'}</td>
                      <td className="num">
                        {m.tipo_movimiento === 'ENTRADA' ? '+' : '−'}{Number(m.cantidad)}
                      </td>
                      <td>{m.usuario_nombre}</td>
                      <td>
                        {m.tipo_movimiento === 'ENTRADA' && (m.numero_factura || m.banco_pago || m.fecha_pago_factura || m.precio_factura) ? (
                          <div style={{ lineHeight: 1.4 }}>
                            {m.numero_factura && <div>{m.numero_factura}</div>}
                            {m.precio_factura && <div>{fmtPrecio(m.precio_factura)}</div>}
                            {m.banco_pago && <div>{m.banco_pago}</div>}
                            {m.fecha_pago_factura && <div>Pago: {fmtFecha(m.fecha_pago_factura)}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td>{m.observacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 2. Resumen del período */}
        <h2 className="report-section-title">2. Resumen del período</h2>
        <p className="report-note">Totales de entradas, salidas y variación neta del producto en {periodoTexto.toLowerCase()}.</p>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Entradas</th>
                  <th className="num">Salidas</th>
                  <th className="num">Neto del período</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="td-strong">{producto.nombre}</span></td>
                  <td className="num"><span className="ml-qty up">+{totalEntradas}</span></td>
                  <td className="num"><span className="ml-qty down">−{totalSalidas}</span></td>
                  <td className="num">
                    <span className={`ml-qty ${neto >= 0 ? 'up' : 'down'}`}>
                      {neto >= 0 ? '+' : '−'}{Math.abs(neto)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
