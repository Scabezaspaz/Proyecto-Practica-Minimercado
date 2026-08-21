# Sistema Web de Gestión de Inventario para el Mini Mercado Ecológico

Proyecto de práctica empresarial desarrollado para la Universidad Alexander von Humboldt.

## Tecnologías

- Python
- Django (arquitectura MTV con plantillas server-side)
- PostgreSQL

> Nota: La interfaz se genera con plantillas de Django (HTML renderizado en el servidor). El proyecto no utiliza un frontend separado (React/Vue) ni una API REST.

## Objetivo

Desarrollar un sistema web para la gestión de inventario del Mini Mercado Ecológico, permitiendo controlar existencias, registrar movimientos y generar alertas de stock bajo.

## Funcionalidades

- Autenticación de usuarios.
- Gestión de productos (crear, editar, consultar).
- Registro de entradas y salidas de inventario con actualización automática de stock.
- Historial de movimientos con búsqueda, filtros y paginación.
- Alertas de stock bajo.
- Dashboard con indicadores generales.

## Cómo ejecutar el proyecto

La aplicación vive en la carpeta `backend/`. Consulta las instrucciones de instalación y ejecución en:

**[backend/README.md](backend/README.md)**

## Estructura del repositorio

- `backend/` — Aplicación Django (código del sistema).
- `database/` — Modelo de datos.
- `docs/` — Documentación del proyecto (requisitos, diagramas, reuniones).