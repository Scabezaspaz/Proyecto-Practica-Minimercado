import api from './client'
import type { Movimiento } from './types'

export interface MovimientoFiltros {
  producto?: string
  producto_id?: string
  tipo?: '' | 'ENTRADA' | 'SALIDA'
  usuario?: string
}

export interface MovimientoInput {
  producto: string
  tipo_movimiento: 'ENTRADA' | 'SALIDA'
  cantidad: string
  observacion: string
  // Datos de factura (solo se envían en las entradas; opcionales).
  numero_factura?: string
  fecha_pago_factura?: string | null
  banco_pago?: string
  precio_factura?: string | null
}

export async function getMovimientos(filtros: MovimientoFiltros = {}): Promise<Movimiento[]> {
  const params: Record<string, string> = {}
  if (filtros.producto) params.producto = filtros.producto
  if (filtros.producto_id) params.producto_id = filtros.producto_id
  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.usuario) params.usuario = filtros.usuario
  const res = await api.get<Movimiento[]>('/movimientos/', { params })
  return res.data
}

export async function createMovimiento(data: MovimientoInput): Promise<Movimiento> {
  const res = await api.post<Movimiento>('/movimientos/', data)
  return res.data
}
