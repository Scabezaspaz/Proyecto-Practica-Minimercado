import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction


class Producto(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    nombre = models.CharField(
        max_length=100
    )

    descripcion = models.TextField(
        blank=True
    )

    unidad_medida = models.CharField(
        max_length=50
    )

    stock_actual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00"))
        ]
    )

    stock_minimo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00"))
        ]
    )

    activo = models.BooleanField(
        default=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nombre


class Movimiento(models.Model):
    TIPO_MOVIMIENTO = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='movimientos'
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos'
    )

    tipo_movimiento = models.CharField(
        max_length=10,
        choices=TIPO_MOVIMIENTO
    )

    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    observacion = models.TextField(
        blank=True
    )

    fecha_movimiento = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.producto.nombre}"

    def clean(self):
        super().clean()

        if not self.producto_id:
            return

        if self.cantidad is None:
            return

        if self.cantidad <= Decimal("0.00"):
            raise ValidationError({
                'cantidad': 'La cantidad debe ser mayor que cero.'
            })

        if self._state.adding and self.tipo_movimiento == 'SALIDA':
            if self.cantidad > self.producto.stock_actual:
                raise ValidationError({
                    'cantidad': (
                        f'No hay suficiente stock disponible. '
                        f'Stock actual: {self.producto.stock_actual} '
                        f'{self.producto.unidad_medida}.'
                    )
                })

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError(
                'Los movimientos existentes no se pueden modificar.'
            )

        self.full_clean()

        with transaction.atomic():
            producto = Producto.objects.select_for_update().get(
                pk=self.producto_id
            )

            if self.tipo_movimiento == 'ENTRADA':
                producto.stock_actual += self.cantidad

            elif self.tipo_movimiento == 'SALIDA':
                if self.cantidad > producto.stock_actual:
                    raise ValidationError({
                        'cantidad': (
                            f'No hay suficiente stock disponible. '
                            f'Stock actual: {producto.stock_actual} '
                            f'{producto.unidad_medida}.'
                        )
                    })

                producto.stock_actual -= self.cantidad

            producto.save(
                update_fields=['stock_actual']
            )

            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            producto = Producto.objects.select_for_update().get(
                pk=self.producto_id
            )

            if self.tipo_movimiento == 'ENTRADA':
                producto.stock_actual -= self.cantidad

            elif self.tipo_movimiento == 'SALIDA':
                producto.stock_actual += self.cantidad

            if producto.stock_actual < Decimal("0.00"):
                raise ValidationError(
                    'No se puede eliminar este movimiento porque '
                    'el stock resultante sería negativo.'
                )

            producto.save(
                update_fields=['stock_actual']
            )

            super().delete(*args, **kwargs)