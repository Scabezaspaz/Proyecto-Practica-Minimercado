import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductoModal from '../components/ProductoModal'
import { getProductos, deleteProducto, apiErrorMessage } from '../api/productos'
import { toast } from '../lib/toast'
import type { Producto } from '../api/types'

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const navigate = useNavigate()

  async function cargar(q = '') {
    try {
      setLoading(true)
      const data = await getProductos(q)
      setProductos(data)
      setError('')
    } catch {
      setError('No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }

  // Carga inicial + búsqueda con retraso (debounce)
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda.trim()), busqueda ? 350 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(p: Producto) {
    setEditando(p)
    setModalAbierto(true)
  }

  function onSaved() {
    setModalAbierto(false)
    cargar(busqueda.trim())
  }

  async function handleDelete(p: Producto) {
    if (!window.confirm(`¿Desactivar "${p.nombre}"? Dejará de aparecer en el inventario.`)) return
    try {
      await deleteProducto(p.id)
      toast('Producto desactivado.', 'success')
      cargar(busqueda.trim())
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo desactivar el producto.'), 'error')
    }
  }

  function filaEstado(p: Producto) {
    const actual = Number(p.stock_actual) || 0
    if (actual <= 0) return <span className="badge badge-red">Agotado</span>
    if (p.stock_bajo) return <span className="badge badge-amber">Stock bajo</span>
    return <span className="badge badge-green">Disponible</span>
  }

  return (
    <>
      <div className="page-head">
        <p><b>{productos.length}</b> {productos.length === 1 ? 'producto' : 'productos'} en el catálogo</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={abrirNuevo}>
            <Icon name="plus" />Nuevo producto
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-icon" style={{ maxWidth: 340, width: '100%' }}>
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-body-flush table-wrap">
          {loading ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="refresh" /></span>
              <h3>Cargando productos…</h3>
            </div>
          ) : error ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="alert-triangle" /></span>
              <h3>{error}</h3>
              <button className="btn btn-secondary" onClick={() => cargar(busqueda.trim())}>Reintentar</button>
            </div>
          ) : productos.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="box" /></span>
              <h3>{busqueda ? 'Sin resultados' : 'Aún no hay productos'}</h3>
              <p>
                {busqueda
                  ? 'No encontramos productos con ese nombre.'
                  : 'Empieza agregando tu primer producto al inventario.'}
              </p>
              {!busqueda && (
                <button className="btn btn-primary" onClick={abrirNuevo}>
                  <Icon name="plus" />Nuevo producto
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Stock actual</th>
                  <th className="num">Mínimo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const actual = Number(p.stock_actual) || 0
                  const min = Number(p.stock_minimo) || 0
                  const fill = min > 0 ? Math.min(100, Math.round((actual / min) * 50)) : actual > 0 ? 100 : 0
                  const barClass = actual <= 0 ? 'crit' : p.stock_bajo ? 'low' : ''
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="td-strong">{p.nombre}</span>
                        {p.descripcion && <span className="td-sub">{p.descripcion}</span>}
                      </td>
                      <td>{p.unidad_medida_display}</td>
                      <td>
                        <div style={{ minWidth: 130 }}>
                          <div className="num" style={{ marginBottom: 5 }}>{actual} {p.unidad_medida}</div>
                          <div className={`stockbar ${barClass}`}><span style={{ width: `${fill}%` }}></span></div>
                        </div>
                      </td>
                      <td className="num">{min}</td>
                      <td>{filaEstado(p)}</td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn" title="Ver detalle" onClick={() => navigate(`/productos/${p.id}`)}>
                            <Icon name="eye" />
                          </button>
                          <button className="icon-btn" title="Editar" onClick={() => abrirEditar(p)}>
                            <Icon name="pencil" />
                          </button>
                          <button className="icon-btn" title="Desactivar" onClick={() => handleDelete(p)}>
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAbierto && (
        <ProductoModal producto={editando} onClose={() => setModalAbierto(false)} onSaved={onSaved} />
      )}
    </>
  )
}