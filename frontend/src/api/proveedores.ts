import { crearRecursoApi } from './crud'
import type { Proveedor } from './types'

export interface ProveedorInput {
  nombre: string
  nit: string
  contacto: string
  telefono: string
  correo: string
  direccion: string
}

export const proveedoresApi = crearRecursoApi<Proveedor, ProveedorInput>('proveedores')
