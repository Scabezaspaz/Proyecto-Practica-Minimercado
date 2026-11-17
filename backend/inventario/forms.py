from django import forms

from .models import Categoria, Movimiento, Producto


class CategoriaActivaMixin:
    """Limita el desplegable de categoría a las categorías activas."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['categoria'].queryset = Categoria.objects.filter(activo=True)
        self.fields['categoria'].empty_label = 'Selecciona una categoría'


class ProductoForm(CategoriaActivaMixin, forms.ModelForm):

    class Meta:
        model = Producto

        fields = [
            'nombre',
            'descripcion',
            'unidad_medida',
            'categoria',
            'stock_actual',
            'stock_minimo',
        ]

        widgets = {
            'nombre': forms.TextInput(
                attrs={
                    'maxlength': 100,
                    'placeholder': 'Nombre del producto',
                }
            ),

            'descripcion': forms.Textarea(
                attrs={
                    'rows': 4,
                    'placeholder': 'Descripción del producto',
                }
            ),

            'unidad_medida': forms.Select(),

            'stock_actual': forms.NumberInput(
                attrs={
                    'min': '0',
                    'step': '0.01',
                }
            ),

            'stock_minimo': forms.NumberInput(
                attrs={
                    'min': '0',
                    'step': '0.01',
                }
            ),
        }


class ProductoEditarForm(CategoriaActivaMixin, forms.ModelForm):

    class Meta:
        model = Producto

        fields = [
            'nombre',
            'descripcion',
            'unidad_medida',
            'categoria',
            'stock_minimo',
        ]

        widgets = {
            'nombre': forms.TextInput(
                attrs={
                    'maxlength': 100,
                    'placeholder': 'Nombre del producto',
                }
            ),

            'descripcion': forms.Textarea(
                attrs={
                    'rows': 4,
                    'placeholder': 'Descripción del producto',
                }
            ),

            'unidad_medida': forms.Select(),

            'stock_minimo': forms.NumberInput(
                attrs={
                    'min': '0',
                    'step': '0.01',
                }
            ),
        }


class MovimientoForm(forms.ModelForm):

    class Meta:
        model = Movimiento

        fields = [
            'cantidad',
            'observacion',
        ]

        widgets = {
            'cantidad': forms.NumberInput(
                attrs={
                    'min': '0.01',
                    'step': '0.01',
                }
            ),

            'observacion': forms.Textarea(
                attrs={
                    'rows': 4,
                    'placeholder': 'Observación del movimiento',
                }
            ),
        }