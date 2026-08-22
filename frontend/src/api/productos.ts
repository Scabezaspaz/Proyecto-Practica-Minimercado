import api from './client'
import type { Producto } from './types'

export interface ProductoInput {
  nombre: string
  descripcion: string
  unidad_medida: string
  stock_minimo: string
  stock_actual?: string // solo se envía al crear
}

export async function getProductos(q = ''): Promise<Producto[]> {
  const res = await api.get<Producto[]>('/productos/', { params: q ? { q } : {} })
  return res.data
}

export async function createProducto(data: ProductoInput): Promise<Producto> {
  const res = await api.post<Producto>('/productos/', data)
  return res.data
}

// Usamos PATCH: así no exige reenviar el stock_actual (que no se edita).
export async function updateProducto(
  id: string,
  data: Omit<ProductoInput, 'stock_actual'>,
): Promise<Producto> {
  const res = await api.patch<Producto>(`/productos/${id}/`, data)
  return res.data
}

export async function deleteProducto(id: string): Promise<void> {
  await api.delete(`/productos/${id}/`)
}

// Convierte un error de la API (DRF) en un mensaje legible.
export function apiErrorMessage(err: unknown, fallback = 'Ocurrió un error.'): string {
  const anyErr = err as { response?: { data?: unknown } }
  const data = anyErr?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    const parts: string[] = []
    for (const value of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(value)) parts.push(...value.map(String))
      else if (value) parts.push(String(value))
    }
    if (parts.length) return parts.join(' ')
  }
  return fallback
}