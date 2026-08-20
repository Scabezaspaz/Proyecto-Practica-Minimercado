from urllib.parse import urlencode

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import models
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .forms import (
    MovimientoForm,
    ProductoEditarForm,
    ProductoForm,
)
from .models import Movimiento, Producto


def agregar_errores_validacion(formulario, error):
    """
    Agrega los errores provenientes del modelo al formulario
    para que puedan ser mostrados correctamente en la interfaz.
    """

    if hasattr(error, 'message_dict'):

        for campo, mensajes in error.message_dict.items():

            for mensaje in mensajes:

                if campo in formulario.fields:
                    formulario.add_error(
                        campo,
                        mensaje
                    )

                else:
                    formulario.add_error(
                        None,
                        mensaje
                    )

    else:

        for mensaje in error.messages:

            formulario.add_error(
                None,
                mensaje
            )


@login_required(login_url='login')
def inicio(request):

    productos = Producto.objects.filter(
        activo=True
    )

    productos_stock_bajo_lista = productos.filter(
        stock_actual__lte=models.F('stock_minimo')
    ).order_by(
        'nombre'
    )

    total_productos = productos.count()

    productos_stock_bajo = productos_stock_bajo_lista.count()

    total_movimientos = Movimiento.objects.count()

    ultimos_movimientos = (
        Movimiento.objects
        .select_related(
            'producto',
            'usuario'
        )
        .order_by(
            '-fecha_movimiento'
        )[:5]
    )

    contexto = {
        'total_productos': total_productos,
        'productos_stock_bajo': productos_stock_bajo,
        'productos_stock_bajo_lista': productos_stock_bajo_lista,
        'total_movimientos': total_movimientos,
        'ultimos_movimientos': ultimos_movimientos,
    }

    return render(
        request,
        'inventario/inicio.html',
        contexto
    )


@login_required(login_url='login')
def productos(request):

    consulta = request.GET.get(
        'q',
        ''
    ).strip()

    productos = Producto.objects.filter(
        activo=True
    )

    if consulta:

        productos = productos.filter(
            nombre__icontains=consulta
        )

    productos = productos.order_by(
        'nombre'
    )

    productos_stock_bajo_ids = set(
        productos.filter(
            stock_actual__lte=models.F('stock_minimo')
        ).values_list(
            'id',
            flat=True
        )
    )

    contexto = {
        'productos': productos,
        'consulta': consulta,
        'productos_stock_bajo_ids': productos_stock_bajo_ids,
    }

    return render(
        request,
        'inventario/productos.html',
        contexto
    )


@login_required(login_url='login')
def nuevo_producto(request):

    if request.method == 'POST':

        formulario = ProductoForm(
            request.POST
        )

        if formulario.is_valid():

            try:

                formulario.save()

                messages.success(
                    request,
                    'Producto creado correctamente.'
                )

                return redirect(
                    'productos'
                )

            except ValidationError as error:

                agregar_errores_validacion(
                    formulario,
                    error
                )

    else:

        formulario = ProductoForm()

    contexto = {
        'formulario': formulario,
    }

    return render(
        request,
        'inventario/nuevo_producto.html',
        contexto
    )


@login_required(login_url='login')
def editar_producto(request, producto_id):

    producto = get_object_or_404(
        Producto,
        id=producto_id,
        activo=True
    )

    if request.method == 'POST':

        formulario = ProductoEditarForm(
            request.POST,
            instance=producto
        )

        if formulario.is_valid():

            try:

                formulario.save()

                messages.success(
                    request,
                    'Producto actualizado correctamente.'
                )

                return redirect(
                    'productos'
                )

            except ValidationError as error:

                agregar_errores_validacion(
                    formulario,
                    error
                )

    else:

        formulario = ProductoEditarForm(
            instance=producto
        )

    contexto = {
        'producto': producto,
        'formulario': formulario,
    }

    return render(
        request,
        'inventario/editar_producto.html',
        contexto
    )


