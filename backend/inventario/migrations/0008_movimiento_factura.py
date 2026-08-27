from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0007_alter_movimiento_fecha_movimiento'),
    ]

    operations = [
        migrations.AddField(
            model_name='movimiento',
            name='numero_factura',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='movimiento',
            name='fecha_pago_factura',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='movimiento',
            name='banco_pago',
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
