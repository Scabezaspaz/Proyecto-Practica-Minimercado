import api from './client'
import type { Movimiento } from './types'

export interface MovimientoFiltros {
  producto?: string
  tipo?: '' | 'ENTRADA' | 'SALIDA'
  usuario?: string
}

export interface MovimientoInput {
  producto: string
  tipo_movimiento: 'ENTRADA' | 'SALIDA'
  cantidad: string
  observacion: string
}

export async function getMovimientos(filtros: MovimientoFiltros = {}): Promise<Movimiento[]> {
  const params: Record<string, string> = {}
  if (filtros.producto) params.producto = filtros.producto
  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.usuario) params.usuario = filtros.usuario
  const res = await api.get<Movimiento[]>('/movimientos/', { params })
  return res.data
}

export async function createMovimiento(data: MovimientoInput): Promise<Movimiento> {
  const res = await api.post<Movimiento>('/movimientos/', data)
  return res.data
}