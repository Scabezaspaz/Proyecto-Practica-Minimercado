from decimal import Decimal

from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Categoria, Compra, DetalleCompra, Movimiento, Producto, Proveedor
from .services import ItemCompra, RegistroCompraService


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
    # La categoría es obligatoria; el proveedor, opcional.
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.filter(activo=True),
        error_messages={
            'required': 'Selecciona una categoría.',
            'null': 'Selecciona una categoría.',
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
        read_only=True
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
    # Id de la compra que generó esta entrada (si aplica).
    compra = serializers.SerializerMethodField()

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
            'compra',
            'fecha_movimiento',
        ]
        read_only_fields = [
            'id',
            'usuario',
            'fecha_movimiento',
        ]

    def get_compra(self, obj):
        try:
            return str(obj.detalle_compra.compra_id)
        except DetalleCompra.DoesNotExist:
            return None


# ---------------------------------------------------------------------------
# Compras: serializers de lectura y de escritura separados (cada uno con
# una sola responsabilidad).
# ---------------------------------------------------------------------------
class DetalleCompraSerializer(serializers.ModelSerializer):
    """Lectura de una línea de compra."""

    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    unidad_medida = serializers.CharField(source='producto.unidad_medida', read_only=True)

    class Meta:
        model = DetalleCompra
        fields = [
            'id',
            'producto',
            'producto_nombre',
            'unidad_medida',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'movimiento',
        ]
        read_only_fields = fields


class CompraSerializer(serializers.ModelSerializer):
    """Lectura de una compra con su detalle."""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    total_items = serializers.SerializerMethodField()
    detalles = DetalleCompraSerializer(many=True, read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id',
            'proveedor',
            'proveedor_nombre',
            'usuario',
            'usuario_nombre',
            'numero_factura',
            'fecha_compra',
            'fecha_pago',
            'banco_pago',
            'observacion',
            'total',
            'total_items',
            'detalles',
            'fecha_registro',
        ]
        read_only_fields = fields

    def get_total_items(self, obj):
        # Usa el prefetch del queryset (sin consultas extra).
        return len(obj.detalles.all())


class DetalleCompraInputSerializer(serializers.Serializer):
    """Una línea de la compra tal como la envía el frontend."""

    producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(activo=True),
        error_messages={
            'does_not_exist': 'El producto no existe o está inactivo.',
        }
    )
    cantidad = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        error_messages={'min_value': 'La cantidad debe ser mayor que cero.'}
    )
    precio_unitario = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0.00'),
        error_messages={'min_value': 'El precio no puede ser negativo.'}
    )


class CompraCreateSerializer(serializers.Serializer):
    """
    Escritura: valida el formato de la compra y delega el registro al
    servicio de dominio (RegistroCompraService).
    """

    proveedor = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.filter(activo=True),
        error_messages={
            'required': 'Selecciona un proveedor.',
            'null': 'Selecciona un proveedor.',
            'does_not_exist': 'El proveedor no existe o está inactivo.',
        }
    )
    numero_factura = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    fecha_compra = serializers.DateField(required=False, allow_null=True, default=None)
    fecha_pago = serializers.DateField(required=False, allow_null=True, default=None)
    banco_pago = serializers.CharField(max_length=80, required=False, allow_blank=True, default='')
    observacion = serializers.CharField(required=False, allow_blank=True, default='')
    detalles = DetalleCompraInputSerializer(
        many=True,
        allow_empty=False,
        error_messages={'empty': 'Agrega al menos un producto a la compra.'}
    )

    def __init__(self, *args, servicio=None, **kwargs):
        super().__init__(*args, **kwargs)
        # Inversión de dependencias: el servicio se puede inyectar
        # (útil en pruebas); por defecto se usa el real.
        self.servicio = servicio or RegistroCompraService()

    def create(self, validated_data):
        items = [ItemCompra(**detalle) for detalle in validated_data.pop('detalles')]
        return self.servicio.registrar(
            usuario=self.context['request'].user,
            items=items,
            **validated_data,
        )

    def to_representation(self, instance):
        return CompraSerializer(instance, context=self.context).data
