// Tipos que reflejan lo que devuelve la API (serializers de Django).

export interface Producto {
  id: string
  nombre: string
  descripcion: string
  unidad_medida: string
  unidad_medida_display: string
  categoria: string
  categoria_nombre: string
  proveedor: string | null
  proveedor_nombre: string | null
  stock_actual: number
  stock_minimo: number
  stock_bajo: boolean
  activo: boolean
  fecha_creacion: string
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string
  total_productos: number
  activo: boolean
  fecha_creacion: string
}

export interface Proveedor {
  id: string
  nombre: string
  nit: string
  contacto: string
  telefono: string
  correo: string
  direccion: string
  total_productos: number
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
  compra: string | null // compra que generó esta entrada (si aplica)
  fecha_movimiento: string
}

export interface DashboardData {
  total_productos: number
  productos_stock_bajo: number
  total_movimientos: number
  productos_stock_bajo_lista: Producto[]
  ultimos_movimientos: Movimiento[]
}
export interface DetalleCompra {
  id: string
  producto: string
  producto_nombre: string
  unidad_medida: string
  cantidad: string
  precio_unitario: string
  subtotal: string
  movimiento: string
}

export interface Compra {
  id: string
  proveedor: string
  proveedor_nombre: string
  usuario: number
  usuario_nombre: string
  numero_factura: string
  fecha_compra: string
  fecha_pago: string | null
  banco_pago: string
  observacion: string
  total: string
  total_items: number
  detalles: DetalleCompra[]
  fecha_registro: string
}
