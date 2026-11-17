"""
Fixtures compartidas para las pruebas con pytest.
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from inventario.models import Categoria, Producto, Proveedor

User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente HTTP de DRF sin autenticar."""
    return APIClient()


@pytest.fixture
def usuario(db):
    """Usuario de prueba con correo (para el login por correo)."""
    return User.objects.create_user(
        username='empleado',
        email='empleado@minimercado.com',
        password='clave-segura-123',
    )


@pytest.fixture
def auth_client(api_client, usuario):
    """Cliente ya autenticado como `usuario`."""
    api_client.force_authenticate(user=usuario)
    return api_client


@pytest.fixture
def producto(db, categoria):
    """Producto de prueba con stock inicial de 10 kg (categoría Granos)."""
    return Producto.objects.create(
        nombre='Maíz',
        unidad_medida='kg',
        categoria=categoria,
        stock_actual=Decimal('10.00'),
        stock_minimo=Decimal('2.00'),
    )


@pytest.fixture
def categoria(db):
    """Categoría de prueba."""
    return Categoria.objects.create(
        nombre='Granos',
        descripcion='Granos y cereales',
    )


@pytest.fixture
def proveedor(db):
    """Proveedor de prueba."""
    return Proveedor.objects.create(
        nombre='Finca La Esperanza',
        nit='900123456-7',
        contacto='Ana Pérez',
        telefono='3001234567',
        correo='ventas@laesperanza.com',
    )
