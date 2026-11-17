import { useEffect, useState, type FormEvent } from 'react'
import Icon from './Icon'
import type { Categoria, Producto, Proveedor } from '../api/types'
import {
  createProducto,
  updateProducto,
  apiErrorMessage,
  type ProductoInput,
} from '../api/productos'
import { categoriasApi } from '../api/categorias'
import { proveedoresApi } from '../api/proveedores'
import { toast } from '../lib/toast'

const UNIDADES = [
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'lb', label: 'Libra (lb)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'und', label: 'Unidad (und)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
]

type Props = {
  producto: Producto | null
  onClose: () => void
  onSaved: () => void
}

export default function ProductoModal({ producto, onClose, onSaved }: Props) {
  const esEdicion = producto !== null

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [unidad, setUnidad] = useState('und')
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [saving, setSaving] = useState(false)
  const [errorNombre, setErrorNombre] = useState('')
  const [errorCategoria, setErrorCategoria] = useState('')
  const [categoria, setCategoria] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  // Opciones de los desplegables (solo categorías y proveedores activos).
  useEffect(() => {
    categoriasApi.listar().then(setCategorias).catch(() => {})
    proveedoresApi.listar().then(setProveedores).catch(() => {})
  }, [])

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre)
      setDescripcion(producto.descripcion || '')
      setUnidad(producto.unidad_medida)
      setStockActual(String(producto.stock_actual))
      setStockMinimo(String(producto.stock_minimo))
      setCategoria(producto.categoria)
      setProveedor(producto.proveedor ?? '')
    }
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [producto])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setErrorNombre('El nombre es obligatorio.')
      return
    }
    if (!categoria) {
      setErrorCategoria('Selecciona una categoría.')
      return
    }

    setSaving(true)
    try {
      if (esEdicion && producto) {
        await updateProducto(producto.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          unidad_medida: unidad,
          stock_minimo: stockMinimo,
          categoria,
          proveedor: proveedor || null,
        })
        toast('Producto actualizado correctamente.', 'success')
      } else {
        const data: ProductoInput = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          unidad_medida: unidad,
          stock_actual: stockActual,
          stock_minimo: stockMinimo,
          categoria,
          proveedor: proveedor || null,
        }
        await createProducto(data)
        toast('Producto creado correctamente.', 'success')
      }
      onSaved()
    } catch (err) {
      const msg = apiErrorMessage(err, 'No se pudo guardar el producto.')
      setErrorNombre(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className={`field field-full ${errorNombre ? 'invalid' : ''}`}>
                <label htmlFor="p-nombre">Nombre</label>
                <input
                  className="input"
                  id="p-nombre"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value)
                    if (errorNombre) setErrorNombre('')
                  }}
                  placeholder="Ej: Manzana orgánica"
                />
                <span className="error">
                  <Icon name="info" />
                  <span className="err-text">{errorNombre}</span>
                </span>
              </div>

              <div className={`field ${errorCategoria ? 'invalid' : ''}`}>
                <label htmlFor="p-categoria">Categoría</label>
                <select
                  className="input"
                  id="p-categoria"
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value)
                    if (errorCategoria) setErrorCategoria('')
                  }}
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <span className="error">
                  <Icon name="info" />
                  <span className="err-text">{errorCategoria}</span>
                </span>
              </div>

              <div className="field">
                <label htmlFor="p-proveedor">Proveedor</label>
                <select
                  className="input"
                  id="p-proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="p-unidad">Unidad de medida</label>
                <select
                  className="input"
                  id="p-unidad"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                >
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="p-min">Stock mínimo</label>
                <input
                  className="input"
                  id="p-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>

              {!esEdicion && (
                <div className="field">
                  <label htmlFor="p-actual">Stock inicial</label>
                  <input
                    className="input"
                    id="p-actual"
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              )}

              <div className="field field-full">
                <label htmlFor="p-desc">
                  Descripción <span className="hint">(opcional)</span>
                </label>
                <textarea
                  className="input"
                  id="p-desc"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles del producto…"
                ></textarea>
              </div>
            </div>

            {esEdicion && (
              <div className="alert alert-info" style={{ marginTop: 4, marginBottom: 0 }}>
                <Icon name="info" />
                El stock actual solo cambia registrando entradas y salidas.
              </div>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving}>
              {esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}