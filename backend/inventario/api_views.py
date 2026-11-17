from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models
from django.utils.dateparse import parse_date

from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Categoria, Compra, Movimiento, Producto, Proveedor
from .serializers import (
    CategoriaSerializer,
    CompraCreateSerializer,
    CompraSerializer,
    ProveedorSerializer,
    ProductoSerializer,
    MovimientoSerializer,
    EmailTokenObtainSerializer,
)


class EmailTokenObtainPairView(TokenObtainPairView):
    """Login con correo electrónico en lugar de usuario."""

    serializer_class = EmailTokenObtainSerializer


User = get_user_model()


def traducir_error_validacion(error):
    """
    Convierte un ValidationError de Django (reglas del modelo) en uno de
    DRF, para que la API responda 400 con un mensaje legible.
    """
    if hasattr(error, 'message_dict'):
        return DRFValidationError(error.message_dict)
    return DRFValidationError(error.messages)


class CatalogoViewSet(viewsets.ModelViewSet):
    """
    Base reutilizable para los CRUD del catálogo (productos, categorías,
    proveedores):
    - Lista solo registros activos.
    - Búsqueda con ?q=texto sobre `campos_busqueda`.
    - Borrado lógico: DELETE desactiva el registro (si el modelo lo permite).

    Las subclases solo declaran su modelo/serializer y, si lo necesitan,
    extienden `filtrar_queryset` (principio abierto/cerrado).
    """

    modelo = None
    campos_busqueda = ('nombre',)
    orden = ('nombre',)

    def get_queryset(self):
        queryset = self.modelo.objects.filter(activo=True)
        queryset = self.filtrar_por_busqueda(queryset)
        queryset = self.filtrar_queryset(queryset)
        return queryset.order_by(*self.orden)

    def filtrar_por_busqueda(self, queryset):
        consulta = self.request.query_params.get('q', '').strip()

        if not consulta:
            return queryset

        condicion = models.Q()
        for campo in self.campos_busqueda:
            condicion |= models.Q(**{f'{campo}__icontains': consulta})

        return queryset.filter(condicion)

    def filtrar_queryset(self, queryset):
        """Punto de extensión para filtros propios de cada recurso."""
        return queryset

    def perform_destroy(self, instance):
        try:
            instance.desactivar()
        except DjangoValidationError as error:
            raise traducir_error_validacion(error)


class EntidadConProductosViewSet(CatalogoViewSet):
    """Agrega el conteo de productos activos sin consultas N+1."""

    def filtrar_queryset(self, queryset):
        return queryset.annotate(
            total_productos=models.Count(
                'productos',
                filter=models.Q(productos__activo=True)
            )
        )


class CategoriaViewSet(EntidadConProductosViewSet):
    """
    API de categorías: listar, crear, ver, editar y desactivar.
    Soporta búsqueda con ?q=texto
    """

    modelo = Categoria
    serializer_class = CategoriaSerializer


class ProveedorViewSet(EntidadConProductosViewSet):
    """
    API de proveedores: listar, crear, ver, editar y desactivar.
    Soporta búsqueda con ?q=texto (nombre, NIT o contacto)
    """

    modelo = Proveedor
    serializer_class = ProveedorSerializer
    campos_busqueda = ('nombre', 'nit', 'contacto')


class ProductoViewSet(CatalogoViewSet):
    """
    API de productos: listar, crear, ver, editar y desactivar.
    Soporta búsqueda con ?q=texto y filtros ?categoria=<id> &proveedor=<id>
    """

    modelo = Producto
    serializer_class = ProductoSerializer

    def filtrar_queryset(self, queryset):
        queryset = queryset.select_related('categoria', 'proveedor')

        categoria = self.request.query_params.get('categoria', '').strip()
        proveedor = self.request.query_params.get('proveedor', '').strip()

        try:
            if categoria:
                queryset = queryset.filter(categoria_id=categoria)
            if proveedor:
                queryset = queryset.filter(proveedor_id=proveedor)
        except DjangoValidationError:
            # Id con formato inválido (no es UUID): no hay coincidencias.
            return queryset.none()

        return queryset


