# Modelo de Datos

## Usuario

- id
- nombre
- correo
- contraseña
- rol
- fecha_creacion

---

## Producto

- id
- nombre
- descripcion
- unidad_medida
- stock_actual
- stock_minimo
- activo
- fecha_creacion

---

## Movimiento

- id
- producto_id
- usuario_id
- tipo_movimiento
- cantidad
- observacion
- fecha_movimiento