import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import { getCompras } from '../api/compras'
import { proveedoresApi } from '../api/proveedores'
import { fmtFecha, fmtMoneda } from '../lib/format'
import type { Compra, Proveedor } from '../api/types'

const POR_PAGINA = 30

export default function Compras() {
  const navigate = useNavigate()
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    proveedoresApi.listar().then(setProveedores).catch(() => {})
  }, [])

  // Recarga con retraso (debounce) cuando cambia cualquier filtro.
  useEffect(() => {
    let vigente = true
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const data = await getCompras({ q: busqueda.trim(), proveedor, desde, hasta })
        if (!vigente) return
        setCompras(data)
        setError('')
      } catch {
        if (vigente) setError('No se pudieron cargar las compras.')
      } finally {
        if (vigente) setLoading(false)
      }
    }, busqueda ? 350 : 0)
    return () => {
      vigente = false
      clearTimeout(t)
    }
  }, [busqueda, proveedor, desde, hasta, intento])

  function filtrar<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPagina(1)
    }
  }

  const hayFiltros = Boolean(busqueda || proveedor || desde || hasta)
  const totalComprado = compras.reduce((acc, c) => acc + Number(c.total), 0)
  const totalPaginas = Math.max(1, Math.ceil(compras.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginadas = compras.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <>
      <div className="page-head">
        <p>
          <b>{compras.length}</b> {compras.length === 1 ? 'compra' : 'compras'}
          {compras.length > 0 && <> · Total <b>{fmtMoneda(totalComprado)}</b></>}
        </p>
        <div className="page-actions">
          <Link className="btn btn-primary" to="/compras/nueva">
            <Icon name="plus" />Nueva compra
          </Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-icon" style={{ maxWidth: 300, width: '100%' }}>
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar por factura o proveedor…"
            value={busqueda}
            onChange={(e) => filtrar(setBusqueda)(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ maxWidth: 220 }}
          aria-label="Filtrar por proveedor"
          value={proveedor}
          onChange={(e) => filtrar(setProveedor)(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <input className="input" type="date" style={{ maxWidth: 170 }} aria-label="Desde"
          value={desde} onChange={(e) => filtrar(setDesde)(e.target.value)} />
        <input className="input" type="date" style={{ maxWidth: 170 }} aria-label="Hasta"
          value={hasta} onChange={(e) => filtrar(setHasta)(e.target.value)} />
      </div>

      <div className="card">
        <div className="card-body-flush table-wrap">
          {loading ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="refresh" /></span>
              <h3>Cargando compras…</h3>
            </div>
          ) : error ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="alert-triangle" /></span>
              <h3>{error}</h3>
              <button className="btn btn-secondary" onClick={() => setIntento((n) => n + 1)}>Reintentar</button>
            </div>
          ) : compras.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="cart" /></span>
              <h3>{hayFiltros ? 'Sin resultados' : 'Aún no hay compras'}</h3>
              <p>
                {hayFiltros
                  ? 'No encontramos compras con esos criterios.'
                  : 'Registra una compra a un proveedor y el stock se actualizará automáticamente.'}
              </p>
              {!hayFiltros && (
                <Link className="btn btn-primary" to="/compras/nueva">
                  <Icon name="plus" />Nueva compra
                </Link>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Factura</th>
                  <th className="num">Productos</th>
                  <th className="num">Total</th>
                  <th>Registró</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((c) => (
                  <tr key={c.id}>
                    <td>{fmtFecha(c.fecha_compra)}</td>
                    <td><span className="td-strong">{c.proveedor_nombre}</span></td>
                    <td>{c.numero_factura || <span className="hint">—</span>}</td>
                    <td className="num">{c.total_items}</td>
                    <td className="num">{fmtMoneda(c.total)}</td>
                    <td>{c.usuario_nombre}</td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" title="Ver detalle" onClick={() => navigate(`/compras/${c.id}`)}>
                          <Icon name="eye" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && !error && (
          <Pagination page={paginaActual} pageSize={POR_PAGINA} total={compras.length} onChange={setPagina} />
        )}
      </div>
    </>
  )
}
