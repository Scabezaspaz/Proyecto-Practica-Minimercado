import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import api from '../api/client'
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

function estadoProducto(p: Producto) {
  const actual = Number(p.stock_actual) || 0
  if (actual <= 0) return <span className="badge badge-red">Agotado</span>
  if (p.stock_bajo) return <span className="badge badge-amber">Stock bajo</span>
  return <span className="badge badge-green">Disponible</span>
}

export default function Reportes() {
  const hoy = new Date()
  const [productos, setProductos] = useState<Producto[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        setLoading(true)
        const [prod, movs] = await Promise.all([
          api.get<Producto[]>('/productos/'),
          api.get<Movimiento[]>('/movimientos/'),
        ])
        if (cancel) return
        setProductos(prod.data)
        setMovimientos(movs.data)
        setError('')
      } catch {
        if (!cancel) setError('No se pudieron cargar los datos del reporte.')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [])

  if (loading) {
    return (
      <div className="empty">
        <span className="empty-icon"><Icon name="refresh" /></span>
        <h3>Cargando datos…</h3>
      </div>
    )
  }
  if (error) {
    return (
      <div className="alert alert-danger">
        <Icon name="alert-triangle" />{error}
      </div>
    )
  }

  // Movimientos del mes/año elegido
  const delMes = movimientos
    .filter((m) => {
      const d = new Date(m.fecha_movimiento)
      return d.getFullYear() === anio && d.getMonth() === mes
    })
    .sort((a, b) => new Date(a.fecha_movimiento).getTime() - new Date(b.fecha_movimiento).getTime())

  const countEntradas = delMes.filter((m) => m.tipo_movimiento === 'ENTRADA').length
  const countSalidas = delMes.filter((m) => m.tipo_movimiento === 'SALIDA').length

  // Resumen agrupado por producto (entradas, salidas y neto del mes)
  const resumenMap = new Map<string, { nombre: string; entradas: number; salidas: number }>()
  for (const m of delMes) {
    const actual = resumenMap.get(m.producto) || { nombre: m.producto_nombre, entradas: 0, salidas: 0 }
    const qty = Number(m.cantidad) || 0
    if (m.tipo_movimiento === 'ENTRADA') actual.entradas += qty
    else actual.salidas += qty
    resumenMap.set(m.producto, actual)
  }
  const resumen = Array.from(resumenMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))

  // Años disponibles (de los datos + el actual)
  const anios = Array.from(new Set(movimientos.map((m) => new Date(m.fecha_movimiento).getFullYear())))
  if (!anios.includes(hoy.getFullYear())) anios.push(hoy.getFullYear())
  anios.sort((a, b) => b - a)

  const generado = fmtFechaHora(new Date().toISOString())

  return (
    <>
      {/* Controles (no salen en el PDF) */}
      <div className="page-head no-print">
        <p>Genera y exporta reportes mensuales de inventario en <b>PDF</b>.</p>
      </div>

      <div className="toolbar no-print">
        <select className="input" style={{ maxWidth: 180 }} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {MESES.map((nombre, i) => (
            <option key={i} value={i}>{nombre}</option>
          ))}
        </select>
        <select className="input" style={{ maxWidth: 140 }} value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
          {anios.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="spacer"></div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="arrow-down" />Imprimir / Guardar PDF
        </button>
      </div>

      {/* Documento del reporte (esto sí sale en el PDF) */}
      <div className="report-doc">
        <div className="report-header">
          <div className="report-brand">
            <span className="brand-mark"><Icon name="leaf" /></span>
            <div className="report-title">
              <h1>MINI MERCADO ECOLÓGICO</h1>
              <p>Reporte mensual de inventario</p>
            </div>
          </div>
          <div className="report-meta">
            <div>Período: <b>{MESES[mes]} {anio}</b></div>
            <div>Generado: <b>{generado}</b></div>
            <div>Generado por: <b>{getUsername()}</b></div>
          </div>
        </div>

        {/* 1. Movimientos del mes */}
        <h2 className="report-section-title">1. Movimientos del mes</h2>
        <div className="report-totals">
          <span>Total de movimientos: <b>{delMes.length}</b></span>
          <span>Entradas: <b>{countEntradas}</b></span>
          <span>Salidas: <b>{countSalidas}</b></span>
        </div>
        <div className="card">
          <div className="table-wrap">
            {delMes.length === 0 ? (
              <div className="empty">
                <span className="empty-icon"><Icon name="clock" /></span>
                <h3>Sin movimientos</h3>
                <p>No hubo entradas ni salidas en {MESES[mes]} {anio}.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th className="num">Cantidad</th>
                    <th>Usuario</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {delMes.map((m) => (
                    <tr key={m.id}>
                      <td>{fmtFechaHora(m.fecha_movimiento)}</td>
                      <td><span className="td-strong">{m.producto_nombre}</span></td>
                      <td>{m.tipo_movimiento === 'ENTRADA' ? 'Entrada' : 'Salida'}</td>
                      <td className="num">
                        {m.tipo_movimiento === 'ENTRADA' ? '+' : '−'}{Number(m.cantidad)}
                      </td>
                      <td>{m.usuario_nombre}</td>
                      <td>{m.observacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 2. Resumen por producto */}
        <h2 className="report-section-title">2. Resumen por producto</h2>
        <p className="report-note">Totales de entradas, salidas y variación neta de cada producto durante el mes.</p>
        <div className="card">
          <div className="table-wrap">
            {resumen.length === 0 ? (
              <div className="empty">
                <span className="empty-icon"><Icon name="box" /></span>
                <h3>Sin datos</h3>
                <p>Ningún producto tuvo movimientos en {MESES[mes]} {anio}.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="num">Entradas</th>
                    <th className="num">Salidas</th>
                    <th className="num">Neto del mes</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.map((r) => {
                    const neto = r.entradas - r.salidas
                    return (
                      <tr key={r.nombre}>
                        <td><span className="td-strong">{r.nombre}</span></td>
                        <td className="num"><span className="ml-qty up">+{r.entradas}</span></td>
                        <td className="num"><span className="ml-qty down">−{r.salidas}</span></td>
                        <td className="num">
                          <span className={`ml-qty ${neto >= 0 ? 'up' : 'down'}`}>
                            {neto >= 0 ? '+' : '−'}{Math.abs(neto)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 3. Inventario actual */}
        <h2 className="report-section-title">3. Inventario actual</h2>
        <p className="report-note">Stock de cada producto a la fecha de generación del reporte.</p>
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
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td><span className="td-strong">{p.nombre}</span></td>
                    <td>{p.unidad_medida_display}</td>
                    <td className="num">{Number(p.stock_actual)}</td>
                    <td className="num">{Number(p.stock_minimo)}</td>
                    <td>{estadoProducto(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}