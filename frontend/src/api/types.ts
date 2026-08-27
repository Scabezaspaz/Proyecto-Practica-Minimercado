// Tipos que reflejan lo que devuelve la API (serializers de Django).

export interface Producto {
  id: string
  nombre: string
  descripcion: string
  unidad_medida: string
  unidad_medida_display: string
  stock_actual: number
  stock_minimo: number
  stock_bajo: boolean
  activo: boolean
  fecha_creacion: string
}

export interface Movimiento {
  id: string
  producto: string
  producto_nombre: string
  usuario: number
  usuario_nombre: string
  tipo_movimiento: 'ENTRADA' | 'SALIDA'
  tipo_movimiento_display: string
  cantidad: number
  observacion: string
  numero_factura: string
  fecha_pago_factura: string | null
  banco_pago: string
  precio_factura: string | null
  fecha_movimiento: string
}

export interface DashboardData {
  total_productos: number
  productos_stock_bajo: number
  total_movimientos: number
  productos_stock_bajo_lista: Producto[]
  ultimos_movimientos: Movimiento[]
}