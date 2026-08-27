import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import MovimientoModal from '../components/MovimientoModal'
import Pagination from '../components/Pagination'
import { getMovimientos } from '../api/movimientos'
import type { Movimiento } from '../api/types'

const POR_PAGINA = 30

function fmtFechaHora(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${fecha} · ${hora}`
}

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'' | 'ENTRADA' | 'SALIDA'>('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipoModal, setTipoModal] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [pagina, setPagina] = useState(1)

  async function cargar() {
    try {
      setLoading(true)
      const data = await getMovimientos({ producto: filtroProducto.trim(), tipo: filtroTipo })
      setMovimientos(data)
      setError('')
    } catch {
      setError('No se pudieron cargar los movimientos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPagina(1)
    const t = setTimeout(() => cargar(), filtroProducto ? 350 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroProducto, filtroTipo])

  function abrir(tipo: 'ENTRADA' | 'SALIDA') {
    setTipoModal(tipo)
    setModalAbierto(true)
  }

  function onSaved() {
    setModalAbierto(false)
    cargar()
  }

  // Paginación (30 por página) en memoria.
  const totalPaginas = Math.max(1, Math.ceil(movimientos.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginados = movimientos.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <>
      <div className="page-head">
        <p><b>{movimientos.length}</b> {movimientos.length === 1 ? 'movimiento' : 'movimientos'} registrados</p>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => abrir('SALIDA')}>
            <Icon name="arrow-up" />Registrar salida
          </button>
          <button className="btn btn-primary" onClick={() => abrir('ENTRADA')}>
            <Icon name="arrow-down" />Registrar entrada
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-icon" style={{ maxWidth: 320, width: '100%' }}>
          <Icon name="search" />
          <input
            className="input"
            placeholder="Buscar por producto…"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as '' | 'ENTRADA' | 'SALIDA')}
        >
          <option value="">Todos los tipos</option>
          <option value="ENTRADA">Solo entradas</option>
          <option value="SALIDA">Solo salidas</option>
        </select>
      </div>

      <div className="card">
        <div className="card-body-flush table-wrap">
          {loading ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="refresh" /></span>
              <h3>Cargando movimientos…</h3>
            </div>
          ) : error ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="alert-triangle" /></span>
              <h3>{error}</h3>
              <button className="btn btn-secondary" onClick={() => cargar()}>Reintentar</button>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Icon name="clock" /></span>
              <h3>{filtroProducto || filtroTipo ? 'Sin resultados' : 'Aún no hay movimientos'}</h3>
              <p>
                {filtroProducto || filtroTipo
                  ? 'No encontramos movimientos con esos filtros.'
                  : 'Registra tu primera entrada o salida de inventario.'}
              </p>
              {!filtroProducto && !filtroTipo && (
                <button className="btn btn-primary" onClick={() => abrir('ENTRADA')}>
                  <Icon name="arrow-down" />Registrar entrada
                </button>
              )}
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
                {paginados.map((m) => (
                  <tr key={m.id}>
                    <td>{fmtFechaHora(m.fecha_movimiento)}</td>
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
                        <span className="ml-qty up">+{Number(m.cantidad)}</span>
                      ) : (
                        <span className="ml-qty down">−{Number(m.cantidad)}</span>
                      )}
                    </td>
                    <td>{m.usuario_nombre}</td>
                    <td>{m.observacion ? m.observacion : <span style={{ color: 'var(--subtle)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && !error && (
          <Pagination page={paginaActual} pageSize={POR_PAGINA} total={movimientos.length} onChange={setPagina} />
        )}
      </div>

      {modalAbierto && (
        <MovimientoModal tipoInicial={tipoModal} onClose={() => setModalAbierto(false)} onSaved={onSaved} />
      )}
    </>
  )
}