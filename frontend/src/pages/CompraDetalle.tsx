import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { getCompra } from '../api/compras'
import { fmtFecha, fmtMoneda } from '../lib/format'
import type { Compra } from '../api/types'

export default function CompraDetalle() {
  const { id = '' } = useParams()
  const [compra, setCompra] = useState<Compra | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    getCompra(id)
      .then((c) => vigente && setCompra(c))
      .catch(() => vigente && setError('No se encontró la compra.'))
    return () => {
      vigente = false
    }
  }, [id])

  if (error || !compra) {
    return (
      <div className="card">
        <div className="empty">
          <span className="empty-icon"><Icon name={error ? 'alert-triangle' : 'refresh'} /></span>
          <h3>{error || 'Cargando compra…'}</h3>
          {error && <Link className="btn btn-secondary" to="/compras">Volver a compras</Link>}
        </div>
      </div>
    )
  }

  const datos: [string, string][] = [
    ['Fecha de compra', fmtFecha(compra.fecha_compra)],
    ['Factura', compra.numero_factura || '—'],
    ['Fecha de pago', fmtFecha(compra.fecha_pago)],
    ['Banco / medio de pago', compra.banco_pago || '—'],
    ['Registrada por', compra.usuario_nombre],
  ]

  return (
    <>
      <div className="page-head">
        <p>
          <Link to="/compras">Compras</Link> / <b>{compra.proveedor_nombre}</b>
        </p>
        <div className="page-actions">
          <Link className="btn btn-primary" to="/compras/nueva">
            <Icon name="plus" />Nueva compra
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
            <div style={{ flex: '1 1 220px' }}>
              <div className="hint">Proveedor</div>
              <div className="td-strong" style={{ fontSize: 18 }}>{compra.proveedor_nombre}</div>
              {compra.observacion && <div className="td-sub">{compra.observacion}</div>}
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {datos.map(([k, v]) => (
                <div key={k}>
                  <div className="hint">{k}</div>
                  <div>{v}</div>
                </div>
              ))}
              <div>
                <div className="hint">Total</div>
                <div className="num" style={{ fontSize: 20 }}>{fmtMoneda(compra.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Productos comprados</h2>
            <p>Cada línea generó una entrada de inventario</p>
          </div>
        </div>
        <div className="card-body-flush table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio unitario</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {compra.detalles.map((d) => (
                <tr key={d.id}>
                  <td><Link className="td-strong" to={`/productos/${d.producto}`}>{d.producto_nombre}</Link></td>
                  <td className="num">{Number(d.cantidad)} {d.unidad_medida}</td>
                  <td className="num">{fmtMoneda(d.precio_unitario)}</td>
                  <td className="num">{fmtMoneda(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right' }}><b>Total</b></td>
                <td className="num"><b>{fmtMoneda(compra.total)}</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}
