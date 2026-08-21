from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .api_views import (
    ProductoViewSet,
    MovimientoViewSet,
    DashboardAPIView,
)


router = DefaultRouter()
router.register('productos', ProductoViewSet, basename='producto')
router.register('movimientos', MovimientoViewSet, basename='movimiento')


urlpatterns = [

    # Autenticación por token (JWT)
    path(
        'auth/login/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    path(
        'auth/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    # Panel principal
    path(
        'dashboard/',
        DashboardAPIView.as_view(),
        name='api_dashboard'
    ),

    # Productos y movimientos (rutas generadas por el router)
    path('', include(router.urls)),
]