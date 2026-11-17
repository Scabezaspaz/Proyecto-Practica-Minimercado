import { useState, type FormEvent } from 'react'
import Icon from './Icon'
import FormModal from './FormModal'
import type { Proveedor } from '../api/types'
import { proveedoresApi, type ProveedorInput } from '../api/proveedores'
import { apiErrorMessage } from '../api/errors'
import { toast } from '../lib/toast'

type Props = {
  proveedor: Proveedor | null
  onClose: () => void
  onSaved: () => void
}

type Campo = keyof ProveedorInput

const VACIO: ProveedorInput = {
  nombre: '',
  nit: '',
  contacto: '',
  telefono: '',
  correo: '',
  direccion: '',
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ProveedorModal({ proveedor, onClose, onSaved }: Props) {
  const esEdicion = proveedor !== null
  const [form, setForm] = useState<ProveedorInput>(() =>
    proveedor
      ? {
          nombre: proveedor.nombre,
          nit: proveedor.nit,
          contacto: proveedor.contacto,
          telefono: proveedor.telefono,
          correo: proveedor.correo,
          direccion: proveedor.direccion,
        }
      : VACIO,
  )
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({})
  const [saving, setSaving] = useState(false)

  function cambiar(campo: Campo, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: '' }))
  }

  function validar(datos: ProveedorInput) {
    const e: Partial<Record<Campo, string>> = {}
    if (!datos.nombre) e.nombre = 'El nombre es obligatorio.'
    if (datos.correo && !CORREO_VALIDO.test(datos.correo)) e.correo = 'Ingresa un correo válido.'
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const datos = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()]),
    ) as ProveedorInput

    const locales = validar(datos)
    if (Object.keys(locales).length) {
      setErrores(locales)
      return
    }

    setSaving(true)
    try {
      if (proveedor) {
        await proveedoresApi.actualizar(proveedor.id, datos)
        toast('Proveedor actualizado correctamente.', 'success')
      } else {
        await proveedoresApi.crear(datos)
        toast('Proveedor creado correctamente.', 'success')
      }
      onSaved()
    } catch (err) {
      // Muestra cada error de la API junto a su campo.
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data && typeof data === 'object') {
        const porCampo: Partial<Record<Campo, string>> = {}
        for (const campo of Object.keys(VACIO) as Campo[]) {
          if (data[campo]) porCampo[campo] = String(data[campo][0] ?? data[campo])
        }
        setErrores(porCampo)
      }
      toast(apiErrorMessage(err, 'No se pudo guardar el proveedor.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  function campo(id: Campo, label: string, opts: { placeholder?: string; type?: string; full?: boolean; opcional?: boolean; max?: number } = {}) {
    const err = errores[id]
    return (
      <div className={`field ${opts.full ? 'field-full' : ''} ${err ? 'invalid' : ''}`}>
        <label htmlFor={`pv-${id}`}>
          {label} {opts.opcional && <span className="hint">(opcional)</span>}
        </label>
        <input
          className="input"
          id={`pv-${id}`}
          type={opts.type ?? 'text'}
          value={form[id]}
          maxLength={opts.max}
          onChange={(e) => cambiar(id, e.target.value)}
          placeholder={opts.placeholder}
        />
        <span className="error">
          <Icon name="info" />
          <span className="err-text">{err}</span>
        </span>
      </div>
    )
  }

  return (
    <FormModal
      title={esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
      submitLabel={esEdicion ? 'Guardar cambios' : 'Crear proveedor'}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="form-grid">
        {campo('nombre', 'Nombre o razón social', { full: true, placeholder: 'Ej: Finca La Esperanza', max: 150 })}
        {campo('nit', 'NIT / Documento', { opcional: true, placeholder: 'Ej: 900123456-7', max: 20 })}
        {campo('contacto', 'Persona de contacto', { opcional: true, placeholder: 'Ej: Ana Pérez', max: 100 })}
        {campo('telefono', 'Teléfono', { opcional: true, type: 'tel', placeholder: 'Ej: 300 123 4567', max: 20 })}
        {campo('correo', 'Correo', { opcional: true, type: 'email', placeholder: 'ventas@proveedor.com' })}
        {campo('direccion', 'Dirección', { opcional: true, full: true, placeholder: 'Ej: Vereda El Rosal, km 3', max: 200 })}
      </div>
    </FormModal>
  )
}
