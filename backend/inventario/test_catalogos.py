"""
Pruebas de los módulos de Categorías y Proveedores y de su relación
con Productos (un producto tiene una categoría y un proveedor; una
categoría / proveedor tiene muchos productos).

Se ejecutan con:  pytest
"""
from decimal import Decimal

import pytest

from .models import Categoria, Producto, Proveedor

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Categorías
# ---------------------------------------------------------------------------
class TestCategorias:

    URL = '/api/categorias/'

    def test_requiere_autenticacion(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_crear_categoria(self, auth_client):
        resp = auth_client.post(self.URL, {
            'nombre': '  Lácteos  ',
            'descripcion': 'Leche, queso y derivados',
        }, format='json')

        assert resp.status_code == 201
        assert resp.data['nombre'] == 'Lácteos'
        assert resp.data['total_productos'] == 0
        assert resp.data['activo'] is True

    def test_nombre_obligatorio(self, auth_client):
        resp = auth_client.post(self.URL, {'nombre': '   '}, format='json')

        assert resp.status_code == 400
        assert 'nombre' in resp.data

    def test_nombre_duplicado_sin_importar_mayusculas(self, auth_client, categoria):
        resp = auth_client.post(self.URL, {'nombre': 'GRANOS'}, format='json')

        assert resp.status_code == 400
        assert 'categoría' in str(resp.data['nombre'][0])

    def test_editar_conservando_su_mismo_nombre(self, auth_client, categoria):
        resp = auth_client.patch(f'{self.URL}{categoria.id}/', {
            'nombre': 'Granos',
            'descripcion': 'Actualizada',
        }, format='json')

        assert resp.status_code == 200
        assert resp.data['descripcion'] == 'Actualizada'

    def test_listar_y_buscar(self, auth_client, categoria):
        Categoria.objects.create(nombre='Frutas')

        todas = auth_client.get(self.URL)
        filtradas = auth_client.get(self.URL, {'q': 'fru'})

        assert [c['nombre'] for c in todas.data] == ['Frutas', 'Granos']
        assert [c['nombre'] for c in filtradas.data] == ['Frutas']

    def test_total_productos_cuenta_solo_activos(self, auth_client, categoria, producto):
        producto.categoria = categoria
        producto.save()
        Producto.objects.create(
            nombre='Arroz viejo', unidad_medida='kg',
            stock_actual=0, stock_minimo=0,
            categoria=categoria, activo=False,
        )

        resp = auth_client.get(f'{self.URL}{categoria.id}/')

        assert resp.data['total_productos'] == 1

    def test_desactivar_categoria_sin_productos(self, auth_client, categoria):
        resp = auth_client.delete(f'{self.URL}{categoria.id}/')

        assert resp.status_code == 204
        categoria.refresh_from_db()
        assert categoria.activo is False
        assert auth_client.get(self.URL).data == []

    def test_no_desactiva_categoria_con_productos_activos(self, auth_client, categoria, producto):
        producto.categoria = categoria
        producto.save()

        resp = auth_client.delete(f'{self.URL}{categoria.id}/')

        assert resp.status_code == 400
        categoria.refresh_from_db()
        assert categoria.activo is True

    def test_nombre_de_categoria_inactiva_se_puede_reutilizar(self, auth_client, categoria):
        auth_client.delete(f'{self.URL}{categoria.id}/')

        resp = auth_client.post(self.URL, {'nombre': 'Granos'}, format='json')

        assert resp.status_code == 201


# ---------------------------------------------------------------------------
# Proveedores
# ---------------------------------------------------------------------------
class TestProveedores:

    URL = '/api/proveedores/'

    def test_requiere_autenticacion(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_crear_proveedor(self, auth_client):
        resp = auth_client.post(self.URL, {
            'nombre': 'Huerta Verde',
            'nit': ' 800111222-3 ',
            'contacto': 'Luis Gómez',
            'telefono': '3109876543',
            'correo': 'contacto@huertaverde.com',
            'direccion': 'Vereda El Rosal',
        }, format='json')

        assert resp.status_code == 201
        assert resp.data['nit'] == '800111222-3'
        assert resp.data['total_productos'] == 0

    def test_crear_solo_con_nombre(self, auth_client):
        resp = auth_client.post(self.URL, {'nombre': 'Don José'}, format='json')

        assert resp.status_code == 201

    def test_correo_invalido(self, auth_client):
        resp = auth_client.post(self.URL, {
            'nombre': 'Huerta Verde',
            'correo': 'no-es-correo',
        }, format='json')

        assert resp.status_code == 400
        assert 'correo' in resp.data

    def test_nombre_duplicado(self, auth_client, proveedor):
        resp = auth_client.post(self.URL, {'nombre': 'finca la esperanza'}, format='json')

        assert resp.status_code == 400
        assert 'nombre' in resp.data

    def test_nit_duplicado(self, auth_client, proveedor):
        resp = auth_client.post(self.URL, {
            'nombre': 'Otro proveedor',
            'nit': '900123456-7',
        }, format='json')

        assert resp.status_code == 400
        assert 'nit' in resp.data

    def test_varios_proveedores_sin_nit(self, auth_client):
        a = auth_client.post(self.URL, {'nombre': 'A', 'nit': ''}, format='json')
        b = auth_client.post(self.URL, {'nombre': 'B', 'nit': ''}, format='json')

        assert a.status_code == 201
        assert b.status_code == 201

    def test_buscar_por_nit_o_contacto(self, auth_client, proveedor):
        Proveedor.objects.create(nombre='Otro')

        por_nit = auth_client.get(self.URL, {'q': '900123'})
        por_contacto = auth_client.get(self.URL, {'q': 'ana'})

        assert [p['nombre'] for p in por_nit.data] == ['Finca La Esperanza']
        assert [p['nombre'] for p in por_contacto.data] == ['Finca La Esperanza']

    def test_no_desactiva_proveedor_con_productos_activos(self, auth_client, proveedor, producto):
        producto.proveedor = proveedor
        producto.save()

        resp = auth_client.delete(f'{self.URL}{proveedor.id}/')

        assert resp.status_code == 400
        proveedor.refresh_from_db()
        assert proveedor.activo is True

    def test_desactivar_proveedor_si_su_producto_esta_inactivo(self, auth_client, proveedor, producto):
        producto.proveedor = proveedor
        producto.activo = False
        producto.save()

        resp = auth_client.delete(f'{self.URL}{proveedor.id}/')

        assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Relación Producto -> Categoría / Proveedor
# ---------------------------------------------------------------------------
class TestProductoRelaciones:

    URL = '/api/productos/'

    def datos(self, **extra):
        base = {
            'nombre': 'Lentejas',
            'unidad_medida': 'kg',
            'stock_actual': '5',
            'stock_minimo': '1',
        }
        base.update(extra)
        return base

    def test_crear_producto_con_categoria_y_proveedor(self, auth_client, categoria, proveedor):
        resp = auth_client.post(self.URL, self.datos(
            categoria=str(categoria.id),
            proveedor=str(proveedor.id),
        ), format='json')

        assert resp.status_code == 201
        assert resp.data['categoria'] == categoria.id
        assert resp.data['categoria_nombre'] == 'Granos'
        assert resp.data['proveedor_nombre'] == 'Finca La Esperanza'

    def test_categoria_y_proveedor_son_opcionales(self, auth_client):
        resp = auth_client.post(self.URL, self.datos(), format='json')

        assert resp.status_code == 201
        assert resp.data['categoria'] is None
        assert resp.data['categoria_nombre'] is None
        assert resp.data['proveedor_nombre'] is None

    def test_no_acepta_categoria_inactiva(self, auth_client, categoria):
        categoria.desactivar()

        resp = auth_client.post(self.URL, self.datos(
            categoria=str(categoria.id),
        ), format='json')

        assert resp.status_code == 400
        assert 'categoria' in resp.data

    def test_no_acepta_proveedor_inexistente(self, auth_client):
        resp = auth_client.post(self.URL, self.datos(
            proveedor='00000000-0000-0000-0000-000000000000',
        ), format='json')

        assert resp.status_code == 400
        assert 'proveedor' in resp.data

    def test_cambiar_y_quitar_categoria(self, auth_client, producto, categoria):
        otra = Categoria.objects.create(nombre='Cereales')
        url = f'{self.URL}{producto.id}/'

        auth_client.patch(url, {'categoria': str(categoria.id)}, format='json')
        cambio = auth_client.patch(url, {'categoria': str(otra.id)}, format='json')
        quitar = auth_client.patch(url, {'categoria': None}, format='json')

        assert cambio.data['categoria_nombre'] == 'Cereales'
        assert quitar.status_code == 200
        assert quitar.data['categoria'] is None

    def test_filtrar_productos_por_categoria_y_proveedor(self, auth_client, producto, categoria, proveedor):
        producto.categoria = categoria
        producto.proveedor = proveedor
        producto.save()
        Producto.objects.create(
            nombre='Sal', unidad_medida='kg',
            stock_actual=Decimal('1'), stock_minimo=Decimal('0'),
        )

        por_categoria = auth_client.get(self.URL, {'categoria': str(categoria.id)})
        por_proveedor = auth_client.get(self.URL, {'proveedor': str(proveedor.id)})

        assert [p['nombre'] for p in por_categoria.data] == ['Maíz']
        assert [p['nombre'] for p in por_proveedor.data] == ['Maíz']

    def test_filtro_con_id_invalido_no_falla(self, auth_client, producto):
        resp = auth_client.get(self.URL, {'categoria': 'no-es-uuid'})

        assert resp.status_code == 200
        assert resp.data == []

    def test_categoria_agrupa_muchos_productos(self, categoria):
        for nombre in ('Arroz', 'Frijol', 'Avena'):
            Producto.objects.create(
                nombre=nombre, unidad_medida='kg',
                stock_actual=0, stock_minimo=0, categoria=categoria,
            )

        assert categoria.productos.count() == 3
