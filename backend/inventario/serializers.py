from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Producto, Movimiento


User = get_user_model()


class EmailTokenObtainSerializer(serializers.Serializer):
    """
    Login por correo electrónico (en vez de usuario).
    Valida el correo contra la base de datos y devuelve los tokens JWT.
    """

    correo = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        correo = attrs.get('correo', '').strip()
        password = attrs.get('password', '')

        usuario = User.objects.filter(
            email__iexact=correo,
            is_active=True
        ).first()

        if usuario is None or not usuario.check_password(password):
            raise serializers.ValidationError(
                'Correo o contraseña incorrectos. Verifica tus datos.'
            )

        refresh = RefreshToken.for_user(usuario)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': usuario.username,
            'correo': usuario.email,
        }


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