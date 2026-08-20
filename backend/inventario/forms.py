from django import forms

from .models import Movimiento, Producto


class ProductoForm(forms.ModelForm):

    class Meta:
        model = Producto

        fields = [
            'nombre',
            'descripcion',
            'unidad_medida',
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


class ProductoEditarForm(forms.ModelForm):

    class Meta:
        model = Producto

        fields = [
            'nombre',
            'descripcion',
            'unidad_medida',
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