from django.contrib import admin
from django.utils import timezone

from .models import Producto, Movimiento


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):

    list_display = (
        'nombre',
        'unidad_medida',
        'stock_actual',
        'stock_minimo',
        'stock_bajo',
        'activo',
        'fecha_creacion',
    )

    list_filter = (
        'activo',
        'unidad_medida',
    )

    search_fields = (
        'nombre',
        'descripcion',
    )

    ordering = (
        'nombre',
    )

    @admin.display(boolean=True, description='Stock bajo')
    def stock_bajo(self, obj):
        return obj.stock_actual <= obj.stock_minimo


@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):

    exclude = ('usuario',)

    list_display = (
        'producto',
        'tipo_movimiento',
        'cantidad',
        'usuario',
        'fecha_movimiento_formateada',
    )

    list_filter = (
        'tipo_movimiento',
        'fecha_movimiento',
    )

    search_fields = (
        'producto__nombre',
        'usuario__username',
        'observacion',
    )

    ordering = (
        '-fecha_movimiento',
    )

    @admin.display(
        description='Fecha movimiento',
        ordering='fecha_movimiento'
    )
    def fecha_movimiento_formateada(self, obj):
        fecha = timezone.localtime(obj.fecha_movimiento)

        meses = [
            'enero',
            'febrero',
            'marzo',
            'abril',
            'mayo',
            'junio',
            'julio',
            'agosto',
            'septiembre',
            'octubre',
            'noviembre',
            'diciembre',
        ]

        mes = meses[fecha.month - 1]

        hora = fecha.strftime('%I:%M %p')
        hora = hora.replace('AM', 'a. m.').replace('PM', 'p. m.')

        return (
            f'{fecha.day} de {mes} de {fecha.year}, '
            f'{hora}'
        )

    def save_model(self, request, obj, form, change):
        obj.usuario = request.user
        super().save_model(request, obj, form, change)

    def has_change_permission(self, request, obj=None):
        # Los movimientos son inmutables: se permite verlos, no editarlos.
        if obj is not None:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        # Los movimientos no se pueden eliminar (coherente con el modelo).
        return False