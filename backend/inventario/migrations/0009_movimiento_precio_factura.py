import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0008_movimiento_factura'),
    ]

    operations = [
        migrations.AddField(
            model_name='movimiento',
            name='precio_factura',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=12,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(Decimal('0.00'))
                ],
            ),
        ),
    ]
