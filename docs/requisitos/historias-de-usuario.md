# Historias de Usuario

## HU01 - Iniciar sesión

Como usuario autorizado

Quiero iniciar sesión en el sistema

Para acceder a las funcionalidades de gestión de inventario.

### Criterios de aceptación

- Debe solicitar usuario y contraseña.
- Debe validar las credenciales.
- Debe permitir el acceso únicamente a usuarios autorizados.

---

## HU02 - Registrar productos

Como administrador

Quiero registrar productos

Para llevar control de los artículos almacenados.

### Criterios de aceptación

- Debe permitir ingresar nombre del producto.
- Debe permitir definir stock mínimo.
- Debe almacenar la información correctamente.

---

## HU03 - Consultar productos

Como administrador

Quiero consultar los productos registrados

Para conocer la información disponible en inventario.

### Criterios de aceptación

- Debe mostrar la lista de productos.
- Debe mostrar existencias actuales.

---

## HU04 - Registrar entradas

Como administrador

Quiero registrar entradas de inventario

Para actualizar las existencias disponibles.

### Criterios de aceptación

- Debe permitir seleccionar un producto.
- Debe registrar la cantidad ingresada.
- Debe actualizar el stock automáticamente.

---

## HU05 - Registrar salidas

Como administrador

Quiero registrar salidas de inventario

Para reflejar el consumo o venta de productos.

### Criterios de aceptación

- Debe permitir seleccionar un producto.
- Debe registrar la cantidad retirada.
- Debe actualizar el stock automáticamente.

---

## HU06 - Consultar movimientos

Como administrador

Quiero consultar el historial de movimientos

Para conocer las entradas y salidas realizadas.

### Criterios de aceptación

- Debe mostrar fecha.
- Debe mostrar tipo de movimiento.
- Debe mostrar cantidad registrada.

---

## HU07 - Recibir alertas de stock bajo

Como administrador

Quiero recibir alertas cuando el stock sea bajo

Para tomar acciones antes de quedarme sin existencias.

### Criterios de aceptación

- Debe comparar stock actual contra stock mínimo.
- Debe mostrar alertas visibles al usuario.

---

## HU08 - Visualizar dashboard

Como administrador

Quiero visualizar información resumida

Para conocer rápidamente el estado del inventario.

### Criterios de aceptación

- Debe mostrar total de productos.
- Debe mostrar productos con stock bajo.
- Debe mostrar movimientos recientes.