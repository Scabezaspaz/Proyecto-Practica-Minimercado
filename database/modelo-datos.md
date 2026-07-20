# Modelo de Datos

## Usuario

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | VARCHAR |
| correo | VARCHAR |
| password | VARCHAR |
| fecha_creacion | TIMESTAMP |

---

## Producto

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

Producto 1 ---- N Movimiento

Usuario 1 ---- N Movimiento