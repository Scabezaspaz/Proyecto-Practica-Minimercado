import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import CategoriaModal from '../components/CategoriaModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { categoriasApi } from '../api/categorias'
import { apiErrorMessage } from '../api/errors'
import { useListado } from '../hooks/useListado'
import { toast } from '../lib/toast'
import type { Categoria } from '../api/types'

const POR_PAGINA = 30

export default function Categorias() {
  const consultar = useCallback((q: string) => categoriasApi.listar({ q }), [])
  const { items: categorias, loading, error, busqueda, setBusqueda, recargar } =
    useListado(consultar, 'No se pudieron cargar las categorías.')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [aDesactivar, setADesactivar] = useState<Categoria | null>(null)
  const [pagina, setPagina] = useState(1)

  function abrirModal(c: Categoria | null) {
    setEditando(c)
    setModalAbierto(true)
  }

  function onSaved() {
    setModalAbierto(false)
    recargar()
  }

  async function confirmarDesactivar() {
    const c = aDesactivar
    if (!c) return
    setADesactivar(null)
    try {
      await categoriasApi.desactivar(c.id)
      toast('Categoría desactivada.', 'success')
      recargar()
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo desactivar la categoría.'), 'error')
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(categorias.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginadas = categorias.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <>
      <div className="page-head">
        <p><b>{categorias.length}</b> {categorias.length === 1 ? 'categoría' : 'categorías'} registradas</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => abrirModal(null)}>
            <Icon name="plus" />Nueva categoría
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-icon" style={{ maxWidth: 340, width: '100%' }}>
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar categoría…"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-body-flush table-wrap">
          {loading ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="refresh" /></span>
              <h3>Cargando categorías…</h3>
            </div>
          ) : error ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="alert-triangle" /></span>
              <h3>{error}</h3>
              <button className="btn btn-secondary" onClick={recargar}>Reintentar</button>
            </div>
          ) : categorias.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="layers" /></span>
              <h3>{busqueda ? 'Sin resultados' : 'Aún no hay categorías'}</h3>
              <p>
                {busqueda
                  ? 'No encontramos categorías con ese nombre.'
                  : 'Crea categorías para organizar los productos del inventario.'}
              </p>
              {!busqueda && (
                <button className="btn btn-primary" onClick={() => abrirModal(null)}>
                  <Icon name="plus" />Nueva categoría
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th className="num">Productos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="td-strong">{c.nombre}</span>
                      {c.descripcion && <span className="td-sub">{c.descripcion}</span>}
                    </td>
                    <td className="num">
                      {c.total_productos > 0 ? (
                        <Link to={`/productos?categoria=${c.id}`} title="Ver productos de esta categoría">
                          {c.total_productos}
                        </Link>
                      ) : (
                        0
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" title="Editar" onClick={() => abrirModal(c)}>
                          <Icon name="pencil" />
                        </button>
                        <button className="icon-btn" title="Desactivar" onClick={() => setADesactivar(c)}>
                          <Icon name="trash" />
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
          <Pagination page={paginaActual} pageSize={POR_PAGINA} total={categorias.length} onChange={setPagina} />
        )}
      </div>

      {modalAbierto && (
        <CategoriaModal categoria={editando} onClose={() => setModalAbierto(false)} onSaved={onSaved} />
      )}

      {aDesactivar && (
        <ConfirmDialog
          title="Desactivar categoría"
          message={
            aDesactivar.total_productos > 0
              ? `"${aDesactivar.nombre}" tiene ${aDesactivar.total_productos} producto(s) activo(s). Reasígnalos a otra categoría antes de desactivarla.`
              : `¿Seguro que deseas desactivar "${aDesactivar.nombre}"?`
          }
          confirmLabel="Desactivar"
          tone="danger"
          onConfirm={confirmarDesactivar}
          onCancel={() => setADesactivar(null)}
        />
      )}
    </>
  )
}
