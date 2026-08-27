from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models

from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Producto, Movimiento
from .serializers import ProductoSerializer, MovimientoSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    """
    API de productos: listar, crear, ver, editar y desactivar.
    Soporta búsqueda con ?q=texto
    """

    serializer_class = ProductoSerializer

    def get_queryset(self):
        queryset = Producto.objects.filter(activo=True)

        consulta = self.request.query_params.get('q', '').strip()

        if consulta:
            queryset = queryset.filter(nombre__icontains=consulta)

        return queryset.order_by('nombre')

    def perform_destroy(self, instance):
        # Borrado lógico: el producto se desactiva, no se elimina.
        instance.activo = False
        instance.save(update_fields=['activo'])


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
            'usuario'
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
            if hasattr(error, 'message_dict'):
                raise DRFValidationError(error.message_dict)
            raise DRFValidationError(error.messages)


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
            .select_related('producto', 'usuario')
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