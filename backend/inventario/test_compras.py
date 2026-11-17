"""
Pruebas del módulo de Compras.

Una compra pertenece a un proveedor, tiene uno o varios productos en su
detalle y, al registrarse, genera una ENTRADA de inventario por producto
(actualizando el stock) dentro de una sola transacción.

Se ejecutan con:  pytest
"""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Compra, DetalleCompra, Movimiento, Producto

pytestmark = pytest.mark.django_db

URL = '/api/compras/'


@pytest.fixture
def producto2(categoria):
    return Producto.objects.create(
        nombre='Arroz', unidad_medida='kg', categoria=categoria,
        stock_actual=Decimal('0'), stock_minimo=Decimal('5'),
    )


def payload(proveedor, *lineas, **extra):
    datos = {
        'proveedor': str(proveedor.id),
        'detalles': [
            {'producto': str(p.id), 'cantidad': c, 'precio_unitario': pu}
            for p, c, pu in lineas
        ],
    }
    datos.update(extra)
    return datos


def registrar(client, proveedor, *lineas, **extra):
    return client.post(URL, payload(proveedor, *lineas, **extra), format='json')


class TestRegistrarCompra:

    def test_requiere_autenticacion(self, api_client):
        assert api_client.get(URL).status_code == 401

    def test_registra_compra_y_actualiza_stock(self, auth_client, usuario, proveedor, producto, producto2):
        resp = registrar(
            auth_client, proveedor,
            (producto, '5.00', '2500'),
            (producto2, '10', '3200.50'),
            numero_factura='FV-001',
        )

        assert resp.status_code == 201, resp.data
        assert resp.data['total'] == '44505.00'
        assert resp.data['total_items'] == 2
        assert resp.data['proveedor_nombre'] == 'Finca La Esperanza'
        assert resp.data['usuario_nombre'] == 'empleado'
        assert resp.data['fecha_compra'] == str(timezone.localdate())

        producto.refresh_from_db()
        producto2.refresh_from_db()
        assert producto.stock_actual == Decimal('15.00')   # 10 + 5
        assert producto2.stock_actual == Decimal('10.00')  # 0 + 10

    def test_genera_una_entrada_por_producto(self, auth_client, proveedor, producto, producto2):
        resp = registrar(auth_client, proveedor, (producto, '2', '100'), (producto2, '3', '50'),
                         numero_factura='FV-9')

        compra = Compra.objects.get(pk=resp.data['id'])
        movimientos = Movimiento.objects.filter(detalle_compra__compra=compra)

        assert movimientos.count() == 2
        assert set(movimientos.values_list('tipo_movimiento', flat=True)) == {'ENTRADA'}
        mov = movimientos.get(producto=producto)
        assert mov.numero_factura == 'FV-9'
        assert mov.precio_factura == Decimal('200.00')
        assert 'Finca La Esperanza' in mov.observacion

    def test_movimiento_expone_la_compra(self, auth_client, proveedor, producto):
        resp = registrar(auth_client, proveedor, (producto, '1', '10'))

        movs = auth_client.get('/api/movimientos/', {'producto_id': str(producto.id)})

        assert movs.data[0]['compra'] == resp.data['id']

    def test_sin_productos_es_rechazada(self, auth_client, proveedor):
        resp = registrar(auth_client, proveedor)

        assert resp.status_code == 400
        assert 'detalles' in resp.data

    def test_proveedor_obligatorio(self, auth_client, producto):
        resp = auth_client.post(URL, {
            'detalles': [{'producto': str(producto.id), 'cantidad': '1', 'precio_unitario': '1'}],
        }, format='json')

        assert resp.status_code == 400
        assert resp.data['proveedor'] == ['Selecciona un proveedor.']

    def test_proveedor_inactivo_es_rechazado(self, auth_client, proveedor, producto):
        proveedor.desactivar()

        resp = registrar(auth_client, proveedor, (producto, '1', '10'))

        assert resp.status_code == 400
        assert 'proveedor' in resp.data

    def test_producto_repetido_es_rechazado(self, auth_client, proveedor, producto):
        resp = registrar(auth_client, proveedor, (producto, '1', '10'), (producto, '2', '10'))

        assert resp.status_code == 400
        assert 'repetirse' in str(resp.data)

    def test_producto_inactivo_es_rechazado(self, auth_client, proveedor, producto):
        producto.activo = False
        producto.save()

        resp = registrar(auth_client, proveedor, (producto, '1', '10'))

        assert resp.status_code == 400

    @pytest.mark.parametrize('cantidad,precio', [('0', '10'), ('-1', '10'), ('1', '-5')])
    def test_cantidad_y_precio_invalidos(self, auth_client, proveedor, producto, cantidad, precio):
        resp = registrar(auth_client, proveedor, (producto, cantidad, precio))

        assert resp.status_code == 400

    def test_fecha_futura_es_rechazada(self, auth_client, proveedor, producto):
        manana = timezone.localdate() + timedelta(days=1)

        resp = registrar(auth_client, proveedor, (producto, '1', '10'), fecha_compra=str(manana))

        assert resp.status_code == 400
        assert 'fecha_compra' in resp.data

    def test_factura_duplicada_para_el_mismo_proveedor(self, auth_client, proveedor, producto):
        registrar(auth_client, proveedor, (producto, '1', '10'), numero_factura='FV-1')

        resp = registrar(auth_client, proveedor, (producto, '1', '10'), numero_factura='fv-1')

        assert resp.status_code == 400
        assert 'numero_factura' in resp.data

    def test_varias_compras_sin_factura(self, auth_client, proveedor, producto):
        a = registrar(auth_client, proveedor, (producto, '1', '10'))
        b = registrar(auth_client, proveedor, (producto, '1', '10'))

        assert a.status_code == b.status_code == 201

    def test_error_no_deja_datos_a_medias(self, auth_client, proveedor, producto, producto2):
        producto2.activo = False
        producto2.save()

        registrar(auth_client, proveedor, (producto, '5', '10'), (producto2, '1', '10'))

        producto.refresh_from_db()
        assert producto.stock_actual == Decimal('10.00')
        assert Compra.objects.count() == 0
        assert Movimiento.objects.count() == 0


