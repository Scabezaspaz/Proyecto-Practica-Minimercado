import api from './client'
import type { Compra } from './types'

// Las compras solo se listan, consultan y registran: son inmutables
// porque ya generaron entradas de inventario (por eso no usan el
// cliente CRUD genérico, que incluye editar y desactivar).

export interface DetalleCompraInput {
  producto: string
  cantidad: string
  precio_unitario: string
}

export interface CompraInput {
  proveedor: string
  numero_factura: string
  fecha_compra: string
  fecha_pago: string | null
  banco_pago: string
  observacion: string
  detalles: DetalleCompraInput[]
}

export interface FiltrosCompra {
  q?: string
  proveedor?: string
  desde?: string
  hasta?: string
}

export async function getCompras(filtros: FiltrosCompra = {}): Promise<Compra[]> {
  const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
  const res = await api.get<Compra[]>('/compras/', { params })
  return res.data
}

export async function getCompra(id: string): Promise<Compra> {
  const res = await api.get<Compra>(`/compras/${id}/`)
  return res.data
}

export async function createCompra(data: CompraInput): Promise<Compra> {
  const res = await api.post<Compra>('/compras/', data)
  return res.data
}
