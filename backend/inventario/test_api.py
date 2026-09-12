"""
Pruebas de la API REST del sistema de gestión de inventario.

Cubren: autenticación por correo (JWT), recuperación de contraseña,
CRUD de productos, movimientos (entradas/salidas) y panel (dashboard).

Se ejecutan con:  pytest
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from .models import Producto, Movimiento

User = get_user_model()

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Autenticación por correo electrónico (JWT)
# ---------------------------------------------------------------------------
class TestLogin:

    URL = '/api/auth/login/'

    def test_login_correo_exitoso(self, api_client, usuario):
        resp = api_client.post(self.URL, {
            'correo': 'empleado@minimercado.com',
            'password': 'clave-segura-123',
        }, format='json')

        assert resp.status_code == 200
        assert 'access' in resp.data
        assert 'refresh' in resp.data
        assert resp.data['username'] == 'empleado'

    def test_login_correo_sin_importar_mayusculas(self, api_client, usuario):
        resp = api_client.post(self.URL, {
            'correo': 'EMPLEADO@MiniMercado.com',
            'password': 'clave-segura-123',
        }, format='json')

        assert resp.status_code == 200

    def test_login_password_incorrecta(self, api_client, usuario):
        resp = api_client.post(self.URL, {
            'correo': 'empleado@minimercado.com',
            'password': 'incorrecta',
        }, format='json')

        assert resp.status_code == 400

    def test_login_correo_inexistente(self, api_client, usuario):
        resp = api_client.post(self.URL, {
            'correo': 'noexiste@minimercado.com',
            'password': 'clave-segura-123',
        }, format='json')

        assert resp.status_code == 400

    def test_login_usuario_inactivo(self, api_client, usuario):
        usuario.is_active = False
        usuario.save()

        resp = api_client.post(self.URL, {
            'correo': 'empleado@minimercado.com',
            'password': 'clave-segura-123',
        }, format='json')

        assert resp.status_code == 400

    def test_refresh_token_entrega_nuevo_access(self, api_client, usuario):
        login = api_client.post(self.URL, {
            'correo': 'empleado@minimercado.com',
            'password': 'clave-segura-123',
        }, format='json')

        resp = api_client.post('/api/auth/refresh/', {
            'refresh': login.data['refresh'],
        }, format='json')

        assert resp.status_code == 200
        assert 'access' in resp.data


# ---------------------------------------------------------------------------
# Recuperación de contraseña
# ---------------------------------------------------------------------------
class TestRecuperarPassword:

    VERIFICAR = '/api/auth/password/verificar-correo/'
    RESTABLECER = '/api/auth/password/restablecer/'

    def test_verificar_correo_existente(self, api_client, usuario):
        resp = api_client.post(self.VERIFICAR, {
            'correo': 'empleado@minimercado.com',
        }, format='json')

        assert resp.status_code == 200
        assert resp.data['existe'] is True

    def test_verificar_correo_inexistente(self, api_client, usuario):
        resp = api_client.post(self.VERIFICAR, {
            'correo': 'otro@correo.com',
        }, format='json')

        assert resp.status_code == 200
        assert resp.data['existe'] is False

    def test_restablecer_password_exitoso(self, api_client, usuario):
        resp = api_client.post(self.RESTABLECER, {
            'correo': 'empleado@minimercado.com',
            'nueva_password': 'NuevaClave-2026',
        }, format='json')

        assert resp.status_code == 200
        usuario.refresh_from_db()
        assert usuario.check_password('NuevaClave-2026')

    def test_restablecer_correo_inexistente(self, api_client, usuario):
        resp = api_client.post(self.RESTABLECER, {
            'correo': 'noexiste@correo.com',
            'nueva_password': 'NuevaClave-2026',
        }, format='json')

        assert resp.status_code == 404

    def test_restablecer_password_debil_es_rechazada(self, api_client, usuario):
        resp = api_client.post(self.RESTABLECER, {
            'correo': 'empleado@minimercado.com',
            'nueva_password': '123',
        }, format='json')

        assert resp.status_code == 400
        usuario.refresh_from_db()
        # La contraseña original no cambió.
        assert usuario.check_password('clave-segura-123')


# ---------------------------------------------------------------------------
# API de Productos
# ---------------------------------------------------------------------------
class TestProductosAPI:

    URL = '/api/productos/'

    def test_listar_requiere_autenticacion(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401

    def test_crear_requiere_autenticacion(self, api_client):
        resp = api_client.post(self.URL, {
            'nombre': 'Pirata', 'descripcion': '', 'unidad_medida': 'kg',
            'stock_actual': '1.00', 'stock_minimo': '1.00',
        }, format='json')
        assert resp.status_code == 401

    def test_unidad_medida_invalida_es_rechazada(self, auth_client):
        resp = auth_client.post(self.URL, {
            'nombre': 'Café', 'descripcion': '', 'unidad_medida': 'xx',
            'stock_actual': '1.00', 'stock_minimo': '1.00',
        }, format='json')
        assert resp.status_code == 400

    def test_crear_producto(self, auth_client):
        resp = auth_client.post(self.URL, {
            'nombre': 'Lentejas',
            'descripcion': '',
            'unidad_medida': 'kg',
            'stock_actual': '5.00',
            'stock_minimo': '1.00',
        }, format='json')

        assert resp.status_code == 201
        assert Producto.objects.filter(nombre='Lentejas', activo=True).exists()

    def test_lista_solo_muestra_activos(self, auth_client, producto):
        Producto.objects.create(
            nombre='Inactivo', unidad_medida='und',
            stock_actual=Decimal('0'), stock_minimo=Decimal('0'),
            activo=False,
        )
        resp = auth_client.get(self.URL)
        nombres = [p['nombre'] for p in resp.data]

        assert resp.status_code == 200
        assert 'Maíz' in nombres
        assert 'Inactivo' not in nombres

    def test_busqueda_por_q(self, auth_client, producto):
        Producto.objects.create(
            nombre='Arroz', unidad_medida='kg',
            stock_actual=Decimal('8'), stock_minimo=Decimal('2'),
        )
        resp = auth_client.get(self.URL, {'q': 'arr'})
        nombres = [p['nombre'] for p in resp.data]

        assert resp.status_code == 200
        assert nombres == ['Arroz']

    def test_editar_no_cambia_stock_actual(self, auth_client, producto):
        resp = auth_client.patch(f'{self.URL}{producto.id}/', {
            'nombre': 'Maíz amarillo',
            'stock_actual': '999.00',
        }, format='json')

        assert resp.status_code == 200
        producto.refresh_from_db()
        assert producto.nombre == 'Maíz amarillo'
        # El stock NO se modifica al editar el producto.
        assert producto.stock_actual == Decimal('10.00')

    def test_desactivar_es_borrado_logico(self, auth_client, producto):
        resp = auth_client.delete(f'{self.URL}{producto.id}/')

        assert resp.status_code == 204
        producto.refresh_from_db()
        assert producto.activo is False

    def test_nombre_duplicado_es_rechazado(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'nombre': 'maíz',
            'descripcion': '',
            'unidad_medida': 'kg',
            'stock_actual': '3.00',
            'stock_minimo': '1.00',
        }, format='json')

        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# API de Movimientos (entradas y salidas)
# ---------------------------------------------------------------------------
class TestMovimientosAPI:

    URL = '/api/movimientos/'

    def test_listar_requiere_autenticacion(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401

    def test_entrada_aumenta_stock(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '5.00',
            'observacion': '',
        }, format='json')

        assert resp.status_code == 201
        producto.refresh_from_db()
        assert producto.stock_actual == Decimal('15.00')

    def test_salida_disminuye_stock(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'SALIDA',
            'cantidad': '4.00',
            'observacion': '',
        }, format='json')

        assert resp.status_code == 201
        producto.refresh_from_db()
        assert producto.stock_actual == Decimal('6.00')

    def test_salida_mayor_al_stock_es_rechazada(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'SALIDA',
            'cantidad': '999.00',
            'observacion': '',
        }, format='json')

        assert resp.status_code == 400
        producto.refresh_from_db()
        assert producto.stock_actual == Decimal('10.00')

    def test_cantidad_invalida_es_rechazada(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '0',
            'observacion': '',
        }, format='json')

        assert resp.status_code == 400

    def test_usuario_se_asigna_automaticamente(self, auth_client, usuario, producto):
        auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '2.00',
            'observacion': '',
        }, format='json')

        mov = Movimiento.objects.latest('fecha_movimiento')
        assert mov.usuario == usuario

    def test_movimiento_no_se_puede_modificar(self, auth_client, producto):
        crear = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '2.00',
            'observacion': '',
        }, format='json')
        mid = crear.data['id']

        resp = auth_client.patch(f'{self.URL}{mid}/', {'cantidad': '99'}, format='json')
        assert resp.status_code == 405

    def test_movimiento_no_se_puede_eliminar(self, auth_client, producto):
        crear = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '2.00',
            'observacion': '',
        }, format='json')
        mid = crear.data['id']

        resp = auth_client.delete(f'{self.URL}{mid}/')
        assert resp.status_code == 405

    def test_filtro_por_producto_id(self, auth_client, producto):
        otro = Producto.objects.create(
            nombre='Fríjol', unidad_medida='kg',
            stock_actual=Decimal('10'), stock_minimo=Decimal('2'),
        )
        auth_client.post(self.URL, {
            'producto': str(producto.id), 'tipo_movimiento': 'ENTRADA',
            'cantidad': '1.00', 'observacion': '',
        }, format='json')
        auth_client.post(self.URL, {
            'producto': str(otro.id), 'tipo_movimiento': 'ENTRADA',
            'cantidad': '1.00', 'observacion': '',
        }, format='json')

        resp = auth_client.get(self.URL, {'producto_id': str(producto.id)})
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert str(resp.data[0]['producto']) == str(producto.id)

    def test_filtro_por_tipo(self, auth_client, producto):
        auth_client.post(self.URL, {
            'producto': str(producto.id), 'tipo_movimiento': 'ENTRADA',
            'cantidad': '3.00', 'observacion': '',
        }, format='json')
        auth_client.post(self.URL, {
            'producto': str(producto.id), 'tipo_movimiento': 'SALIDA',
            'cantidad': '1.00', 'observacion': '',
        }, format='json')

        resp = auth_client.get(self.URL, {'tipo': 'SALIDA'})
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]['tipo_movimiento'] == 'SALIDA'

    def test_datos_factura_se_guardan_en_entrada(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '5.00',
            'observacion': '',
            'numero_factura': 'FAC-001',
            'fecha_pago_factura': '2026-09-01',
            'banco_pago': 'Bancolombia',
            'precio_factura': '150000',
        }, format='json')

        assert resp.status_code == 201
        assert resp.data['numero_factura'] == 'FAC-001'
        assert resp.data['banco_pago'] == 'Bancolombia'
        assert Decimal(resp.data['precio_factura']) == Decimal('150000')

    def test_datos_factura_se_ignoran_en_salida(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'SALIDA',
            'cantidad': '2.00',
            'observacion': '',
            'numero_factura': 'FAC-999',
            'banco_pago': 'Davivienda',
            'precio_factura': '50000',
        }, format='json')

        assert resp.status_code == 201
        # En una salida los datos de factura no aplican: quedan vacíos.
        assert resp.data['numero_factura'] == ''
        assert resp.data['banco_pago'] == ''
        assert resp.data['precio_factura'] is None

    def test_producto_inexistente_es_rechazado(self, auth_client):
        resp = auth_client.post(self.URL, {
            'producto': '00000000-0000-0000-0000-000000000000',
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '1.00',
            'observacion': '',
        }, format='json')
        assert resp.status_code == 400

    def test_salida_exacta_deja_stock_en_cero(self, auth_client, producto):
        resp = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'SALIDA',
            'cantidad': '10.00',
            'observacion': '',
        }, format='json')

        assert resp.status_code == 201
        producto.refresh_from_db()
        assert producto.stock_actual == Decimal('0.00')

    def test_detalle_de_un_movimiento(self, auth_client, producto):
        crear = auth_client.post(self.URL, {
            'producto': str(producto.id),
            'tipo_movimiento': 'ENTRADA',
            'cantidad': '3.00',
            'observacion': 'compra',
        }, format='json')
        mid = crear.data['id']

        resp = auth_client.get(f'{self.URL}{mid}/')
        assert resp.status_code == 200
        assert resp.data['observacion'] == 'compra'
        assert resp.data['producto_nombre'] == 'Maíz'


# ---------------------------------------------------------------------------
# API del Dashboard
# ---------------------------------------------------------------------------
class TestDashboardAPI:

    URL = '/api/dashboard/'

    def test_requiere_autenticacion(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401

    def test_totales_y_stock_bajo(self, auth_client, usuario):
        # Un producto con stock bajo y otro con stock suficiente.
        bajo = Producto.objects.create(
            nombre='Sal', unidad_medida='kg',
            stock_actual=Decimal('1'), stock_minimo=Decimal('5'),
        )
        Producto.objects.create(
            nombre='Azúcar', unidad_medida='kg',
            stock_actual=Decimal('20'), stock_minimo=Decimal('5'),
        )
        Movimiento.objects.create(
            producto=bajo, usuario=usuario,
            tipo_movimiento='ENTRADA', cantidad=Decimal('1'),
        )

        resp = auth_client.get(self.URL)

        assert resp.status_code == 200
        assert resp.data['total_productos'] == 2
        assert resp.data['productos_stock_bajo'] == 1
        assert resp.data['total_movimientos'] == 1
        nombres_bajo = [p['nombre'] for p in resp.data['productos_stock_bajo_lista']]
        assert nombres_bajo == ['Sal']
