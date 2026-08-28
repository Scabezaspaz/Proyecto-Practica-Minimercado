from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .api_views import (
    ProductoViewSet,
    MovimientoViewSet,
    DashboardAPIView,
    PasswordCheckEmailAPIView,
    PasswordResetAPIView,
    EmailTokenObtainPairView,
)


router = DefaultRouter()
router.register('productos', ProductoViewSet, basename='producto')
router.register('movimientos', MovimientoViewSet, basename='movimiento')


urlpatterns = [

    # Autenticación por token (JWT) — login con correo electrónico
    path(
        'auth/login/',
        EmailTokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    path(
        'auth/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    # Recuperación de contraseña (olvidé mi contraseña)
    path(
        'auth/password/verificar-correo/',
        PasswordCheckEmailAPIView.as_view(),
        name='password_check_email'
    ),

    path(
        'auth/password/restablecer/',
        PasswordResetAPIView.as_view(),
        name='password_reset'
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