class MovimientoViewSet(mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.CreateModelMixin,
                        viewsets.GenericViewSet):
    """
    API de movimientos: listar, ver y crear.
    No permite editar ni eliminar (los movimientos son inmutables).
    Soporta filtros con ?producto= &tipo= &usuario=
    """

    serializer_class = MovimientoSerializer

    def get_queryset(self):
        queryset = Movimiento.objects.select_related(
            'producto',
            'usuario',
            'detalle_compra'
        )

        producto = self.request.query_params.get('producto', '').strip()
        producto_id = self.request.query_params.get('producto_id', '').strip()
        tipo = self.request.query_params.get('tipo', '').strip()
        usuario = self.request.query_params.get('usuario', '').strip()

        # Filtro exacto por id de producto (para el detalle de un producto).
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)

        if producto:
            queryset = queryset.filter(
                producto__nombre__icontains=producto
            )

        if tipo in ('ENTRADA', 'SALIDA'):
            queryset = queryset.filter(tipo_movimiento=tipo)

        if usuario:
            queryset = queryset.filter(
                usuario__username__icontains=usuario
            )

        return queryset.order_by('-fecha_movimiento')

    def perform_create(self, serializer):
        # El usuario se asigna automáticamente según quién está logueado.
        # Si el modelo rechaza el movimiento (ej: stock insuficiente),
        # se traduce el error a una respuesta 400 legible para el frontend.
        try:
            serializer.save(usuario=self.request.user)
        except DjangoValidationError as error:
            raise traducir_error_validacion(error)


class CompraViewSet(mixins.ListModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.CreateModelMixin,
                    viewsets.GenericViewSet):
    """
    API de compras: listar, ver y registrar.
    Las compras son inmutables (no se editan ni se eliminan) porque ya
    generaron entradas de inventario.
    Filtros: ?q= (factura o proveedor) &proveedor=<id> &desde= &hasta= (AAAA-MM-DD)
    """

    def get_serializer_class(self):
        if self.action == 'create':
            return CompraCreateSerializer
        return CompraSerializer

    def get_queryset(self):
        queryset = (
            Compra.objects
            .select_related('proveedor', 'usuario')
            .prefetch_related('detalles__producto')
        )

        params = self.request.query_params
        consulta = params.get('q', '').strip()
        proveedor = params.get('proveedor', '').strip()
        desde = parse_date(params.get('desde', '').strip() or '')
        hasta = parse_date(params.get('hasta', '').strip() or '')

        if consulta:
            queryset = queryset.filter(
                models.Q(numero_factura__icontains=consulta)
                | models.Q(proveedor__nombre__icontains=consulta)
            )

        if proveedor:
            try:
                queryset = queryset.filter(proveedor_id=proveedor)
            except DjangoValidationError:
                return queryset.none()

        if desde:
            queryset = queryset.filter(fecha_compra__gte=desde)

        if hasta:
            queryset = queryset.filter(fecha_compra__lte=hasta)

        return queryset.order_by('-fecha_compra', '-fecha_registro')

    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as error:
            raise traducir_error_validacion(error)


class DashboardAPIView(APIView):
    """
    API del panel principal: totales, alertas de stock bajo
    y últimos movimientos.
    """

    def get(self, request):
        productos = Producto.objects.filter(activo=True)

        stock_bajo = productos.filter(
            stock_actual__lte=models.F('stock_minimo')
        ).order_by('nombre')

        ultimos_movimientos = (
            Movimiento.objects
            .select_related('producto', 'usuario', 'detalle_compra')
            .order_by('-fecha_movimiento')[:5]
        )

        datos = {
            'total_productos': productos.count(),
            'productos_stock_bajo': stock_bajo.count(),
            'total_movimientos': Movimiento.objects.count(),
            'productos_stock_bajo_lista': ProductoSerializer(
                stock_bajo,
                many=True
            ).data,
            'ultimos_movimientos': MovimientoSerializer(
                ultimos_movimientos,
                many=True
            ).data,
        }

        return Response(datos)


class PasswordCheckEmailAPIView(APIView):
    """
    Paso 1 de "olvidé mi contraseña".
    Verifica si existe un usuario activo con el correo indicado.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        correo = str(request.data.get('correo', '')).strip()

        if not correo:
            return Response(
                {'detail': 'Ingresa un correo electrónico.'},
                status=400
            )

        existe = User.objects.filter(
            email__iexact=correo,
            is_active=True
        ).exists()

        return Response({'existe': existe})


class PasswordResetAPIView(APIView):
    """
    Paso 2 de "olvidé mi contraseña".
    Restablece la contraseña de un usuario a partir de su correo.
    Solo procede si el correo existe en la base de datos.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        correo = str(request.data.get('correo', '')).strip()
        nueva = str(request.data.get('nueva_password', ''))

        if not correo:
            return Response(
                {'detail': 'Ingresa un correo electrónico.'},
                status=400
            )

        usuario = User.objects.filter(
            email__iexact=correo,
            is_active=True
        ).first()

        if usuario is None:
            return Response(
                {'detail': 'No existe una cuenta activa con ese correo.'},
                status=404
            )

        # Valida la nueva contraseña con las reglas del proyecto.
        try:
            validate_password(nueva, user=usuario)
        except DjangoValidationError as error:
            return Response(
                {'nueva_password': list(error.messages)},
                status=400
            )

        usuario.set_password(nueva)
        usuario.save(update_fields=['password'])

        return Response(
            {'detail': 'Contraseña actualizada correctamente.'}
        )