"""
Servicios de dominio: operaciones de negocio que involucran varias
entidades y deben ejecutarse de forma atómica.

Mantenerlas aquí (y no en vistas o serializers) separa responsabilidades:
la vista atiende HTTP, el serializer valida el formato de los datos y el
servicio aplica las reglas del negocio.
"""
from dataclasses import dataclass
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import Compra, DetalleCompra, Movimiento


@dataclass(frozen=True)
class ItemCompra:
    """Un producto a comprar, con su cantidad y precio unitario."""

    producto: object
    cantidad: Decimal
    precio_unitario: Decimal


class RegistroCompraService:
    """
    Registra una compra a un proveedor y, por cada producto comprado,
    genera la ENTRADA de inventario correspondiente (que actualiza el
    stock). Todo ocurre en una sola transacción: si algo falla, no se
    guarda nada.
    """

    def registrar(self, *, proveedor, usuario, items, numero_factura='',
                  fecha_compra=None, fecha_pago=None, banco_pago='',
                  observacion=''):
        numero_factura = (numero_factura or '').strip()
        fecha_compra = fecha_compra or timezone.localdate()

        self._validar(proveedor, items, numero_factura, fecha_compra)

        with transaction.atomic():
            compra = Compra.objects.create(
                proveedor=proveedor,
                usuario=usuario,
                numero_factura=numero_factura,
                fecha_compra=fecha_compra,
                fecha_pago=fecha_pago,
                banco_pago=(banco_pago or '').strip(),
                observacion=(observacion or '').strip(),
                total=self._calcular_total(items),
            )

            for item in items:
                self._registrar_item(compra, item, usuario)

        return compra

    # -- Reglas de negocio --------------------------------------------------

    def _validar(self, proveedor, items, numero_factura, fecha_compra):
        if not proveedor.activo:
            raise ValidationError({
                'proveedor': 'El proveedor seleccionado está inactivo.'
            })

        if not items:
            raise ValidationError({
                'detalles': 'Agrega al menos un producto a la compra.'
            })

        ids = [item.producto.pk for item in items]
        if len(ids) != len(set(ids)):
            raise ValidationError({
                'detalles': 'Un producto no puede repetirse en la misma compra.'
            })

        inactivos = [item.producto.nombre for item in items if not item.producto.activo]
        if inactivos:
            raise ValidationError({
                'detalles': f'Productos inactivos: {", ".join(inactivos)}.'
            })

        if fecha_compra > timezone.localdate():
            raise ValidationError({
                'fecha_compra': 'La fecha de compra no puede ser futura.'
            })

        if numero_factura and Compra.objects.filter(
            proveedor=proveedor,
            numero_factura__iexact=numero_factura,
        ).exists():
            raise ValidationError({
                'numero_factura': (
                    'Ya existe una compra con este número de factura '
                    'para este proveedor.'
                )
            })

    @staticmethod
    def _calcular_total(items):
        return sum(
            (DetalleCompra.calcular_subtotal(i.cantidad, i.precio_unitario) for i in items),
            Decimal('0.00'),
        )

    @staticmethod
    def _registrar_item(compra, item, usuario):
        subtotal = DetalleCompra.calcular_subtotal(item.cantidad, item.precio_unitario)

        # Movimiento.save() valida y actualiza el stock del producto.
        movimiento = Movimiento.objects.create(
            producto=item.producto,
            usuario=usuario,
            tipo_movimiento='ENTRADA',
            cantidad=item.cantidad,
            observacion=f'Compra a {compra.proveedor.nombre}',
            numero_factura=compra.numero_factura,
            fecha_pago_factura=compra.fecha_pago,
            banco_pago=compra.banco_pago,
            precio_factura=subtotal,
        )

        DetalleCompra.objects.create(
            compra=compra,
            producto=item.producto,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=subtotal,
            movimiento=movimiento,
        )
