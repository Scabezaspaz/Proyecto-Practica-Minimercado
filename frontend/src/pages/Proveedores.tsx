import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ProveedorModal from '../components/ProveedorModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { proveedoresApi } from '../api/proveedores'
import { apiErrorMessage } from '../api/errors'
import { useListado } from '../hooks/useListado'
import { toast } from '../lib/toast'
import type { Proveedor } from '../api/types'

const POR_PAGINA = 30

export default function Proveedores() {
  const consultar = useCallback((q: string) => proveedoresApi.listar({ q }), [])
  const { items: proveedores, loading, error, busqueda, setBusqueda, recargar } =
    useListado(consultar, 'No se pudieron cargar los proveedores.')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [aDesactivar, setADesactivar] = useState<Proveedor | null>(null)
  const [pagina, setPagina] = useState(1)

  function abrirModal(p: Proveedor | null) {
    setEditando(p)
    setModalAbierto(true)
  }

  function onSaved() {
    setModalAbierto(false)
    recargar()
  }

  async function confirmarDesactivar() {
    const p = aDesactivar
    if (!p) return
    setADesactivar(null)
    try {
      await proveedoresApi.desactivar(p.id)
      toast('Proveedor desactivado.', 'success')
      recargar()
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo desactivar el proveedor.'), 'error')
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(proveedores.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginados = proveedores.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <>
      <div className="page-head">
        <p><b>{proveedores.length}</b> {proveedores.length === 1 ? 'proveedor' : 'proveedores'} registrados</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => abrirModal(null)}>
            <Icon name="plus" />Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-icon" style={{ maxWidth: 340, width: '100%' }}>
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar por nombre, NIT o contacto…"
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
              <h3>Cargando proveedores…</h3>
            </div>
          ) : error ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="alert-triangle" /></span>
              <h3>{error}</h3>
              <button className="btn btn-secondary" onClick={recargar}>Reintentar</button>
            </div>
          ) : proveedores.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="truck" /></span>
              <h3>{busqueda ? 'Sin resultados' : 'Aún no hay proveedores'}</h3>
              <p>
                {busqueda
                  ? 'No encontramos proveedores con ese criterio.'
                  : 'Registra a quienes surten los productos del mercado.'}
              </p>
              {!busqueda && (
                <button className="btn btn-primary" onClick={() => abrirModal(null)}>
                  <Icon name="plus" />Nuevo proveedor
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th>Correo</th>
                  <th className="num">Productos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="td-strong">{p.nombre}</span>
                      {p.nit && <span className="td-sub">NIT {p.nit}</span>}
                    </td>
                    <td>
                      {p.contacto || <span className="hint">—</span>}
                      {p.telefono && <span className="td-sub">{p.telefono}</span>}
                    </td>
                    <td>{p.correo || <span className="hint">—</span>}</td>
                    <td className="num">
                      {p.total_productos > 0 ? (
                        <Link to={`/productos?proveedor=${p.id}`} title="Ver productos de este proveedor">
                          {p.total_productos}
                        </Link>
                      ) : (
                        0
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" title="Editar" onClick={() => abrirModal(p)}>
                          <Icon name="pencil" />
                        </button>
                        <button className="icon-btn" title="Desactivar" onClick={() => setADesactivar(p)}>
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
          <Pagination page={paginaActual} pageSize={POR_PAGINA} total={proveedores.length} onChange={setPagina} />
        )}
      </div>

      {modalAbierto && (
        <ProveedorModal proveedor={editando} onClose={() => setModalAbierto(false)} onSaved={onSaved} />
      )}

      {aDesactivar && (
        <ConfirmDialog
          title="Desactivar proveedor"
          message={
            aDesactivar.total_productos > 0
              ? `"${aDesactivar.nombre}" surte ${aDesactivar.total_productos} producto(s) activo(s). Reasígnalos a otro proveedor antes de desactivarlo.`
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
