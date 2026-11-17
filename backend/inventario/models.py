import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction


# ---------------------------------------------------------------------------
# Base común para las entidades de catálogo (Producto, Categoría, Proveedor)
# ---------------------------------------------------------------------------
class EntidadActivable(models.Model):
    """
    Modelo abstracto con lo que comparten las entidades del catálogo:
    identificador UUID, borrado lógico (activo) y fecha de creación.

    También centraliza dos reglas de negocio reutilizables:
    - Nombre único (sin distinguir mayúsculas) entre registros activos.
    - Desactivación (borrado lógico) controlada: cada subclase puede
      impedirla sobrescribiendo `validar_desactivacion` (principio
      abierto/cerrado: se extiende sin modificar esta clase).
    """

    # Texto usado en los mensajes de error, ej: "Ya existe un producto…"
    nombre_entidad = 'registro'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    activo = models.BooleanField(
        default=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        abstract = True

    def __str__(self):
        return self.nombre

    @classmethod
    def mensaje_nombre_duplicado(cls):
        return (
            f'Ya existe un {cls.nombre_entidad} activo con este nombre.'
        )

    @classmethod
    def existe_nombre_activo(cls, nombre, excluir_pk=None):
        """True si ya hay otro registro activo con ese nombre."""
        consulta = cls.objects.filter(nombre__iexact=nombre, activo=True)

        if excluir_pk is not None:
            consulta = consulta.exclude(pk=excluir_pk)

        return consulta.exists()

    def clean(self):
        super().clean()

        if self.nombre:
            self.nombre = self.nombre.strip()

        if not self.nombre:
            return

        if self.existe_nombre_activo(self.nombre, excluir_pk=self.pk):
            raise ValidationError({
                'nombre': self.mensaje_nombre_duplicado()
            })

    def validar_desactivacion(self):
        """
        Punto de extensión: las subclases lanzan ValidationError
        si el registro no puede desactivarse.
        """

    def desactivar(self):
        """Borrado lógico: el registro se desactiva, no se elimina."""
        self.validar_desactivacion()
        self.activo = False
        self.save(update_fields=['activo'])


class EntidadConProductos(EntidadActivable):
    """
    Entidad de la que dependen productos (relación 1 a N).
    No puede desactivarse mientras tenga productos activos asociados,
    para conservar la integridad de la información.
    """

    class Meta:
        abstract = True

    def productos_activos(self):
        return self.productos.filter(activo=True)

    def validar_desactivacion(self):
        total = self.productos_activos().count()

        if total:
            raise ValidationError(
                f'No se puede desactivar: tiene {total} '
                f'producto(s) activo(s) asociado(s). '
                f'Reasígnalos primero.'
            )


# ---------------------------------------------------------------------------
# Categoría (1) ---- (N) Producto
# ---------------------------------------------------------------------------
class Categoria(EntidadConProductos):

    nombre_entidad = 'categoría'

    # Categoría por defecto para los productos registrados antes de que
    # la categoría fuera obligatoria.
    NOMBRE_GENERAL = 'General'

    nombre = models.CharField(
        max_length=80
    )

    descripcion = models.TextField(
        blank=True
    )

    class Meta:
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'
        ordering = ['nombre']

    @classmethod
    def mensaje_nombre_duplicado(cls):
        return 'Ya existe una categoría activa con este nombre.'


# ---------------------------------------------------------------------------
# Proveedor (1) ---- (N) Producto
# ---------------------------------------------------------------------------
class Proveedor(EntidadConProductos):

    nombre_entidad = 'proveedor'

    nombre = models.CharField(
        max_length=150
    )

    # NIT o documento de identificación (opcional).
    nit = models.CharField(
        max_length=20,
        blank=True
    )

    contacto = models.CharField(
        max_length=100,
        blank=True
    )

    telefono = models.CharField(
        max_length=20,
        blank=True
    )

    correo = models.EmailField(
        blank=True
    )

    direccion = models.CharField(
        max_length=200,
        blank=True
    )

    class Meta:
        verbose_name = 'proveedor'
        verbose_name_plural = 'proveedores'
        ordering = ['nombre']

    @classmethod
    def existe_nit_activo(cls, nit, excluir_pk=None):
        """True si ya hay otro proveedor activo con ese NIT."""
        consulta = cls.objects.filter(nit__iexact=nit, activo=True)

        if excluir_pk is not None:
            consulta = consulta.exclude(pk=excluir_pk)

        return consulta.exists()

    def clean(self):
        super().clean()

        self.nit = (self.nit or '').strip()

        if self.nit and self.existe_nit_activo(self.nit, excluir_pk=self.pk):
            raise ValidationError({
                'nit': 'Ya existe un proveedor activo con este NIT.'
            })


# ---------------------------------------------------------------------------
# Producto
# ---------------------------------------------------------------------------
class Producto(EntidadActivable):

    nombre_entidad = 'producto'

    UNIDADES_MEDIDA = [
        ('kg', 'Kilogramo (kg)'),
        ('lb', 'Libra (lb)'),
        ('g', 'Gramo (g)'),
        ('und', 'Unidad (und)'),
        ('L', 'Litro (L)'),
        ('ml', 'Mililitro (ml)'),
    ]

    nombre = models.CharField(
        max_length=100
    )

    descripcion = models.TextField(
        blank=True
    )

    unidad_medida = models.CharField(
        max_length=10,
        choices=UNIDADES_MEDIDA
    )

    # Un producto pertenece a una sola categoría (obligatoria); una
    # categoría agrupa muchos productos. PROTECT evita borrar físicamente
    # una categoría que tenga productos. Los productos que existían antes
    # de este módulo se asignaron a la categoría "General" (migración 0011).
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos'
    )

    # Un producto tiene un solo proveedor; un proveedor surte muchos
    # productos.
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='productos',
        null=True,
        blank=True
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

    def clean(self):
        super().clean()

        # Solo se puede asignar una categoría / proveedor activo.
        errores = {}

        if self.categoria_id and not self.categoria.activo:
            errores['categoria'] = 'La categoría seleccionada está inactiva.'

        if self.proveedor_id and not self.proveedor.activo:
            errores['proveedor'] = 'El proveedor seleccionado está inactivo.'

        if errores:
            raise ValidationError(errores)


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
        on_delete=models.PROTECT,
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

    # Datos de la factura (solo aplican a ENTRADA; opcionales).
    numero_factura = models.CharField(
        max_length=50,
        blank=True
    )

    fecha_pago_factura = models.DateField(
        null=True,
        blank=True
    )

    banco_pago = models.CharField(
        max_length=80,
        blank=True
    )

    precio_factura = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.00"))
        ]
    )

    fecha_movimiento = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.producto.nombre}"

    def clean(self):
        super().clean()

        # Los datos de factura solo tienen sentido en las entradas.
        if self.tipo_movimiento != 'ENTRADA':
            self.numero_factura = ''
            self.fecha_pago_factura = None
            self.banco_pago = ''
            self.precio_factura = None

        if not self.producto_id:
            return

        if self.cantidad is None:
            return

        if self.cantidad <= Decimal("0.00"):
            raise ValidationError({
                'cantidad': 'La cantidad debe ser mayor que cero.'
            })

        if (
            self._state.adding
            and self.tipo_movimiento == 'SALIDA'
            and self.cantidad > self.producto.stock_actual
        ):
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

        raise ValidationError(
            'Los movimientos existentes no se pueden eliminar.'
        )

