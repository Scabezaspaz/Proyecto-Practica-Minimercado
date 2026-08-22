import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { getUsername } from '../api/auth'
import Icon from '../components/Icon'
import type { DashboardData, Movimiento } from '../api/types'

// Fecha "YYYY-MM-DD" en horario local (para agrupar por día)
function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Fecha legible para la tabla
function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        setLoading(true)
        const [dash, movs] = await Promise.all([
          api.get<DashboardData>('/dashboard/'),
          api.get<Movimiento[]>('/movimientos/'),
        ])
        if (cancel) return
        setData(dash.data)
        setMovimientos(movs.data)
        setError('')
      } catch {
        if (!cancel) setError('No se pudo cargar el panel. Revisa que el backend esté encendido.')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => {
      cancel = true
    }
  }, [])

  if (loading) {
    return (
      <div className="empty">
        <span className="empty-icon"><Icon name="refresh" /></span>
        <h3>Cargando panel…</h3>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="alert alert-danger">
        <Icon name="alert-triangle" />
        {error || 'No hay datos para mostrar.'}
      </div>
    )
  }

  // ---- Saludo ----
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombreCorto = getUsername().split(/\s+/)[0]
  const fechaLarga = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ---- Gráfica: últimos 7 días ----
  const days: { iso: string; label: string; entrada: number; salida: number }[] = []
  const hoy = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - i)
    days.push({
      iso: dateKey(d),
      label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      entrada: 0,
      salida: 0,
    })
  }
  const porDia = new Map(days.map((d) => [d.iso, d]))
  for (const m of movimientos) {
    const bucket = porDia.get(dateKey(new Date(m.fecha_movimiento)))
    if (!bucket) continue
    const qty = Number(m.cantidad) || 0
    if (m.tipo_movimiento === 'ENTRADA') bucket.entrada += qty
    else bucket.salida += qty
  }
  const maxV = Math.max(1, ...days.flatMap((d) => [d.entrada, d.salida]))
  const pct = (v: number) => `${Math.max(0, Math.round((v / maxV) * 100))}%`

  // ---- KPIs de entradas/salidas (conteo últimos 7 días) ----
  const ahora = Date.now()
  const ultimos7 = movimientos.filter((m) => {
    const diff = (ahora - new Date(m.fecha_movimiento).getTime()) / 86400000
    return diff >= 0 && diff <= 7
  })
  const entradas7 = ultimos7.filter((m) => m.tipo_movimiento === 'ENTRADA').length
  const salidas7 = ultimos7.filter((m) => m.tipo_movimiento === 'SALIDA').length

  // ---- Listas ----
  const recientes = movimientos.slice(0, 8)
  const stockBajo = data.productos_stock_bajo_lista

  return (
    <>
      <div className="page-head">
        <p>
          <b>{saludo}, {nombreCorto}</b> · así está tu inventario el <b>{fechaLarga}</b>.
        </p>
        <div className="page-actions">
          <Link className="btn btn-secondary" to="/movimientos">
            <Icon name="arrow-up" />Registrar salida
          </Link>
          <Link className="btn btn-primary" to="/movimientos">
            <Icon name="arrow-down" />Registrar entrada
          </Link>
        </div>
      </div>

      <section className="section">
        {/* KPIs */}
        <div className="kpis">
          <div className="card kpi">
            <span className="kpi-icon kpi-navy"><Icon name="box" /></span>
            <div className="kpi-meta">
              <span className="kpi-label">Total de productos</span>
              <span className="kpi-value">{data.total_productos}</span>
              <span className="kpi-note">{data.total_productos} en el catálogo</span>
            </div>
          </div>
          <div className="card kpi">
            <span className="kpi-icon kpi-amber"><Icon name="alert-triangle" /></span>
            <div className="kpi-meta">
              <span className="kpi-label">Productos con stock bajo</span>
              <span className="kpi-value">{data.productos_stock_bajo}</span>
              <span className="kpi-note">
                {data.productos_stock_bajo > 0 ? (
                  <b>{data.productos_stock_bajo} requieren reposición</b>
                ) : (
                  'Todo en orden'
                )}
              </span>
            </div>
          </div>
          <div className="card kpi">
            <span className="kpi-icon kpi-green"><Icon name="arrow-down" /></span>
            <div className="kpi-meta">
              <span className="kpi-label">Entradas registradas</span>
              <span className="kpi-value">{entradas7}</span>
              <span className="kpi-note">Últimos 7 días</span>
            </div>
          </div>
          <div className="card kpi">
            <span className="kpi-icon kpi-blue"><Icon name="arrow-up" /></span>
            <div className="kpi-meta">
              <span className="kpi-label">Salidas registradas</span>
              <span className="kpi-value">{salidas7}</span>
              <span className="kpi-note">Últimos 7 días</span>
            </div>
          </div>
        </div>

        {/* Gráfica */}
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Movimientos del inventario</h2>
              <p>Entradas y salidas de los últimos 7 días</p>
            </div>
          </div>
          <div className="card-body">
            <div className="chart">
              <div className="chart-y">
                <span>{maxV}</span>
                <span>{Math.round(maxV / 2)}</span>
                <span>0</span>
              </div>
              <div className="chart-plot">
                {days.map((d) => (
                  <div className="chart-group" key={d.iso}>
                    <div className="chart-bars">
                      <span
                        className="bar entrada"
                        style={{ height: pct(d.entrada) }}
                        data-tip={`${d.entrada} entradas`}
                      ></span>
                      <span
                        className="bar salida"
                        style={{ height: pct(d.salida) }}
                        data-tip={`${d.salida} salidas`}
                      ></span>
                    </div>
                    <span className="chart-day">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-swatch green"></span>Entradas</span>
            <span className="legend-item"><span className="legend-swatch blue"></span>Salidas</span>
          </div>
        </div>

        {/* Últimos movimientos + Stock bajo */}
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Últimos movimientos</h2>
                <p>Registros más recientes del inventario</p>
              </div>
              <Link className="btn btn-ghost btn-sm" to="/movimientos">
                Ver historial<Icon name="arrow-right" />
              </Link>
            </div>
            <div className="card-body-flush table-wrap">
              {recientes.length === 0 ? (
                <div className="empty">
                  <span className="empty-icon"><Icon name="clock" /></span>
                  <h3>Sin movimientos</h3>
                  <p>Aún no se han registrado entradas ni salidas.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.map((m) => (
                      <tr key={m.id}>
                        <td>{fmtDate(m.fecha_movimiento)}</td>
                        <td><span className="td-strong">{m.producto_nombre}</span></td>
                        <td>
                          {m.tipo_movimiento === 'ENTRADA' ? (
                            <span className="badge badge-green"><Icon name="arrow-down" />Entrada</span>
                          ) : (
                            <span className="badge badge-neutral"><Icon name="arrow-up" />Salida</span>
                          )}
                        </td>
                        <td className="num">
                          {m.tipo_movimiento === 'ENTRADA' ? (
                            <span className="ml-qty up">+{m.cantidad}</span>
                          ) : (
                            <span className="ml-qty down">−{m.cantidad}</span>
                          )}
                        </td>
                        <td>{m.usuario_nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>Productos con stock bajo</h2>
                <p>
                  {stockBajo.length > 0
                    ? `${stockBajo.length} productos por debajo de su mínimo`
                    : 'Sin alertas activas'}
                </p>
              </div>
              <Link className="btn btn-ghost btn-sm" to="/productos">
                Ver productos<Icon name="arrow-right" />
              </Link>
            </div>
            <div className="card-body-flush">
              {stockBajo.length === 0 ? (
                <div className="empty">
                  <span className="empty-icon"><Icon name="check" /></span>
                  <h3>Todo en orden</h3>
                  <p>Ningún producto está por debajo de su stock mínimo.</p>
                </div>
              ) : (
                <div className="mini-list">
                  {stockBajo.map((p) => (
                    <div className="ml-row" key={p.id}>
                      <span className={`badge ${p.stock_actual <= 0 ? 'badge-red' : 'badge-amber'}`}>
                        {p.stock_actual <= 0 ? 'Agotado' : 'Stock bajo'}
                      </span>
                      <span className="ml-name">{p.nombre}</span>
                      <span className="ml-qty" style={{ color: 'var(--muted)', fontWeight: 500 }}>
                        {p.stock_actual} {p.unidad_medida_display}
                      </span>
                      <Link className="icon-btn" to="/movimientos" title="Registrar entrada">
                        <Icon name="arrow-down" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}