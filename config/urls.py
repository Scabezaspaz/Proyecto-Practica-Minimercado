"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from inventario import views


urlpatterns = [

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