from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from .models import Producto, Movimiento

User = get_user_model()


class ProductoModelTest(TestCase):

    def test_nombre_se_normaliza(self):
        producto = Producto(
            nombre='  Arroz  ',
            unidad_medida='kg',
            stock_actual=Decimal('10.00'),
            stock_minimo=Decimal('2.00'),
        )

        producto.full_clean()

        self.assertEqual(producto.nombre, 'Arroz')

    def test_no_permite_nombre_duplicado(self):
        Producto.objects.create(
            nombre='Maíz',
            unidad_medida='kg',
            stock_actual=Decimal('10.00'),
            stock_minimo=Decimal('2.00'),
        )

        duplicado = Producto(
            nombre='maíz',
            unidad_medida='kg',
            stock_actual=Decimal('5.00'),
            stock_minimo=Decimal('1.00'),
        )

        with self.assertRaises(ValidationError):
            duplicado.full_clean()


class MovimientoModelTest(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='empleado',
            password='clave-segura-123',
        )

        self.producto = Producto.objects.create(
            nombre='Maíz',
            unidad_medida='kg',
            stock_actual=Decimal('10.00'),
            stock_minimo=Decimal('2.00'),
        )

    def test_entrada_aumenta_stock(self):
        movimiento = Movimiento(
            producto=self.producto,
            usuario=self.usuario,
            tipo_movimiento='ENTRADA',
            cantidad=Decimal('5.00'),
        )

        movimiento.save()

        self.producto.refresh_from_db()

        self.assertEqual(
            self.producto.stock_actual,
            Decimal('15.00')
        )

    def test_salida_disminuye_stock(self):
        movimiento = Movimiento(
            producto=self.producto,
            usuario=self.usuario,
            tipo_movimiento='SALIDA',
            cantidad=Decimal('4.00'),
        )

        movimiento.save()

        self.producto.refresh_from_db()

        self.assertEqual(
            self.producto.stock_actual,
            Decimal('6.00')
        )

    def test_salida_mayor_al_stock_es_rechazada(self):
        movimiento = Movimiento(
            producto=self.producto,
            usuario=self.usuario,
            tipo_movimiento='SALIDA',
            cantidad=Decimal('100.00'),
        )

        with self.assertRaises(ValidationError):
            movimiento.save()

        self.producto.refresh_from_db()

        self.assertEqual(
            self.producto.stock_actual,
            Decimal('10.00')
        )

    def test_cantidad_cero_es_rechazada(self):
        movimiento = Movimiento(
            producto=self.producto,
            usuario=self.usuario,
            tipo_movimiento='ENTRADA',
            cantidad=Decimal('0.00'),
        )

        with self.assertRaises(ValidationError):
            movimiento.save()

    def test_movimiento_no_se_puede_modificar(self):
        movimiento = Movimiento(
            producto=self.producto,
            usuario=self.usuario,
            tipo_movimiento='ENTRADA',
            cantidad=Decimal('5.00'),
        )

        movimiento.save()

        movimiento.cantidad = Decimal('99.00')

        with self.assertRaises(ValidationError):
            movimiento.save()

    def test_movimiento_no_se_puede_eliminar(self):
        movimiento = Movimiento(
            producto=self.producto,
            usuario=self.usuario,
            tipo_movimiento='ENTRADA',
            cantidad=Decimal('5.00'),
        )

        movimiento.save()

        with self.assertRaises(ValidationError):
            movimiento.delete()


class AccesoViewsTest(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='empleado',
            password='clave-segura-123',
        )

    def test_productos_requiere_login(self):
        respuesta = self.client.get(
            reverse('productos')
        )

        self.assertEqual(respuesta.status_code, 302)
        self.assertIn('/login/', respuesta.url)

    def test_productos_accesible_con_login(self):
        self.client.login(
            username='empleado',
            password='clave-segura-123',
        )

        respuesta = self.client.get(
            reverse('productos')
        )

        self.assertEqual(respuesta.status_code, 200)