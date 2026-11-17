import api from './client'
import type { Producto } from './types'

export interface ProductoInput {
  nombre: string
  descripcion: string
  unidad_medida: string
  stock_minimo: string
  stock_actual?: string // solo se envía al crear
  categoria: string
  proveedor: string | null
}

export interface FiltrosProducto {
  categoria?: string
  proveedor?: string
}

export async function getProductos(q = '', filtros: FiltrosProducto = {}): Promise<Producto[]> {
  const params: Record<string, string> = {}
  if (q) params.q = q
  if (filtros.categoria) params.categoria = filtros.categoria
  if (filtros.proveedor) params.proveedor = filtros.proveedor
  const res = await api.get<Producto[]>('/productos/', { params })
  return res.data
}

export async function getProducto(id: string): Promise<Producto> {
  const res = await api.get<Producto>(`/productos/${id}/`)
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

// Se re-exporta para no romper los imports existentes.
export { apiErrorMessage } from './errors'
