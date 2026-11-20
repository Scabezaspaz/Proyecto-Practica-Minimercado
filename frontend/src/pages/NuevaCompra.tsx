import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductPicker from '../components/ProductPicker'
import { CantidadInput, PesosInput } from '../components/NumeroInput'
import { createCompra } from '../api/compras'
import { getProductos } from '../api/productos'
import { proveedoresApi } from '../api/proveedores'
import { apiErrorMessage } from '../api/errors'
import { fmtMoneda, hoyISO } from '../lib/format'
import { cantidadAApi, cantidadANumero, pesosAApi, pesosANumero } from '../lib/numeros'
import { toast } from '../lib/toast'
import type { Producto, Proveedor } from '../api/types'

type Linea = { key: number; producto: string; cantidad: string; precio: string }

let siguienteKey = 1
const lineaVacia = (): Linea => ({ key: siguienteKey++, producto: '', cantidad: '', precio: '' })

function subtotal(l: Linea): number {
  return Math.round(cantidadANumero(l.cantidad) * pesosANumero(l.precio) * 100) / 100
}

export default function NuevaCompra() {
  const navigate = useNavigate()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [proveedor, setProveedor] = useState('')
  const [factura, setFactura] = useState('')
  const [fechaCompra, setFechaCompra] = useState(hoyISO())
  const [fechaPago, setFechaPago] = useState('')
  const [banco, setBanco] = useState('')
  const [observacion, setObservacion] = useState('')
  const [lineas, setLineas] = useState<Linea[]>(() => [lineaVacia()])

  const [errores, setErrores] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    proveedoresApi.listar().then(setProveedores).catch(() => toast('No se pudieron cargar los proveedores.', 'error'))
    getProductos().then(setProductos).catch(() => toast('No se pudieron cargar los productos.', 'error'))
  }, [])

  function cambiarLinea(key: number, cambios: Partial<Linea>) {
    setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...cambios } : l)))
    if (errores.detalles) setErrores((e) => ({ ...e, detalles: '' }))
  }

  function quitarLinea(key: number) {
    setLineas((ls) => (ls.length === 1 ? [lineaVacia()] : ls.filter((l) => l.key !== key)))
  }

  // Cada línea solo ofrece productos que no estén ya en otra línea.
  function disponiblesPara(linea: Linea) {
    const usados = new Set(lineas.filter((l) => l.key !== linea.key).map((l) => l.producto))
    return productos.filter((p) => !usados.has(p.id))
  }

  const total = lineas.reduce((acc, l) => acc + subtotal(l), 0)

  function validar(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!proveedor) e.proveedor = 'Selecciona un proveedor.'
    if (fechaCompra && fechaCompra > hoyISO()) e.fecha_compra = 'La fecha de compra no puede ser futura.'
    const completas = lineas.filter((l) => l.producto)
    if (completas.length === 0) e.detalles = 'Agrega al menos un producto a la compra.'
    else if (completas.some((l) => !(cantidadANumero(l.cantidad) > 0)))
      e.detalles = 'La cantidad de cada producto debe ser mayor que cero.'
    else if (completas.some((l) => pesosAApi(l.precio) === ''))
      e.detalles = 'Indica el precio unitario de cada producto.'
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const locales = validar()
    if (Object.keys(locales).length) {
      setErrores(locales)
      return
    }

    setSaving(true)
    try {
      const compra = await createCompra({
        proveedor,
        numero_factura: factura.trim(),
        fecha_compra: fechaCompra,
        fecha_pago: fechaPago || null,
        banco_pago: banco.trim(),
        observacion: observacion.trim(),
        detalles: lineas
          .filter((l) => l.producto)
          .map((l) => ({
            producto: l.producto,
            cantidad: cantidadAApi(l.cantidad),
            precio_unitario: pesosAApi(l.precio),
          })),
      })
      toast('Compra registrada. El stock se actualizó.', 'success')
      navigate(`/compras/${compra.id}`, { replace: true })
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      if (data && typeof data === 'object') {
        const porCampo: Record<string, string> = {}
        for (const [k, v] of Object.entries(data)) {
          porCampo[k] = Array.isArray(v) ? (typeof v[0] === 'string' ? v[0] : 'Revisa los productos de la compra.') : String(v)
        }
        setErrores(porCampo)
      }
      toast(apiErrorMessage(err, 'No se pudo registrar la compra.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  function errorDe(campo: string) {
    return (
      <span className="error">
        <Icon name="info" />
        <span className="err-text">{errores[campo]}</span>
      </span>
    )
  }

  function limpiar(campo: string) {
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: '' }))
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="page-head">
        <p>Registra lo que compraste a un proveedor. Cada producto genera una <b>entrada</b> de inventario.</p>
        <div className="page-actions">
          <Link className="btn btn-secondary" to="/compras">Cancelar</Link>
          <button type="submit" className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving}>
            <Icon name="check" />Registrar compra
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h2>Datos de la compra</h2>
            <p>Proveedor y factura</p>
          </div>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className={`field ${errores.proveedor ? 'invalid' : ''}`}>
              <label htmlFor="cp-proveedor">Proveedor</label>
              <select
                className="input"
                id="cp-proveedor"
                value={proveedor}
                onChange={(e) => {
                  setProveedor(e.target.value)
                  limpiar('proveedor')
                }}
              >
                <option value="" disabled>Selecciona un proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {errorDe('proveedor')}
            </div>

            <div className={`field ${errores.numero_factura ? 'invalid' : ''}`}>
              <label htmlFor="cp-factura">N.º de factura <span className="hint">(opcional)</span></label>
              <input className="input" id="cp-factura" maxLength={50} value={factura} placeholder="Ej: FV-1024"
                onChange={(e) => {
                  setFactura(e.target.value)
                  limpiar('numero_factura')
                }} />
              {errorDe('numero_factura')}
            </div>

            <div className={`field ${errores.fecha_compra ? 'invalid' : ''}`}>
              <label htmlFor="cp-fecha">Fecha de compra</label>
              <input className="input" id="cp-fecha" type="date" max={hoyISO()} value={fechaCompra}
                onChange={(e) => {
                  setFechaCompra(e.target.value)
                  limpiar('fecha_compra')
                }} />
              {errorDe('fecha_compra')}
            </div>

            <div className="field">
              <label htmlFor="cp-pago">Fecha de pago <span className="hint">(opcional)</span></label>
              <input className="input" id="cp-pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="cp-banco">Banco / medio de pago <span className="hint">(opcional)</span></label>
              <input className="input" id="cp-banco" maxLength={80} value={banco} placeholder="Ej: Bancolombia, efectivo…"
                onChange={(e) => setBanco(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="cp-obs">Observación <span className="hint">(opcional)</span></label>
              <input className="input" id="cp-obs" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Productos</h2>
            <p>Cantidad recibida y precio unitario</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLineas((ls) => [...ls, lineaVacia()])}>
            <Icon name="plus" />Agregar producto
          </button>
        </div>
        <div className="card-body-flush table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Producto</th>
                <th style={{ width: 140 }}>Cantidad</th>
                <th style={{ width: 170 }}>Precio unitario</th>
                <th className="num">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => {
                const prod = productos.find((p) => p.id === l.producto)
                return (
                  <tr key={l.key}>
                    <td>
                      <ProductPicker
                        productos={disponiblesPara(l)}
                        value={l.producto}
                        onChange={(id) => cambiarLinea(l.key, { producto: id })}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CantidadInput aria-label="Cantidad" value={l.cantidad} placeholder="0"
                          onChange={(v) => cambiarLinea(l.key, { cantidad: v })} />
                        <span className="hint">{prod?.unidad_medida}</span>
                      </div>
                    </td>
                    <td>
                      <PesosInput aria-label="Precio unitario" value={l.precio} placeholder="Ej: 1.200"
                        onChange={(v) => cambiarLinea(l.key, { precio: v })} />
                    </td>
                    <td className="num">{fmtMoneda(subtotal(l))}</td>
                    <td>
                      <div className="actions">
                        <button type="button" className="icon-btn" title="Quitar" onClick={() => quitarLinea(l.key)}>
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right' }}><b>Total</b></td>
                <td className="num"><b>{fmtMoneda(total)}</b></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {errores.detalles && (
          <div className="card-body">
            <div className="alert alert-danger" style={{ margin: 0 }}>
              <Icon name="alert-triangle" />
              {errores.detalles}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
