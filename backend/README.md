# Backend — Sistema de Gestión de Inventario

Aplicación Django para la gestión de inventario del Mini Mercado Ecológico.

## Requisitos previos

- Python 3.13 (o superior)
- PostgreSQL instalado y en ejecución

## 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd Proyecto-Practica-Minimercado
```

## 2. Crear y activar el entorno virtual

Desde la raíz del proyecto:

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Sabrás que está activo porque verás `(.venv)` al inicio de la línea.

## 3. Instalar las dependencias

```bash
cd backend
pip install -r requirements.txt
```

## 4. Configurar las variables de entorno

El proyecto lee su configuración desde un archivo `.env` (que no se sube al repositorio por seguridad).

1. Copia la plantilla:

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```

   **Linux / macOS:**
   ```bash
   cp .env.example .env
   ```

2. Genera una clave secreta nueva:

   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

3. Abre el archivo `.env` y completa los valores:

   ```env
   DJANGO_SECRET_KEY=pega-aqui-la-clave-generada
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

   DB_NAME=minimercado_db
   DB_USER=postgres
   DB_PASSWORD=tu-contraseña-de-postgres
   DB_HOST=localhost
   DB_PORT=5432
   ```

   > Ajusta `DB_PASSWORD` y `DB_PORT` según tu instalación de PostgreSQL.

## 5. Crear la base de datos

En PostgreSQL, crea una base de datos con el mismo nombre que pusiste en `DB_NAME`:

```sql
CREATE DATABASE minimercado_db;
```

## 6. Aplicar las migraciones

```bash
python manage.py migrate
```

## 7. Crear un usuario administrador

```bash
python manage.py createsuperuser
```

Sigue las instrucciones para definir usuario y contraseña.

## 8. Ejecutar el servidor

```bash
python manage.py runserver
```

La aplicación quedará disponible en:

- Sistema: http://localhost:8000
- Panel de administración: http://localhost:8000/admin/

## Ejecutar las pruebas

El proyecto incluye pruebas automatizadas de los modelos y del control de acceso:

```bash
python manage.py test
```

## Estructura del backend

```
backend/
├── config/          # Configuración del proyecto (settings, urls, wsgi/asgi)
├── inventario/      # Aplicación principal
│   ├── models.py    # Modelos: Producto y Movimiento
│   ├── views.py     # Vistas (lógica de las páginas)
│   ├── forms.py     # Formularios
│   ├── admin.py     # Configuración del panel de administración
│   ├── tests.py     # Pruebas automatizadas
│   └── templates/   # Plantillas HTML
├── manage.py        # Utilidad de línea de comandos de Django
├── requirements.txt # Dependencias del proyecto
└── .env.example     # Plantilla de variables de entorno
```