class TestConsultarCompras:

    def test_listar_y_ver_detalle(self, auth_client, proveedor, producto):
        creada = registrar(auth_client, proveedor, (producto, '4', '1000'), numero_factura='A-1')

        lista = auth_client.get(URL)
        detalle = auth_client.get(f"{URL}{creada.data['id']}/")

        assert len(lista.data) == 1
        assert detalle.data['detalles'][0]['producto_nombre'] == 'Maíz'
        assert detalle.data['detalles'][0]['subtotal'] == '4000.00'
        assert detalle.data['detalles'][0]['unidad_medida'] == 'kg'

    def test_filtros(self, auth_client, proveedor, producto):
        from .models import Proveedor
        otro = Proveedor.objects.create(nombre='Otro proveedor')
        hace_una_semana = timezone.localdate() - timedelta(days=7)
        registrar(auth_client, proveedor, (producto, '1', '1'), numero_factura='XYZ-1',
                  fecha_compra=str(hace_una_semana))
        registrar(auth_client, otro, (producto, '1', '1'))

        por_proveedor = auth_client.get(URL, {'proveedor': str(otro.id)})
        por_factura = auth_client.get(URL, {'q': 'xyz'})
        por_nombre = auth_client.get(URL, {'q': 'otro'})
        recientes = auth_client.get(URL, {'desde': str(timezone.localdate() - timedelta(days=1))})
        antiguas = auth_client.get(URL, {'hasta': str(hace_una_semana)})
        invalido = auth_client.get(URL, {'proveedor': 'abc'})

        assert [c['proveedor_nombre'] for c in por_proveedor.data] == ['Otro proveedor']
        assert [c['numero_factura'] for c in por_factura.data] == ['XYZ-1']
        assert len(por_nombre.data) == 1
        assert len(recientes.data) == 1
        assert [c['numero_factura'] for c in antiguas.data] == ['XYZ-1']
        assert invalido.data == []

    def test_no_se_puede_editar_ni_eliminar(self, auth_client, proveedor, producto):
        creada = registrar(auth_client, proveedor, (producto, '1', '1'))
        url = f"{URL}{creada.data['id']}/"

        assert auth_client.patch(url, {'observacion': 'x'}, format='json').status_code == 405
        assert auth_client.delete(url).status_code == 405


class TestIntegridadCompras:

    def test_compra_es_inmutable_en_el_modelo(self, auth_client, proveedor, producto):
        creada = registrar(auth_client, proveedor, (producto, '1', '1'))
        compra = Compra.objects.get(pk=creada.data['id'])

        with pytest.raises(ValidationError):
            compra.save()
        with pytest.raises(ValidationError):
            compra.delete()

    def test_proveedor_con_compras_no_se_borra_fisicamente(self, auth_client, proveedor, producto):
        from django.db.models import ProtectedError
        registrar(auth_client, proveedor, (producto, '1', '1'))

        with pytest.raises(ProtectedError):
            proveedor.delete()

    def test_restriccion_de_factura_en_base_de_datos(self, auth_client, usuario, proveedor, producto):
        registrar(auth_client, proveedor, (producto, '1', '1'), numero_factura='DB-1')

        with pytest.raises(IntegrityError), transaction.atomic():
            Compra.objects.create(proveedor=proveedor, usuario=usuario,
                                  numero_factura='DB-1', fecha_compra=timezone.localdate())

    def test_subtotal_se_redondea_a_centavos(self):
        assert DetalleCompra.calcular_subtotal(Decimal('1.5'), Decimal('3333.33')) == Decimal('5000.00')