def registrar_movimiento(
    request,
    producto_id,
    tipo_movimiento,
    template
):

    producto = get_object_or_404(
        Producto,
        id=producto_id,
        activo=True
    )

    if request.method == 'POST':

        formulario = MovimientoForm(
            request.POST
        )

        if formulario.is_valid():

            try:

                movimiento = formulario.save(
                    commit=False
                )

                movimiento.producto = producto
                movimiento.usuario = request.user
                movimiento.tipo_movimiento = tipo_movimiento

                movimiento.save()

                if tipo_movimiento == 'ENTRADA':

                    messages.success(
                        request,
                        'Entrada registrada correctamente.'
                    )

                else:

                    messages.success(
                        request,
                        'Salida registrada correctamente.'
                    )

                return redirect(
                    'productos'
                )

            except ValidationError as error:

                agregar_errores_validacion(
                    formulario,
                    error
                )

    else:

        formulario = MovimientoForm()

    contexto = {
        'producto': producto,
        'formulario': formulario,
    }

    return render(
        request,
        template,
        contexto
    )


@login_required(login_url='login')
def registrar_entrada(request, producto_id):

    return registrar_movimiento(
        request=request,
        producto_id=producto_id,
        tipo_movimiento='ENTRADA',
        template='inventario/registrar_entrada.html'
    )


@login_required(login_url='login')
def registrar_salida(request, producto_id):

    return registrar_movimiento(
        request=request,
        producto_id=producto_id,
        tipo_movimiento='SALIDA',
        template='inventario/registrar_salida.html'
    )


@login_required(login_url='login')
def movimientos(request):

    producto_busqueda = request.GET.get(
        'producto',
        ''
    ).strip()

    tipo = request.GET.get(
        'tipo',
        ''
    ).strip()

    usuario_busqueda = request.GET.get(
        'usuario',
        ''
    ).strip()

    lista_movimientos = (
        Movimiento.objects
        .select_related(
            'producto',
            'usuario'
        )
    )

    if producto_busqueda:

        lista_movimientos = lista_movimientos.filter(
            producto__nombre__icontains=producto_busqueda
        )

    if tipo in [
        'ENTRADA',
        'SALIDA'
    ]:

        lista_movimientos = lista_movimientos.filter(
            tipo_movimiento=tipo
        )

    if usuario_busqueda:

        lista_movimientos = lista_movimientos.filter(
            usuario__username__icontains=usuario_busqueda
        )

    lista_movimientos = lista_movimientos.order_by(
        '-fecha_movimiento'
    )

    paginador = Paginator(
        lista_movimientos,
        20
    )

    numero_pagina = request.GET.get('page')

    movimientos = paginador.get_page(numero_pagina)

    parametros = urlencode({
        'producto': producto_busqueda,
        'tipo': tipo,
        'usuario': usuario_busqueda,
    })

    usuarios = (
        Movimiento.objects
        .values(
            'usuario__id',
            'usuario__username'
        )
        .distinct()
        .order_by(
            'usuario__username'
        )
    )

    contexto = {
        'movimientos': movimientos,
        'producto_busqueda': producto_busqueda,
        'tipo': tipo,
        'usuario_busqueda': usuario_busqueda,
        'usuarios': usuarios,
        'parametros': parametros,
    }

    return render(
        request,
        'inventario/movimientos.html',
        contexto
    )


def iniciar_sesion(request):

    if request.user.is_authenticated:

        return redirect(
            'inicio'
        )

    if request.method == 'POST':

        usuario = request.POST.get(
            'usuario'
        )

        contraseña = request.POST.get(
            'contraseña'
        )

        usuario_autenticado = authenticate(
            request,
            username=usuario,
            password=contraseña
        )

        if usuario_autenticado is not None:

            login(
                request,
                usuario_autenticado
            )

            return redirect(
                'inicio'
            )

        return render(
            request,
            'inventario/login.html',
            {
                'error': (
                    'El usuario o la contraseña '
                    'son incorrectos.'
                )
            }
        )

    return render(
        request,
        'inventario/login.html'
    )


@login_required(login_url='login')
@require_POST
def cerrar_sesion(request):

    logout(request)

    return redirect(
        'login'
    )