# ---------------------------------------------------------------------------
# Compras: Proveedor (1) ---- (N) Compra (1) ---- (N) DetalleCompra
# ---------------------------------------------------------------------------
class RegistroInmutableMixin:
    """
    Registros históricos que no se modifican ni se eliminan una vez
    creados (igual que los movimientos), para conservar la trazabilidad.
    """

    mensaje_inmutable = 'Los registros existentes no se pueden modificar.'

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError(self.mensaje_inmutable)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(self.mensaje_inmutable)


class Compra(RegistroInmutableMixin, models.Model):
    """
    Compra realizada a un proveedor. Al registrarse genera una ENTRADA
    de inventario por cada producto de su detalle (ver services.py).
    """

    mensaje_inmutable = 'Las compras registradas no se pueden modificar ni eliminar.'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='compras'
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='compras'
    )

    numero_factura = models.CharField(
        max_length=50,
        blank=True
    )

    fecha_compra = models.DateField(
        db_index=True
    )

    fecha_pago = models.DateField(
        null=True,
        blank=True
    )

    banco_pago = models.CharField(
        max_length=80,
        blank=True
    )

    observacion = models.TextField(
        blank=True
    )

    # Suma de los subtotales del detalle. Se guarda (desnormalizado)
    # porque la compra es inmutable y facilita reportes y consultas.
    total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00'))
        ]
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        ordering = ['-fecha_compra', '-fecha_registro']
        constraints = [
            # Un proveedor no puede tener dos compras con la misma factura.
            models.UniqueConstraint(
                fields=['proveedor', 'numero_factura'],
                condition=~models.Q(numero_factura=''),
                name='compra_factura_unica_por_proveedor',
            ),
            models.CheckConstraint(
                condition=models.Q(total__gte=0),
                name='compra_total_no_negativo',
            ),
        ]

    def __str__(self):
        factura = f' · Factura {self.numero_factura}' if self.numero_factura else ''
        return f'Compra a {self.proveedor.nombre}{factura}'


class DetalleCompra(RegistroInmutableMixin, models.Model):
    """
    Línea de una compra: un producto, su cantidad y su precio unitario.
    Queda enlazada al movimiento de ENTRADA que generó en el inventario.
    """

    mensaje_inmutable = 'El detalle de una compra no se puede modificar ni eliminar.'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    compra = models.ForeignKey(
        Compra,
        on_delete=models.CASCADE,
        related_name='detalles'
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='detalles_compra'
    )

    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.01'))
        ]
    )

    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.00'))
        ]
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2
    )

    movimiento = models.OneToOneField(
        Movimiento,
        on_delete=models.PROTECT,
        related_name='detalle_compra'
    )

    class Meta:
        verbose_name = 'detalle de compra'
        verbose_name_plural = 'detalles de compra'
        constraints = [
            # Cada producto aparece una sola vez por compra.
            models.UniqueConstraint(
                fields=['compra', 'producto'],
                name='detalle_compra_producto_unico',
            ),
            models.CheckConstraint(
                condition=models.Q(cantidad__gt=0),
                name='detalle_compra_cantidad_positiva',
            ),
            models.CheckConstraint(
                condition=models.Q(precio_unitario__gte=0),
                name='detalle_compra_precio_no_negativo',
            ),
        ]

    def __str__(self):
        return f'{self.producto.nombre} x {self.cantidad}'

    @staticmethod
    def calcular_subtotal(cantidad, precio_unitario):
        return (cantidad * precio_unitario).quantize(Decimal('0.01'))
