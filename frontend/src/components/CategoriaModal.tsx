import { useState, type FormEvent } from 'react'
import Icon from './Icon'
import FormModal from './FormModal'
import type { Categoria } from '../api/types'
import { categoriasApi } from '../api/categorias'
import { apiErrorMessage } from '../api/errors'
import { toast } from '../lib/toast'

type Props = {
  categoria: Categoria | null
  onClose: () => void
  onSaved: () => void
}

export default function CategoriaModal({ categoria, onClose, onSaved }: Props) {
  const esEdicion = categoria !== null
  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [errorNombre, setErrorNombre] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setErrorNombre('El nombre es obligatorio.')
      return
    }

    const data = { nombre: nombre.trim(), descripcion: descripcion.trim() }
    setSaving(true)
    try {
      if (categoria) {
        await categoriasApi.actualizar(categoria.id, data)
        toast('Categoría actualizada correctamente.', 'success')
      } else {
        await categoriasApi.crear(data)
        toast('Categoría creada correctamente.', 'success')
      }
      onSaved()
    } catch (err) {
      const msg = apiErrorMessage(err, 'No se pudo guardar la categoría.')
      setErrorNombre(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormModal
      title={esEdicion ? 'Editar categoría' : 'Nueva categoría'}
      submitLabel={esEdicion ? 'Guardar cambios' : 'Crear categoría'}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="form-grid">
        <div className={`field field-full ${errorNombre ? 'invalid' : ''}`}>
          <label htmlFor="c-nombre">Nombre</label>
          <input
            className="input"
            id="c-nombre"
            value={nombre}
            maxLength={80}
            onChange={(e) => {
              setNombre(e.target.value)
              if (errorNombre) setErrorNombre('')
            }}
            placeholder="Ej: Frutas y verduras"
          />
          <span className="error">
            <Icon name="info" />
            <span className="err-text">{errorNombre}</span>
          </span>
        </div>

        <div className="field field-full">
          <label htmlFor="c-desc">
            Descripción <span className="hint">(opcional)</span>
          </label>
          <textarea
            className="input"
            id="c-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="¿Qué productos agrupa esta categoría?"
          ></textarea>
        </div>
      </div>
    </FormModal>
  )
}
