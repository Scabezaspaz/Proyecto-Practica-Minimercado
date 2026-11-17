"""
Paso 2 de 2: la categoría del producto pasa a ser obligatoria (NOT NULL).
Requiere que 0011 haya asignado "General" a los productos sin categoría.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0011_asignar_categoria_general'),
    ]

    operations = [
        migrations.AlterField(
            model_name='producto',
            name='categoria',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='productos',
                to='inventario.categoria',
            ),
        ),
    ]
