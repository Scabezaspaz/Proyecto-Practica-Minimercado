from rest_framework import serializers

from .models import Producto, Movimiento


class ProductoSerializer(serializers.ModelSerializer):
    """Convierte un Producto a/desde JSON."""

    # Campos calculados de solo lectura (útiles para el frontend)
    stock_bajo = serializers.SerializerMethodField()
    unidad_medida_display = serializers.CharField(
        source='get_unidad_medida_display',
        read_only=True
    )

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'unidad_medida',
            'unidad_medida_display',
            'stock_actual',
            'stock_minimo',
            'stock_bajo',
            'activo',
            'fecha_creacion',
        ]
        read_only_fields = [
            'id',
            'activo',
            'fecha_creacion',
        ]

    def get_stock_bajo(self, obj):
        return obj.stock_actual <= obj.stock_minimo

    def validate_nombre(self, value):
        """Normaliza el nombre y evita duplicados entre productos activos."""
        nombre = value.strip()

        if not nombre:
            raise serializers.ValidationError(
                'El nombre no puede estar vacío.'
            )

        consulta = Producto.objects.filter(
            nombre__iexact=nombre,
            activo=True
        )

        if self.instance is not None:
            consulta = consulta.exclude(pk=self.instance.pk)

        if consulta.exists():
            raise serializers.ValidationError(
                'Ya existe un producto activo con este nombre.'
            )

        return nombre

    def update(self, instance, validated_data):
        # El stock solo puede cambiar mediante movimientos, nunca al editar.
        validated_data.pop('stock_actual', None)
        return super().update(instance, validated_data)


class MovimientoSerializer(serializers.ModelSerializer):
    """Convierte un Movimiento a/desde JSON."""

    # Campos de solo lectura con datos "amigables" para el frontend
    producto_nombre = serializers.CharField(
        source='producto.nombre',
        read_only=True
    )
    usuario_nombre = serializers.CharField(
        source='usuario.username',
        read_only=True
    )
    tipo_movimiento_display = serializers.CharField(
        source='get_tipo_movimiento_display',
        read_only=True
    )

    class Meta:
        model = Movimiento
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'usuario',
            'usuario_nombre',
            'tipo_movimiento',
            'tipo_movimiento_display',
            'cantidad',
            'observacion',
            'numero_factura',
            'fecha_pago_factura',
            'banco_pago',
            'precio_factura',
            'fecha_movimiento',
        ]
        read_only_fields = [
            'id',
            'usuario',
            'fecha_movimiento',
        ]