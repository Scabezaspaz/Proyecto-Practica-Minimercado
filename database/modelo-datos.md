# Modelo de Datos

## Descripción General

El sistema de gestión de inventario permite administrar productos y registrar los movimientos de entrada y salida realizados por los usuarios autorizados.

---

## Usuario

### Descripción

Representa al administrador o usuario autorizado que realiza operaciones dentro del sistema.

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | VARCHAR |
| correo | VARCHAR |
| password | VARCHAR |
| fecha_creacion | TIMESTAMP |

---

## Producto

### Descripción

Representa un producto almacenado dentro del inventario.

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | VARCHAR |
| descripcion | TEXT |
| unidad_medida | VARCHAR |
| stock_actual | DECIMAL |
| stock_minimo | DECIMAL |
| activo | BOOLEAN |
| fecha_creacion | TIMESTAMP |

---

## Movimiento

### Descripción

Representa una entrada o salida de inventario asociada a un producto y registrada por un usuario.

| Campo | Tipo |
|---------|---------|
| id | UUID |
| producto_id | UUID |
| usuario_id | UUID |
| tipo_movimiento | VARCHAR |
| cantidad | DECIMAL |
| observacion | TEXT |
| fecha_movimiento | TIMESTAMP |

---

# Relaciones

Producto (1) ---- (N) Movimiento

Usuario (1) ---- (N) Movimiento

---

# Reglas de Negocio

- Un producto puede tener múltiples movimientos de inventario.
- Un movimiento debe estar asociado a un único producto.
- Un usuario puede registrar múltiples movimientos.
- Un movimiento debe estar asociado a un único usuario.
- El stock actual del producto debe actualizarse cada vez que se registre un movimiento.
- El sistema debe alertar cuando el stock actual sea menor o igual al stock mínimo definido.