"""
Paso 1 de 2 para volver obligatoria la categoría del producto.

Crea (si no existe) la categoría "General" y se la asigna a todos los
productos que aún no tienen categoría. El paso 2 (0012) cambia la
columna a NOT NULL. Se separan porque PostgreSQL no permite alterar la
tabla en la misma transacción en la que se actualizaron sus filas.
"""
from django.db import migrations

NOMBRE_GENERAL = 'General'


def asignar_general(apps, schema_editor):
    Categoria = apps.get_model('inventario', 'Categoria')
    Producto = apps.get_model('inventario', 'Producto')

    sin_categoria = Producto.objects.filter(categoria__isnull=True)
    if not sin_categoria.exists():
        return

    general = (
        Categoria.objects
        .filter(nombre__iexact=NOMBRE_GENERAL, activo=True)
        .first()
    )
    if general is None:
        general = Categoria.objects.create(
            nombre=NOMBRE_GENERAL,
            descripcion='Categoría por defecto para productos sin clasificar.',
        )

    sin_categoria.update(categoria=general)


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0010_categoria_proveedor'),
    ]

    operations = [
        # Reversa sin efecto: los productos conservan su categoría.
        migrations.RunPython(asignar_general, migrations.RunPython.noop),
    ]
