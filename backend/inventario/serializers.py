from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Categoria, Movimiento, Producto, Proveedor


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


class NombreUnicoActivoMixin:
    """
    Validación reutilizable del campo `nombre` para las entidades de
    catálogo: lo normaliza y evita duplicados entre registros activos.

    La regla vive en el modelo (`existe_nombre_activo`); el serializer
    solo la consulta, así no se duplica la lógica (DRY / SRP).
    """

    def validate_nombre(self, value):
        nombre = value.strip()

        if not nombre:
            raise serializers.ValidationError(
                'El nombre no puede estar vacío.'
            )

        modelo = self.Meta.model
        excluir_pk = self.instance.pk if self.instance is not None else None

        if modelo.existe_nombre_activo(nombre, excluir_pk=excluir_pk):
            raise serializers.ValidationError(
                modelo.mensaje_nombre_duplicado()
            )

        return nombre


class TotalProductosMixin(serializers.Serializer):
    """
    Agrega `total_productos` (productos activos asociados) a las
    entidades que agrupan productos: Categoría y Proveedor.
    """

    total_productos = serializers.SerializerMethodField()

    def get_total_productos(self, obj):
        # Usa la anotación del queryset si existe (evita N+1 consultas).
        total = getattr(obj, 'total_productos', None)
        if total is None:
            total = obj.productos_activos().count()
        return total


class CategoriaSerializer(NombreUnicoActivoMixin, TotalProductosMixin,
                          serializers.ModelSerializer):
    """Convierte una Categoría a/desde JSON."""

    class Meta:
        model = Categoria
        fields = [
            'id',
            'nombre',
            'descripcion',
            'total_productos',
            'activo',
            'fecha_creacion',
        ]
        read_only_fields = [
            'id',
            'activo',
            'fecha_creacion',
        ]


class ProveedorSerializer(NombreUnicoActivoMixin, TotalProductosMixin,
                          serializers.ModelSerializer):
    """Convierte un Proveedor a/desde JSON."""

    class Meta:
        model = Proveedor
        fields = [
            'id',
            'nombre',
            'nit',
            'contacto',
            'telefono',
            'correo',
            'direccion',
            'total_productos',
            'activo',
            'fecha_creacion',
        ]
        read_only_fields = [
            'id',
            'activo',
            'fecha_creacion',
        ]

    def validate_nit(self, value):
        nit = value.strip()
        excluir_pk = self.instance.pk if self.instance is not None else None

        if nit and Proveedor.existe_nit_activo(nit, excluir_pk=excluir_pk):
            raise serializers.ValidationError(
                'Ya existe un proveedor activo con este NIT.'
            )

        return nit


class ProductoSerializer(NombreUnicoActivoMixin, serializers.ModelSerializer):
    """Convierte un Producto a/desde JSON."""

    # Campos calculados de solo lectura (útiles para el frontend)
    stock_bajo = serializers.SerializerMethodField()
    unidad_medida_display = serializers.CharField(
        source='get_unidad_medida_display',
        read_only=True
    )

    # Relaciones: se envía el id; solo se aceptan registros activos.
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.filter(activo=True),
        allow_null=True,
        required=False,
        error_messages={
            'does_not_exist': 'La categoría no existe o está inactiva.',
        }
    )
    proveedor = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.filter(activo=True),
        allow_null=True,
        required=False,
        error_messages={
            'does_not_exist': 'El proveedor no existe o está inactivo.',
        }
    )
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True,
        default=None
    )
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre',
        read_only=True,
        default=None
    )

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'unidad_medida',
            'unidad_medida_display',
            'categoria',
            'categoria_nombre',
            'proveedor',
            'proveedor_nombre',
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