"""
URL configuration for config project.
"""

from django.contrib import admin
from django.urls import path, include

from inventario import views


urlpatterns = [

    # ---- API REST (para el frontend React) ----
    path(
        'api/',
        include('inventario.api_urls')
    ),

    # ---- Sitio con plantillas Django (se mantiene funcionando) ----
    path(
        '',
        views.inicio,
        name='inicio'
    ),

    path(
        'login/',
        views.iniciar_sesion,
        name='login'
    ),

    path(
        'logout/',
        views.cerrar_sesion,
        name='logout'
    ),

    path(
        'productos/',
        views.productos,
        name='productos'
    ),

    path(
        'productos/nuevo/',
        views.nuevo_producto,
        name='nuevo_producto'
    ),

    path(
        'productos/<uuid:producto_id>/editar/',
        views.editar_producto,
        name='editar_producto'
    ),

    path(
        'productos/<uuid:producto_id>/entrada/',
        views.registrar_entrada,
        name='registrar_entrada'
    ),

    path(
        'productos/<uuid:producto_id>/salida/',
        views.registrar_salida,
        name='registrar_salida'
    ),

    path(
        'movimientos/',
        views.movimientos,
        name='movimientos'
    ),

    path(
        'admin/',
        admin.site.urls
    ),
]